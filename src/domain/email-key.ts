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
