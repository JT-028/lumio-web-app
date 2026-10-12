import { normalizeFirstName } from "@/domain/name";

const NAME_CHARS = /^[\p{L}\p{M} '\u2019-]+$/u;

export function emailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Enter your email.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function firstNameError(value: string): string | null {
  const trimmed = normalizeFirstName(value);
  if (!trimmed) {
    return "Enter your first name.";
  }
  if (trimmed.length > 40) {
    return "Use 40 characters or fewer.";
  }
  if (trimmed.includes("@") || !NAME_CHARS.test(trimmed)) {
    return "Use letters, spaces, hyphens, or apostrophes only.";
  }
  return null;
}

export function childGmailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Enter your child\u2019s Gmail address.";
  }
  const at = trimmed.lastIndexOf("@");
  const domain = at > 0 ? trimmed.slice(at + 1).toLowerCase() : "";
  const oneAt = at > 0 && trimmed.indexOf("@") === at;
  const gmail = domain === "gmail.com" || domain === "googlemail.com";
  if (!oneAt || !gmail || /\s/.test(trimmed)) {
    return "Enter a Gmail address ending in @gmail.com or @googlemail.com.";
  }
  return null;
}
