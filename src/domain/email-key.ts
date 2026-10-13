const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

export function sessionEmail(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const email = value.trim().toLowerCase();
  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) {
    return null;
  }
  if (email.includes(" ") || email.includes("\n") || email.includes("\r") || email.includes("\t")) {
    return null;
  }
  const domain = email.slice(at + 1);
  if (!domain || domain.startsWith(".") || domain.endsWith(".")) {
    return null;
  }
  return email;
}

export function emailKey(lowercaseEmail: string): string | null {
  const at = lowercaseEmail.lastIndexOf("@");
  if (at <= 0) {
    return null;
  }
  const domain = lowercaseEmail.slice(at + 1);
  if (!GMAIL_DOMAINS.has(domain)) {
    return lowercaseEmail;
  }
  let local = lowercaseEmail.slice(0, at);
  const plus = local.indexOf("+");
  if (plus >= 0) {
    local = local.slice(0, plus);
  }
  local = local.replaceAll(".", "");
  if (!local) {
    return null;
  }
  return `${local}@gmail.com`;
}

export function parseInvitedGmail(
  value: unknown,
): { email: string; key: string } | null {
  if (typeof value !== "string" || value.length > 320) {
    return null;
  }
  const email = sessionEmail(value);
  if (!email || email.length > 320 || /[\u0000-\u001f\u007f]/.test(email)) {
    return null;
  }
  const domain = email.slice(email.lastIndexOf("@") + 1);
  if (!GMAIL_DOMAINS.has(domain)) {
    return null;
  }
  const key = emailKey(email);
  if (!key || !key.endsWith("@gmail.com")) {
    return null;
  }
  return { email, key };
}
