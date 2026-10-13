import "server-only";
import { countRecentInvites, deleteInvite, insertSentInvite } from "@/data/invites";
import { parseInvitedGmail } from "@/domain/email-key";
import type { SentInviteResponse } from "@/domain/invite-response";
import { isResendConfigured, sendConnectMail } from "@/lib/resend";
import { createConnectToken } from "@/lib/tokens";
import type { ParentCaller } from "@/services/authz";
import { AppError } from "@/services/errors";

// Alex's default: expires_at is created_at plus 7 days.
// A new send inserts a new row. It does not extend an old token.
const CONNECT_LINK_TTL_DAYS = 7;
const CONNECT_LINK_TTL_MS = CONNECT_LINK_TTL_DAYS * 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MAX_INVITES_PER_HOUR = 10;

const INVALID_EMAIL = "Enter a Gmail address ending in @gmail.com or @googlemail.com.";
const EMAIL_NOT_CONFIGURED =
  "Connect email is not set up yet. Nothing was sent, and no link is shown.";
const RATE_LIMITED = "You have sent too many connect emails this hour. Wait and try again.";
const EMAIL_FAILED = "The connect email could not be sent. Nothing was saved. Try again.";

export async function createInvite(
  parent: ParentCaller,
  body: Record<string, unknown>,
): Promise<SentInviteResponse> {
  const invited = parseInvitedGmail(body.invited_email);
  if (!invited) {
    throw new AppError("INVALID_EMAIL", 400, INVALID_EMAIL, { field: "invited_email" });
  }
  if (!isResendConfigured()) {
    throw new AppError("EMAIL_NOT_CONFIGURED", 503, EMAIL_NOT_CONFIGURED, null);
  }
  const origin = configuredAppOrigin();
  if (!origin) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }

  const since = new Date(Date.now() - HOUR_MS).toISOString();
  const recent = await countRecentInvites(parent.id, since);
  if (recent >= MAX_INVITES_PER_HOUR) {
    throw new AppError("RATE_LIMITED", 429, RATE_LIMITED, null);
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + CONNECT_LINK_TTL_MS);
  const token = createConnectToken();
  const stored = await insertSentInvite({
    parentId: parent.id,
    invitedEmail: invited.email,
    invitedEmailKey: invited.key,
    tokenHash: token.hash,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  const connectUrl = `${origin}/connect/${encodeURIComponent(token.raw)}`;
  try {
    await sendConnectMail({
      to: stored.invited_email,
      parentFirstName: parent.first_name,
      connectUrl,
      expiresAt: stored.expires_at,
    });
  } catch (error) {
    try {
      await deleteInvite(stored.id, parent.id);
    } catch {
      throw new AppError("INTERNAL", 500, "Something went wrong.", null);
    }
    if (error instanceof AppError && (error.code === "EMAIL_FAILED" || error.code === "EMAIL_NOT_CONFIGURED")) {
      throw error;
    }
    throw new AppError("EMAIL_FAILED", 502, EMAIL_FAILED, null);
  }

  return {
    id: stored.id,
    invited_email: stored.invited_email,
    expires_at: stored.expires_at,
    state: "sent",
  };
}

function configuredAppOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (!configured) {
    return null;
  }
  try {
    const parsed = new URL(configured);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}