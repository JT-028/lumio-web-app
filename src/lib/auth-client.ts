"use client";

import type { AuthContext, NextPath } from "@/domain/auth-contract";

export class AuthFailure extends Error {
  constructor(public code: string, public field: string | null = null, public retryAfter = 60, public status = 0) { super(code); }
}

export function isNextPath(value: unknown): value is NextPath {
  return typeof value === "string" && (/^\/(home|wait|role)$/.test(value) || /^\/connect\/[A-Za-z0-9_-]{43,128}$/.test(value));
}

export function authMessage(error: unknown): string {
  if (!(error instanceof AuthFailure)) return "We couldn’t connect. Check your connection and try again.";
  switch (error.code) {
    case "INVALID_CREDENTIALS": return "That email and password do not match. Try again.";
    case "EMAIL_UNCONFIRMED": return "Confirm your email to continue.";
    case "RATE_LIMITED": return "Too many attempts. Please wait before trying again.";
    case "AUTH_UNAVAILABLE": case "PROVIDER_UNAVAILABLE": return "Sign-in isn’t available right now. Try again or use email.";
    case "LINK_INVALID": case "LINK_EXPIRED": return "This link can’t be used. Request a new email.";
    case "VALIDATION": return error.field === "password" ? "That password was not accepted. Try a different one." : "Check the highlighted field and try again.";
    default: return "We couldn’t finish. Try again.";
  }
}

// Remove legacy SDK entries by key only. Never read their credential values.
export function clearLegacyAuthStorage() {
  for (const storageName of ["localStorage", "sessionStorage"] as const) {
    try {
      const storage = window[storageName];
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (key && /^sb-.+-auth-token(?:-code-verifier)?(?:\.\d+)?$/.test(key)) storage.removeItem(key);
      }
    } catch { /* Storage may be disabled; no auth flow depends on it. */ }
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, { ...init, credentials: "same-origin", cache: "no-store", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(15000) });
}

async function bodyOf(response: Response): Promise<Record<string, unknown>> {
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthFailure("INTERNAL");
  const row = body as Record<string, unknown>;
  if (!response.ok) {
    const error = row.error as { code?: unknown; details?: { field?: unknown } } | undefined;
    const seconds = Number(response.headers.get("Retry-After"));
    throw new AuthFailure(typeof error?.code === "string" ? error.code : "INTERNAL", typeof error?.details?.field === "string" ? error.details.field : null, Number.isFinite(seconds) && seconds > 0 ? Math.min(3600, Math.ceil(seconds)) : 60, response.status);
  }
  return row;
}

export async function readAuthContext(): Promise<{ context: AuthContext; csrf: string }> {
  clearLegacyAuthStorage();
  const response = await request("/api/auth/context", { headers: { accept: "application/json" } });
  const body = await bodyOf(response);
  const csrf = response.headers.get("X-CSRF-Token");
  const onboarding = body.onboarding as Record<string, unknown> | null;
  if (!csrf || typeof body.authenticated !== "boolean" || !(body.next === null || isNextPath(body.next)) || (body.authenticated && !isNextPath(body.next)) || typeof body.has_continuation !== "boolean" || !["none", "confirmation", "recovery", "invalid"].includes(String(body.link)) || !(onboarding === null || (typeof onboarding?.first_name === "string" && (onboarding.role === "parent" || onboarding.role === "student")))) throw new AuthFailure("INTERNAL");
  return { context: body as unknown as AuthContext, csrf };
}

export async function authPost(path: string, body: object = {}): Promise<Record<string, unknown>> {
  // Acquire a fresh header before each write, including after session rotation.
  const { csrf } = await readAuthContext();
  const response = await request(path, { method: "POST", headers: { accept: "application/json", "Content-Type": "application/json", "X-CSRF-Token": csrf }, body: JSON.stringify(body) });
  if (response.status === 204) return {};
  return bodyOf(response);
}

export function openAccount(result: Record<string, unknown>) {
  if (result.status !== "authenticated" || !isNextPath(result.next)) throw new AuthFailure("INTERNAL");
  window.location.replace(result.next);
}
