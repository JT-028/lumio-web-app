import { NextResponse, type NextRequest } from "next/server";
import { AuthSession, isAuthCookie } from "@/lib/auth-session";
import { toNextCookieOptions } from "@/lib/supabase/cookie-options";
import { readPublicSupabase } from "@/lib/supabase/public-config";
import { logRequest } from "@/lib/logger";
import { currentIdentity, resolveAuthNext } from "@/services/auth";
import { resolveAppOrigin } from "@/lib/supabase/public-config";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Route adapters own API/callback writes. In particular, never call a provider
  // before the mutation handler has rejected an invalid Origin/CSRF token.
  // The outage page itself makes no provider calls, so it cannot loop during an outage.
  if (path === "/resting" || path.startsWith("/api/") || path.startsWith("/auth/")) return NextResponse.next({ request });
  const scope = new AuthSession(request);
  const accountRoute = ["/role", "/home", "/wait"].includes(path);
  const authRoute = ["/login", "/signup"].includes(path);
  let destination: string | null = null;
  let resting = false;
  if (readPublicSupabase()) {
    try {
      const user = await currentIdentity(scope);
      if (!user && accountRoute) destination = "/login";
      if (user && (accountRoute || authRoute)) {
        const next = await resolveAuthNext(scope, user);
        if (next !== path) destination = next;
      }
    } catch {
      // Transient failure: keep every cookie. Identity failures are cleared inside currentIdentity.
      resting = accountRoute || authRoute;
      logRequest({ level: "error", msg: "auth", request_id: crypto.randomUUID(), user_id: null, route: "middleware", code: "AUTH_REFRESH_FAILED", duration_ms: 0 });
    }
  } else {
    resting = accountRoute || authRoute;
  }
  // Accumulate every rotation/deletion before constructing the downstream request.
  // Recreating a response on each SDK setAll would lose earlier cookie chunks.
  for (const [name, write] of scope.writes) {
    if (write.options.maxAge === 0 || !write.value) request.cookies.delete(name);
    else request.cookies.set(name, write.value);
  }
  // Fixed path, no query, built from the request URL rather than config (config may be what failed).
  // Next's middleware adapter rejects a relative Location ("Invalid URL"), so it must be absolute.
  const response = resting
    ? NextResponse.redirect(new URL("/resting", request.url), 303)
    : destination ? NextResponse.redirect(new URL(destination, resolveAppOrigin()), 303) : NextResponse.next({ request });
  for (const [name, { value, options }] of scope.writes) response.cookies.set(name, value, toNextCookieOptions(options));
  if (scope.writes.size || Array.from(scope.values.keys()).some(isAuthCookie) || /^\/(home|role|wait|connect|confirm-email|reset-password|login|signup)(\/|$)/.test(path)) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
  }
  return response;
}

export const runtime = "nodejs";
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
