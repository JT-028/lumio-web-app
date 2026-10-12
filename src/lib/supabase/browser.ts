import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readPublicSupabase } from "@/lib/supabase/public-config";

let client: SupabaseClient | null | undefined;

export function browserSupabase(): SupabaseClient | null {
  if (client !== undefined) {
    return client;
  }
  const config = readPublicSupabase();
  if (!config || typeof window === "undefined") {
    client = null;
    return null;
  }
  client = createBrowserClient(config.url, config.key, {
    isSingleton: true,
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: window.location.protocol === "https:",
    },
    auth: {
      detectSessionInUrl: false,
    },
  });
  return client;
}
