import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { parseCookieHeader } from "@supabase/ssr";
import { AppError } from "@/services/errors";
import type { NextPath } from "@/domain/auth-contract";
import { resolveAppOrigin } from "@/lib/supabase/public-config";

export const CSRF_COOKIE = "lumio_csrf";
export const randomToken = () => randomBytes(32).toString("base64url");
export const secureCookies = () => process.env.NODE_ENV === "production" || new URL(resolveAppOrigin()).protocol === "https:";
export function cookieFlags(maxAge: number) {
  return { httpOnly: true, secure: secureCookies(), sameSite: "lax" as const, path: "/", maxAge };
}
export function requestCookies(request: Request) {
  return parseCookieHeader(request.headers.get("cookie") ?? "");
}
export function equalToken(a: string, b: string): boolean {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && left.length <= 512 && timingSafeEqual(left, right);
}
export function assertCsrf(request: Request): void {
  const origin = resolveAppOrigin();
  const token = request.headers.get("x-csrf-token") ?? "";
  const saved = requestCookies(request).find(c => c.name === CSRF_COOKIE)?.value ?? "";
  if (request.headers.get("origin") !== origin ||
      request.headers.get("sec-fetch-site") === "cross-site" ||
      request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json" ||
      !/^[A-Za-z0-9_-]{43}$/.test(token) || !equalToken(token, saved)) {
    throw new AppError("CSRF_REJECTED", 403, "Refresh this page and try again.");
  }
}
export function parseContinuation(value: unknown): NextPath | null {
  if (typeof value !== "string" || value.length > 256) return null;
  return /^(?:\/(?:home|wait|role)|\/connect\/[A-Za-z0-9_-]{43,128})$/.test(value) ? value as NextPath : null;
}
export function exactBody(body: Record<string, unknown>, allowed: string[], required = allowed) {
  if (Object.keys(body).some(k => !allowed.includes(k)) || required.some(k => !(k in body))) {
    throw new AppError("VALIDATION", 400, "The request body is not valid.");
  }
}

// Bound every SDK request, including its response body, without forwarding caller headers.
export const authFetch: typeof fetch = async (input, init) => {
  const signal = AbortSignal.timeout(10_000);
  const response = await fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([signal, init.signal]) : signal });
  const body = await response.arrayBuffer();
  return new Response([204, 205, 304].includes(response.status) ? null : body, { status: response.status, statusText: response.statusText, headers: response.headers });
};
