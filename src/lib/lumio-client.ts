import type { Me, Role } from "@/domain/types";

export type ProfileFailure = {
  status: number;
  code: string;
  message: string;
  field: "first_name" | "role" | null;
};

export type MeResult = { ok: true; me: Me } | { ok: false; status: number };

// A named parent, or a student who already has a main parent, opens /home.
// A student with no main parent stays on /wait. Anyone else stays on /role.
export function pathForAccount(me: Me): "/role" | "/wait" | "/home" {
  if (me.role !== "parent" && me.role !== "student") {
    return "/role";
  }
  if (typeof me.first_name !== "string" || me.first_name.trim() === "") {
    return "/role";
  }
  if (me.role === "student" && !me.has_main_parent) {
    return "/wait";
  }
  return "/home";
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

const INVITE_FAILED = "The connect email could not be sent. Try again.";

export async function postInvite(
  invitedEmail: string,
): Promise<{ ok: true; invited_email: string } | { ok: false; status: number; message: string; field: "invited_email" | null }> {
  let response: Response;
  try {
    response = await fetch("/api/invites", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ invited_email: invitedEmail }),
    });
  } catch {
    return { ok: false, status: 0, message: INVITE_FAILED, field: null };
  }
  if (response.status === 401) {
    return { ok: false, status: 401, message: "", field: null };
  }
  if (response.ok) {
    try {
      const body: unknown = await response.json();
      const invited = inviteEmail(body);
      if (!invited) {
        return { ok: false, status: response.status, message: INVITE_FAILED, field: null };
      }
      return { ok: true, invited_email: invited };
    } catch {
      return { ok: false, status: response.status, message: INVITE_FAILED, field: null };
    }
  }
  const code = await readErrorCode(response);
  return {
    ok: false, status: response.status, message: inviteFailure(code),
    field: code === "INVALID_EMAIL" ? "invited_email" : null,
  };
}

function inviteEmail(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const value = (body as { invited_email?: unknown }).invited_email;
  if (typeof value !== "string") {
    return null;
  }
  const email = value.trim();
  if (!email || email.includes("://") || /\s/.test(email)) {
    return null;
  }
  return email;
}

function inviteFailure(code: string): string {
  if (code === "INVALID_EMAIL") {
    return "Enter a Gmail address ending in @gmail.com or @googlemail.com.";
  }
  if (code === "ROLE_FORBIDDEN") {
    return "Only a parent can send a connect email.";
  }
  if (code === "RATE_LIMITED") {
    return "You have sent too many connect emails this hour. Wait and try again.";
  }
  if (code === "EMAIL_FAILED") {
    return "The connect email could not be sent. Nothing was saved. Try again.";
  }
  if (code === "EMAIL_NOT_CONFIGURED") {
    return "Connect email is not set up yet. Nothing was sent, and no link is shown.";
  }
  return INVITE_FAILED;
}

async function readErrorCode(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("error" in body)) {
      return "";
    }
    const error = (body as { error?: unknown }).error;
    if (!error || typeof error !== "object") {
      return "";
    }
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : "";
  } catch {
    return "";
  }
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
