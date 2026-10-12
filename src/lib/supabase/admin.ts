import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requirePublicSupabase, requireSecretKey } from "@/lib/env";

export function createAdminClient(): SupabaseClient {
  const config = requirePublicSupabase();
  return createClient(config.url, requireSecretKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
