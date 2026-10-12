import type { Me, Role } from "@/domain/types";

export type ProfileFailure = {
  status: number;
  code: string;
  message: string;
  field: "first_name" | "role" | null;
};

export type MeResult = { ok: true; me: Me } | { ok: false; status: number };

// Same branches as Theo's pathAfterSignIn. A student stays on /wait.
// has_main_parent does not open /home: that page sends students back to /wait.
export function pathForAccount(me: Me): "/role" | "/wait" | "/home" {
  if (me.role === "student") {
    return "/wait";
  }
  if (me.role === "parent") {
    return "/home";
  }
  return "/role";
}

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

export async function postProfile(input: {
  first_name: string;
  role: Role;
}): Promise<{ ok: true; me: Me } | { ok: false; error: ProfileFailure }> {
  let response: Response;
  try {
    response = await fetch("/api/profile", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        first_name: input.first_name,
        role: input.role,
      }),
    });
  } catch {
    return {
      ok: false,
      error: { status: 0, code: "", message: "", field: null },
    };
  }
  if (!response.ok) {
    return { ok: false, error: await readProfileError(response) };
  }
  try {
    const body: unknown = await response.json();
    if (!isMe(body)) {
      return {
        ok: false,
        error: { status: response.status, code: "", message: "", field: null },
      };
    }
    return { ok: true, me: body };
  } catch {
    return {
      ok: false,
      error: { status: response.status, code: "", message: "", field: null },
    };
  }
}

async function readProfileError(response: Response): Promise<ProfileFailure> {
  let code = "";
  let message = "";
  let field: ProfileFailure["field"] = null;
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const error = (body as { error?: unknown }).error;
      if (error && typeof error === "object") {
        const row = error as Record<string, unknown>;
        if (typeof row.code === "string") {
          code = row.code;
        }
        if (typeof row.message === "string") {
          message = row.message;
        }
        const details = row.details;
        if (details && typeof details === "object" && !Array.isArray(details)) {
          const raw = (details as { field?: unknown }).field;
          if (raw === "first_name" || raw === "role") {
            field = raw;
          }
        }
      }
    }
  } catch {
    message = "";
  }
  return { status: response.status, code, message, field };
}

export async function postSignOut(): Promise<"ok" | "gone" | "error"> {
  try {
    const response = await fetch("/api/sign-out", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (response.status === 204) {
      return "ok";
    }
    if (response.status === 401) {
      return "gone";
    }
    return "error";
  } catch {
    return "error";
  }
}
