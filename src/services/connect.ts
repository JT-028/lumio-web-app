import "server-only";
import { commitAccept, findInviteByHash, type AcceptWrite } from "@/data/connect";
import { emailKey } from "@/domain/email-key";
import type { AcceptResult, ConnectPreview } from "@/domain/types";
import { hashConnectToken } from "@/lib/tokens";
import type { StudentCaller } from "@/services/authz";
import { AppError } from "@/services/errors";

const NOT_FOUND = "This connect link could not be found.";
const LINK_EXPIRED = "This connect link is no longer valid.";
const EMAIL_MISMATCH = "This connect link is for a different email address.";
const ALREADY_USED = "This connect link was already used.";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

export async function previewConnect(rawToken: string): Promise<ConnectPreview> {
  const invite = await loadInvite(rawToken);
  if (invite.state === "sent" && isExpired(invite.expires_at)) {
    throw new AppError("LINK_EXPIRED", 410, LINK_EXPIRED, null);
  }
  if (!invite.parent_first_name) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  return {
    invited_email: invite.invited_email,
    parent_first_name: invite.parent_first_name,
    expires_at: invite.expires_at,
    state: invite.state,
  };
}

export async function acceptConnect(
  student: StudentCaller,
  rawToken: string,
): Promise<AcceptResult> {
  const tokenHash = hashIfToken(rawToken);
  const invite = await loadInvite(rawToken);
  if (invite.state === "sent" && isExpired(invite.expires_at)) {
    throw new AppError("LINK_EXPIRED", 410, LINK_EXPIRED, null);
  }
  const sessionKey = emailKey(student.email_key) ?? student.email_key;
  if (sessionKey !== invite.invited_email_key) {
    throw new AppError("EMAIL_MISMATCH", 403, EMAIL_MISMATCH, null);
  }
  if (
    (invite.state === "accepted" || invite.state === "ignored") &&
    invite.accepted_by_student_id !== student.id
  ) {
    throw new AppError("ALREADY_USED", 409, ALREADY_USED, null);
  }
  if (!tokenHash) {
    throw new AppError("NOT_FOUND", 404, NOT_FOUND, null);
  }
  return mapAccept(
    await commitAccept({
      tokenHash,
      studentId: student.id,
      emailKey: sessionKey,
    }),
    student.id,
  );
}

async function loadInvite(rawToken: string) {
  const tokenHash = hashIfToken(rawToken);
  if (!tokenHash) {
    throw new AppError("NOT_FOUND", 404, NOT_FOUND, null);
  }
  const invite = await findInviteByHash(tokenHash);
  if (!invite) {
    throw new AppError("NOT_FOUND", 404, NOT_FOUND, null);
  }
  return invite;
}

function mapAccept(outcome: AcceptWrite, studentId: string): AcceptResult {
  if (outcome.result === "not_found") {
    throw new AppError("NOT_FOUND", 404, NOT_FOUND, null);
  }
  if (outcome.result === "expired") {
    throw new AppError("LINK_EXPIRED", 410, LINK_EXPIRED, null);
  }
  if (outcome.result === "email_mismatch") {
    throw new AppError("EMAIL_MISMATCH", 403, EMAIL_MISMATCH, null);
  }
  if (outcome.result === "role_not_student") {
    throw new AppError("ROLE_NOT_STUDENT", 403, "Only a student can accept this link.", null);
  }
  if (outcome.result === "already_used") {
    throw new AppError("ALREADY_USED", 409, ALREADY_USED, null);
  }
  if (outcome.student_id !== studentId) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  if (outcome.result === "ignored") {
    return {
      state: "ignored",
      student_id: studentId,
      reason: "MAIN_PARENT_EXISTS",
    };
  }
  return {
    state: "accepted",
    student_id: studentId,
    main_parent_id: outcome.main_parent_id,
  };
}

function hashIfToken(rawToken: string): string | null {
  if (typeof rawToken !== "string" || !TOKEN_PATTERN.test(rawToken)) {
    return null;
  }
  return hashConnectToken(rawToken);
}

function isExpired(expiresAt: string): boolean {
  const time = Date.parse(expiresAt);
  if (Number.isNaN(time)) {
    return true;
  }
  return time <= Date.now();
}
