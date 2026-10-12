const NAME_CHARS = /^[\p{L}\p{M} '\u2019-]+$/u;
const HAS_LETTER = /\p{L}/u;

// A pasted accent can be a letter plus a mark. The profile check allows letters only.
export function normalizeFirstName(value: string): string {
  return value.trim().normalize("NFC");
}

export function parseFirstName(
  value: unknown,
): { ok: true; name: string } | { ok: false } {
  if (typeof value !== "string") {
    return { ok: false };
  }
  const name = normalizeFirstName(value);
  if (name.length < 1 || name.length > 40 || name.includes("@")) {
    return { ok: false };
  }
  if (!NAME_CHARS.test(name) || !HAS_LETTER.test(name)) {
    return { ok: false };
  }
  return { ok: true, name };
}
