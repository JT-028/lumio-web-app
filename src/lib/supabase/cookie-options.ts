import type { CookieOptions } from "@supabase/ssr";

export function sessionCookieOptions(secure: boolean): CookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure,
  };
}

type NextCookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

export function toNextCookieOptions(options: CookieOptions): NextCookieOptions {
  let sameSite: NextCookieOptions["sameSite"] = "lax";
  if (
    options.sameSite === "lax" ||
    options.sameSite === "strict" ||
    options.sameSite === "none"
  ) {
    sameSite = options.sameSite;
  } else if (options.sameSite === true) {
    sameSite = "strict";
  }

  const next: NextCookieOptions = {
    httpOnly: options.httpOnly ?? true,
    path: options.path,
    sameSite,
  };
  if (options.domain) {
    next.domain = options.domain;
  }
  if (options.expires instanceof Date) {
    next.expires = options.expires;
  }
  if (typeof options.maxAge === "number") {
    next.maxAge = options.maxAge;
  }
  if (typeof options.secure === "boolean") {
    next.secure = options.secure;
  }
  return next;
}

export function applyAuthCacheHeaders(
  target: Headers,
  extra: Record<string, string>,
): void {
  for (const [name, value] of Object.entries(extra)) {
    target.set(name, value);
  }
  const cache = target.get("Cache-Control") ?? "";
  if (!cache.includes("no-store")) {
    target.set("Cache-Control", "private, no-store");
  }
}
