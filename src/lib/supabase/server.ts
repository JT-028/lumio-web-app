import "server-only";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toNextCookieOptions } from "@/lib/supabase/cookie-options";
import { createSupabaseCookieClient } from "@/lib/supabase/cookie-client";

export async function createSupabaseServerClient(
  request: Request,
): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const secure = new URL(request.url).protocol === "https:";
  return createSupabaseCookieClient({
    secure,
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, toNextCookieOptions(options));
        });
      } catch {
        // Ignored when the cookie store is read-only. src/middleware.ts refreshes the session.
      }
    },
  });
}
