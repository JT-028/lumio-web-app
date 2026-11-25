import type { CookieOptions } from "@supabase/ssr";

export function sessionCookieOptions(secure: boolean): CookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure,
    maxAge: 604800,
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
  const next: NextCookieOptions = {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || options.secure === true,
  };
  if (options.expires instanceof Date) {
    next.expires = options.expires;
  }
  if (typeof options.maxAge === "number") {
    next.maxAge = Math.min(604800, Math.max(0, options.maxAge));
  } else {
    next.maxAge = 604800;
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
