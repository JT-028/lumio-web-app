import "server-only";
import { getDb } from "@/data/db";
import { isUuid } from "@/domain/ids";
import { AppError } from "@/services/errors";

export type InviteRecord = {
  id: string;
  parent_id: string;
  invited_email: string;
  invited_email_key: string;
  state: "sent" | "accepted" | "ignored";
  expires_at: string;
  accepted_by_student_id: string | null;
  parent_first_name: string | null;
};

export type AcceptWrite =
  | { result: "accepted"; student_id: string; main_parent_id: string }
  | { result: "ignored"; student_id: string; reason: "MAIN_PARENT_EXISTS" }
  | { result: "not_found" }
  | { result: "expired" }
  | { result: "email_mismatch" }
  | { result: "already_used" }
  | { result: "role_not_student" };

const INVITE_COLUMNS =
  "id, parent_id, invited_email, invited_email_key, state, expires_at, accepted_by_student_id";

export async function findInviteByHash(tokenHash: string): Promise<InviteRecord | null> {
  const db = getDb();
  const { data, error } = await db
    .from("connect_invites")
    .select(INVITE_COLUMNS)
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) {
    throw failure();
  }
  if (!data) {
    return null;
  }
  const invite = parseInvite(data);
  invite.parent_first_name = await parentFirstName(invite.parent_id);
  return invite;
}

export async function commitAccept(input: {
  tokenHash: string;
  studentId: string;
  emailKey: string;
}): Promise<AcceptWrite> {
  const db = getDb();
  const { data, error } = await db.rpc("accept_connect_invite", {
    p_token_hash: input.tokenHash,
    p_student_id: input.studentId,
    p_email_key: input.emailKey,
  });
  if (error || !data || typeof data !== "object") {
    throw failure();
  }
  return parseAccept(data);
}

async function parentFirstName(parentId: string): Promise<string | null> {
  const db = getDb();
  const { data, error } = await db
    .from("profiles")
    .select("id, first_name, role")
    .eq("id", parentId)
    .maybeSingle();
  if (error) {
    throw failure();
  }
  if (!data || typeof data !== "object") {
    return null;
  }
  const row = data as Record<string, unknown>;
  if (row.role !== "parent" || typeof row.first_name !== "string" || row.first_name.length === 0) {
    return null;
  }
  return row.first_name;
}

function parseInvite(data: unknown): InviteRecord {
  if (!data || typeof data !== "object") {
    throw failure();
  }
  const row = data as Record<string, unknown>;
  if (!isUuid(row.id) || !isUuid(row.parent_id)) {
    throw failure();
  }
  if (typeof row.invited_email !== "string" || typeof row.invited_email_key !== "string") {
    throw failure();
  }
  if (typeof row.expires_at !== "string" || row.expires_at.length === 0) {
    throw failure();
  }
  if (row.state !== "sent" && row.state !== "accepted" && row.state !== "ignored") {
    throw failure();
  }
  const acceptedBy = row.accepted_by_student_id;
  if (acceptedBy !== null && !isUuid(acceptedBy)) {
    throw failure();
  }
  return {
    id: row.id,
    parent_id: row.parent_id,
    invited_email: row.invited_email,
    invited_email_key: row.invited_email_key,
    state: row.state,
    expires_at: row.expires_at,
    accepted_by_student_id: acceptedBy,
    parent_first_name: null,
  };
}

function parseAccept(data: object): AcceptWrite {
  const row = data as Record<string, unknown>;
  if (row.result === "not_found" || row.result === "expired" || row.result === "email_mismatch") {
    return { result: row.result };
  }
  if (row.result === "already_used" || row.result === "role_not_student") {
    return { result: row.result };
  }
  if (row.result === "ignored") {
    if (!isUuid(row.student_id) || row.reason !== "MAIN_PARENT_EXISTS") {
      throw failure();
    }
    return {
      result: "ignored",
      student_id: row.student_id,
      reason: "MAIN_PARENT_EXISTS",
    };
  }
  if (row.result === "accepted") {
    if (!isUuid(row.student_id) || !isUuid(row.main_parent_id)) {
      throw failure();
    }
    return {
      result: "accepted",
      student_id: row.student_id,
      main_parent_id: row.main_parent_id,
    };
  }
  throw failure();
}

function failure(): AppError {
  return new AppError("INTERNAL", 500, "Something went wrong.", null);
}
