import "server-only";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toNextCookieOptions } from "@/lib/supabase/cookie-options";
import { createSupabaseCookieClient } from "@/lib/supabase/cookie-client";
import { secureCookies } from "@/lib/auth-security";
import { isAuthCookie } from "@/lib/auth-session";

export async function clearServerAuthCookies() {
  const store = await cookies();
  for (const { name } of store.getAll()) {
    if (isAuthCookie(name)) store.set(name, "", { httpOnly: true, secure: secureCookies(), sameSite: "lax", path: "/", maxAge: 0 });
  }
}

export async function createSupabaseServerClient(
  request: Request,
): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const secure = secureCookies();
  return createSupabaseCookieClient({
    secure,
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      // Used by writable API handlers. Do not hide a failed rotation write.
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, toNextCookieOptions(options));
      });
    },
  });
}
