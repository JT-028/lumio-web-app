import "server-only";
import { deleteInvite, insertSentInviteCapped } from "@/data/invites";
import { parseInvitedGmail } from "@/domain/email-key";
import type { SentInviteResponse } from "@/domain/invite-response";
import { isResendConfigured, sendConnectMail } from "@/lib/resend";
import { resolveAppOrigin } from "@/lib/supabase/public-config";
import { createConnectToken } from "@/lib/tokens";
import type { ParentCaller } from "@/services/authz";
import { AppError } from "@/services/errors";

// The 7-day expiry and the 10-per-hour cap live in SQL (20261013120000, 20261126120000).

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
  let origin: string;
  try {
    origin = resolveAppOrigin();
  } catch {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }

  const token = createConnectToken();
  const outcome = await insertSentInviteCapped({
    parentId: parent.id,
    invitedEmail: invited.email,
    invitedEmailKey: invited.key,
    tokenHash: token.hash,
  });
  if (outcome.result === "rate_limited") {
    throw new AppError("RATE_LIMITED", 429, RATE_LIMITED, null);
  }
  const stored = outcome.invite;

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