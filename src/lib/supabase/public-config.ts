import { AppError } from "@/services/errors";

export type PublicSupabaseConfig = {
  url: string;
  key: string;
};

export function readPublicSupabase(): PublicSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";
  if (!url || !key) {
    return null;
  }
  return { url, key };
}

export function resolveAppOrigin(_requestUrl?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (configured) {
    try {
      const parsed = new URL(configured);
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
      if (!parsed.username && !parsed.password && parsed.pathname === "/" && !parsed.search && !parsed.hash &&
          (parsed.protocol === "https:" || (parsed.protocol === "http:" && local && process.env.NODE_ENV !== "production"))) {
        return parsed.origin;
      }
    } catch {
      // Fail closed; caller-supplied Host is never a configuration source.
    }
  }
  throw new AppError("AUTH_UNAVAILABLE", 503, "Sign in is temporarily unavailable.");
}
