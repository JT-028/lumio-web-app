import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { requireSecretKey } from "@/lib/env";
import { resolveAppOrigin } from "@/lib/supabase/public-config";
import { parseContinuation } from "@/lib/auth-security";
import { parseFirstName } from "@/domain/name";
import { sessionEmail } from "@/domain/email-key";
import type { NextPath, Onboarding } from "@/domain/auth-contract";

export const STATE = { intent: "lumio_intent", oauth: "lumio_oauth", link: "lumio_link", marker: "lumio_auth_v1" } as const;
export type Intent = { continuation?: NextPath; email?: string; user_id?: string; onboarding?: Onboarding };
export type Link = { purpose: "signup" | "recovery"; token_hash: string };
export type OAuth = { nonce: string };
type Payloads = { intent: Intent; link: Link; oauth: OAuth; marker: { migrated: true } };
type Kind = keyof Payloads;
export const TTL = { intent: 3600, oauth: 600, link: 600, marker: 604800 };
const hashPattern = /^[A-Za-z0-9_-]{20,256}$/;
export const validLinkHash = (value: unknown): value is string => typeof value === "string" && hashPattern.test(value);
function key(kind: Kind) {
  return Buffer.from(hkdfSync("sha256", requireSecretKey(), resolveAppOrigin(), `lumio/auth/v1/${kind}`, 32));
}
function valid(kind: Kind, data: unknown): boolean {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const row = data as Record<string, unknown>;
  const only = (keys: string[]) => Object.keys(row).every(k => keys.includes(k));
  if (kind === "marker") return only(["migrated"]) && row.migrated === true;
  if (kind === "oauth") return only(["nonce"]) && typeof row.nonce === "string" && /^[A-Za-z0-9_-]{43}$/.test(row.nonce);
  if (kind === "link") return only(["purpose", "token_hash"]) && (row.purpose === "signup" || row.purpose === "recovery") && validLinkHash(row.token_hash);
  if (!only(["continuation", "email", "user_id", "onboarding"])) return false;
  if (row.continuation !== undefined && !parseContinuation(row.continuation)) return false;
  if (row.email !== undefined && (typeof row.email !== "string" || row.email.length > 254 || sessionEmail(row.email) !== row.email)) return false;
  if (row.user_id !== undefined && (typeof row.user_id !== "string" || !/^[0-9a-f-]{36}$/i.test(row.user_id))) return false;
  if (row.onboarding !== undefined) {
    const o = row.onboarding as Onboarding;
    if (!o || typeof o !== "object" || Object.keys(o).some(k => !["first_name", "role"].includes(k)) || !parseFirstName(o.first_name).ok || !["parent", "student"].includes(o.role)) return false;
    if (!row.email || !row.user_id) return false;
  }
  return true;
}
export function sealState<K extends Kind>(kind: K, data: Payloads[K], previous?: string): string {
  if (!valid(kind, data)) throw new Error("INVALID_AUTH_STATE");
  const now = Math.floor(Date.now() / 1000);
  const prior = previous ? openEnvelope(kind, previous) : null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(kind), iv);
  cipher.setAAD(Buffer.from(`${resolveAppOrigin()}/${kind}/v1`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ v: 1, iat: prior?.iat ?? now, exp: prior?.exp ?? now + TTL[kind], data }), "utf8"), cipher.final()]);
  const result = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
  if (result.length > 3000) throw new Error("AUTH_STATE_TOO_LARGE");
  return result;
}
export function openState<K extends Kind>(kind: K, value?: string): Payloads[K] | null {
  return openEnvelope(kind, value)?.data as Payloads[K] ?? null;
}
function openEnvelope(kind: Kind, value?: string): { iat: number; exp: number; data: unknown } | null {
  if (!value || value.length > 3000 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const bytes = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(kind), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    decipher.setAAD(Buffer.from(`${resolveAppOrigin()}/${kind}/v1`));
    const row = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (row.v !== 1 || !Number.isInteger(row.iat) || !Number.isInteger(row.exp) || row.iat > now || row.exp <= now || row.exp - row.iat !== TTL[kind] || !valid(kind, row.data)) return null;
    return row;
  } catch { return null; }
}
