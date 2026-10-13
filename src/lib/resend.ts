import "server-only";
import { AppError } from "@/services/errors";

const EMAIL_FAILED = "The connect email could not be sent. Nothing was saved. Try again.";

export type ConnectMail = {
  to: string;
  parentFirstName: string;
  connectUrl: string;
  expiresAt: string;
};

export function isResendConfigured(): boolean {
  return resendConfig() !== null;
}

export async function sendConnectMail(mail: ConnectMail): Promise<void> {
  const config = resendConfig();
  if (!config) {
    throw new AppError(
      "EMAIL_NOT_CONFIGURED",
      503,
      "Connect email is not set up yet. Nothing was sent, and no link is shown.",
      null,
    );
  }

  const text = [
    `${mail.parentFirstName} sent you a Lumio connect link.`,
    "It lasts 7 days.",
    `It expires at ${mail.expiresAt}.`,
    "You still cannot study until you accept.",
    "",
    mail.connectUrl,
    "",
    "If you were not expecting this, you can ignore this email.",
  ].join("\n");

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: [mail.to],
        subject: `${mail.parentFirstName} sent you a Lumio connect link`,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new AppError("EMAIL_FAILED", 502, EMAIL_FAILED, null);
  }

  await discardProviderBody(response);
  if (!response.ok) {
    throw new AppError("EMAIL_FAILED", 502, EMAIL_FAILED, null);
  }
}

function resendConfig(): { apiKey: string; fromEmail: string } | null {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? "";
  if (!apiKey || !fromEmail) {
    return null;
  }
  return { apiKey, fromEmail };
}

async function discardProviderBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    return;
  }
}