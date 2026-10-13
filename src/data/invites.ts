import "server-only";
import { getDb } from "@/data/db";
import { sentInviteResponse, type SentInviteResponse } from "@/domain/invite-response";
import { AppError } from "@/services/errors";

const RETURN_COLUMNS = "id, invited_email, expires_at, state";

export type SentInviteInsert = {
  parentId: string;
  invitedEmail: string;
  invitedEmailKey: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
};

export async function countRecentInvites(parentId: string, sinceIso: string): Promise<number> {
  const db = getDb();
  const { count, error } = await db
    .from("connect_invites")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", parentId)
    .gte("created_at", sinceIso);
  if (error || count === null) {
    throw inviteFailure();
  }
  return count;
}

export async function insertSentInvite(input: SentInviteInsert): Promise<SentInviteResponse> {
  const db = getDb();
  const { data, error } = await db
    .from("connect_invites")
    .insert({
      parent_id: input.parentId,
      invited_email: input.invitedEmail,
      invited_email_key: input.invitedEmailKey,
      token_hash: input.tokenHash,
      state: "sent",
      created_at: input.createdAt,
      expires_at: input.expiresAt,
    })
    .select(RETURN_COLUMNS)
    .single();
  if (error || !data || typeof data !== "object") {
    throw inviteFailure();
  }
  const row = sentInviteResponse(data as Record<string, unknown>);
  if (!row || row.invited_email !== input.invitedEmail) {
    throw inviteFailure();
  }
  return row;
}

export async function deleteInvite(id: string, parentId: string): Promise<void> {
  const db = getDb();
  const { error, count } = await db
    .from("connect_invites")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("parent_id", parentId);
  if (error || count !== 1) {
    throw inviteFailure();
  }
}

function inviteFailure(): AppError {
  return new AppError("INTERNAL", 500, "Something went wrong.", null);
}