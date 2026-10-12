import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sessionCookieOptions } from "@/lib/supabase/cookie-options";
import { readPublicSupabase } from "@/lib/supabase/public-config";
import { AppError } from "@/services/errors";

type CookieClientOptions = {
  secure: boolean;
  getAll: () => { name: string; value: string }[];
  setAll: SetAllCookies;
};

export function createSupabaseCookieClient(
  options: CookieClientOptions,
): SupabaseClient {
  const config = readPublicSupabase();
  if (!config) {
    throw new AppError("INTERNAL", 500, "The server is not configured.", null);
  }
  return createServerClient(config.url, config.key, {
    cookieOptions: sessionCookieOptions(options.secure),
    cookies: {
      getAll: options.getAll,
      setAll: options.setAll,
    },
  });
}
