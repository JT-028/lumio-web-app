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
