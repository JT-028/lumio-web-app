import { NextResponse, type NextRequest } from "next/server";
import { applyAuthCacheHeaders, toNextCookieOptions } from "@/lib/supabase/cookie-options";
import { createSupabaseCookieClient } from "@/lib/supabase/cookie-client";
import { logRequest } from "@/lib/logger";
import { readPublicSupabase } from "@/lib/supabase/public-config";

export async function middleware(request: NextRequest) {
  const started = Date.now();
  let supabaseResponse = NextResponse.next({ request });
  if (!readPublicSupabase()) {
    return supabaseResponse;
  }

  const secure = request.nextUrl.protocol === "https:";
  try {
    const supabase = createSupabaseCookieClient({
      secure,
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, toNextCookieOptions(options));
        });
        applyAuthCacheHeaders(supabaseResponse.headers, headers);
      },
    });
    await supabase.auth.getClaims();
  } catch {
    logRequest({
      level: "error",
      msg: "request",
      request_id: crypto.randomUUID(),
      user_id: null,
      route: "middleware",
      code: "AUTH_REFRESH",
      duration_ms: Date.now() - started,
    });
  }

  return supabaseResponse;
}

export const runtime = "nodejs";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
