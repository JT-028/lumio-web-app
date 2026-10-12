import { AppError } from "@/services/errors";
import {
  readPublicSupabase,
  type PublicSupabaseConfig,
} from "@/lib/supabase/public-config";

export function requirePublicSupabase(): PublicSupabaseConfig {
  const config = readPublicSupabase();
  if (!config) {
    throw new AppError("INTERNAL", 500, "The server is not configured.", null);
  }
  return config;
}

export function requireSecretKey(): string {
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";
  if (!key) {
    throw new AppError("INTERNAL", 500, "The server is not configured.", null);
  }
  return key;
}
