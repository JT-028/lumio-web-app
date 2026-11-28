import type { Me, Role } from "@/domain/types";

export type MeResult = { ok: true; me: Me } | { ok: false; status: number };

function isRole(value: unknown): value is Role {
  return value === "parent" || value === "student";
}

function isMe(value: unknown): value is Me {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  const roleOk = row.role === null || isRole(row.role);
  const nameOk = row.first_name === null || typeof row.first_name === "string";
  return (
    typeof row.id === "string" &&
    roleOk &&
    nameOk &&
    typeof row.email === "string" &&
    typeof row.has_main_parent === "boolean"
  );
}

export async function getMe(): Promise<MeResult> {
  let response: Response;
  try {
    response = await fetch("/api/me", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
  } catch {
    return { ok: false, status: 0 };
  }
  if (!response.ok) {
    return { ok: false, status: response.status };
  }
  try {
    const body: unknown = await response.json();
    if (!isMe(body)) {
      return { ok: false, status: response.status };
    }
    return { ok: true, me: body };
  } catch {
    return { ok: false, status: response.status };
  }
}
