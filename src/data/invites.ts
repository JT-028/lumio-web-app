import "server-only";
import { getDb } from "@/data/db";
import { sentInviteResponse, type SentInviteResponse } from "@/domain/invite-response";
import { AppError } from "@/services/errors";

export type SentInviteInsert = {
  parentId: string;
  invitedEmail: string;
  invitedEmailKey: string;
  tokenHash: string;
};

export type CappedInsertResult =
  | { result: "sent"; invite: SentInviteResponse }
  | { result: "rate_limited" };

export async function insertSentInviteCapped(input: SentInviteInsert): Promise<CappedInsertResult> {
  const db = getDb();
  const { data, error } = await db.rpc("create_connect_invite_capped", {
    p_parent_id: input.parentId,
    p_invited_email: input.invitedEmail,
    p_invited_email_key: input.invitedEmailKey,
    p_token_hash: input.tokenHash,
  });
  if (error || !data || typeof data !== "object") {
    throw inviteFailure();
  }
  const row = data as Record<string, unknown>;
  if (row.result === "rate_limited") {
    return { result: "rate_limited" };
  }
  if (row.result !== "sent") {
    throw inviteFailure();
  }
  const invite = sentInviteResponse(row);
  if (!invite || invite.invited_email !== input.invitedEmail) {
    throw inviteFailure();
  }
  return { result: "sent", invite };
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