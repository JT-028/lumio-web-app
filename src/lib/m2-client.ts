import type { ConnectPreview } from "@/domain/types";

type Failure = { ok: false; status: number; code: string };
type Result<T> = { ok: true; data: T } | Failure;
export type HouseholdHome = {
  role: "parent" | "student";
  first_name: string;
  needs_parent: boolean;
  children: { first_name: string }[];
};

const codes = new Set([
  "NOT_FOUND", "LINK_EXPIRED", "ROLE_REQUIRED", "ROLE_NOT_STUDENT",
  "EMAIL_MISMATCH", "ALREADY_USED",
]);

async function request(path: string, method: "GET" | "POST"): Promise<Result<unknown>> {
  try {
    const response = await fetch(path, {
      method, credentials: "same-origin", cache: "no-store",
      headers: { accept: "application/json" },
      referrerPolicy: "no-referrer",
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = record(record(body)?.error);
      const code = typeof error?.code === "string" && codes.has(error.code) ? error.code : "";
      return { ok: false, status: response.status, code };
    }
    return { ok: true, data: body };
  } catch {
    return { ok: false, status: 0, code: "" };
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
const malformed: Failure = { ok: false, status: 0, code: "" };

export async function getHome(): Promise<Result<HouseholdHome>> {
  const result = await request("/api/home", "GET");
  if (!result.ok) return result;
  const row = record(result.data);
  if (!row || (row.role !== "parent" && row.role !== "student") ||
      typeof row.first_name !== "string" || typeof row.needs_parent !== "boolean" ||
      !Array.isArray(row.children)) return malformed;
  const children: { first_name: string }[] = [];
  for (const child of row.children) {
    const item = record(child);
    if (typeof item?.first_name !== "string") return malformed;
    children.push({ first_name: item.first_name });
  }
  return { ok: true, data: {
    role: row.role, first_name: row.first_name, needs_parent: row.needs_parent, children,
  } };
}

export async function getConnectPreview(token: string): Promise<Result<ConnectPreview>> {
  const result = await request(`/api/connect/${encodeURIComponent(token)}`, "GET");
  if (!result.ok) return result;
  const row = record(result.data);
  if (!row || typeof row.invited_email !== "string" || typeof row.parent_first_name !== "string" ||
      typeof row.expires_at !== "string" ||
      (row.state !== "sent" && row.state !== "accepted" && row.state !== "ignored")) return malformed;
  return { ok: true, data: {
    invited_email: row.invited_email, parent_first_name: row.parent_first_name,
    expires_at: row.expires_at, state: row.state,
  } };
}

export async function acceptConnect(token: string): Promise<Result<"accepted" | "ignored">> {
  const result = await request(`/api/connect/${encodeURIComponent(token)}/accept`, "POST");
  if (!result.ok) return result;
  const state = record(result.data)?.state;
  return state === "accepted" || state === "ignored" ? { ok: true, data: state } : malformed;
}

export function homeRedirect(result: Result<HouseholdHome>): "/" | "/role" | null {
  if (!result.ok && result.status === 401) return "/";
  if (!result.ok && result.status === 403 && result.code === "ROLE_REQUIRED") return "/role";
  return null;
}

export function connectExpiry(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "This link has an end time, and the date could not be shown.";
  }
  return `This link lasts until ${date.toLocaleString()}. Links last 7 days.`;
}
