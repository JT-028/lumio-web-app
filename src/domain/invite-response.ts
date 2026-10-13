export type SentInviteResponse = {
  id: string;
  invited_email: string;
  expires_at: string;
  state: "sent";
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function sentInviteResponse(source: Record<string, unknown>): SentInviteResponse | null {
  const id = source.id;
  const invitedEmail = source.invited_email;
  const expiresAt = source.expires_at;
  if (typeof id !== "string" || !UUID.test(id)) {
    return null;
  }
  if (typeof invitedEmail !== "string" || invitedEmail.length === 0) {
    return null;
  }
  if (typeof expiresAt !== "string" || expiresAt.length === 0) {
    return null;
  }
  if (source.state !== "sent") {
    return null;
  }
  return {
    id,
    invited_email: invitedEmail,
    expires_at: expiresAt,
    state: "sent",
  };
}