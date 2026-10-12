import { NextResponse } from "next/server";
import { parseCookieHeader } from "@supabase/ssr";
import { applyAuthCacheHeaders, toNextCookieOptions } from "@/lib/supabase/cookie-options";
import { createSupabaseCookieClient } from "@/lib/supabase/cookie-client";
import { logRequest } from "@/lib/logger";
import { resolveAppOrigin } from "@/lib/supabase/public-config";
import { userFromClient } from "@/services/authz";
import { pathAfterSignIn } from "@/services/profile";

export const dynamic = "force-dynamic";

// OAuth exchanges the code and sets cookies. It does not insert a profile.
export async function GET(request: Request) {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  let userId: string | null = null;
  let code = "OK";

  const origin = resolveAppOrigin(request.url);
  const response = NextResponse.redirect(new URL("/?error=auth", origin));
  response.headers.set("Cache-Control", "private, no-store");

  const url = new URL(request.url);
  const oauthCode = url.searchParams.get("code");

  try {
    if (!oauthCode || url.searchParams.get("error")) {
      code = "AUTH_CALLBACK";
    } else {
      const supabase = createSupabaseCookieClient({
        secure: url.protocol === "https:",
        getAll() {
          return parseCookieHeader(request.headers.get("cookie") ?? "");
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, toNextCookieOptions(options));
          });
          applyAuthCacheHeaders(response.headers, headers);
        },
      });
      const exchanged = await supabase.auth.exchangeCodeForSession(oauthCode);
      if (exchanged.error) {
        code = "AUTH_CALLBACK";
      } else {
        const user = await userFromClient(supabase);
        userId = user.id;
        try {
          const path = await pathAfterSignIn(user);
          response.headers.set("Location", new URL(path, origin).toString());
        } catch {
          code = "INTERNAL";
          response.headers.set(
            "Location",
            new URL("/?error=unavailable", origin).toString(),
          );
        }
      }
    }
  } catch {
    code = "INTERNAL";
    response.headers.set("Location", new URL("/?error=unavailable", origin).toString());
  }

  logRequest({
    level: code === "INTERNAL" ? "error" : "info",
    msg: "request",
    request_id: requestId,
    user_id: userId,
    route: "GET /auth/callback",
    code,
    duration_ms: Date.now() - started,
  });
  return response;
}
