import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr";
import { createSupabaseCookieClient } from "@/lib/supabase/cookie-client";
import { requirePublicSupabase } from "@/lib/env";
import { authFetch, cookieFlags, CSRF_COOKIE, randomToken, requestCookies, secureCookies } from "@/lib/auth-security";
import { openState, sealState, STATE, TTL } from "@/lib/auth-state";
import { toNextCookieOptions } from "@/lib/supabase/cookie-options";

export const isAuthCookie = (name: string) => /^sb-.*-auth-token(?:-code-verifier)?(?:\.\d+)?$/.test(name);
export const isPkceCookie = (name: string) => isAuthCookie(name) && name.includes("-code-verifier");
export function isolatedAuthClient() {
  const config = requirePublicSupabase();
  return createClient(config.url, config.key, {
    global: { fetch: authFetch },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType: "pkce" },
  });
}
export class AuthSession {
  readonly values: Map<string, string>;
  readonly writes = new Map<string, { value: string; options: CookieOptions }>();
  constructor(readonly request: Request) {
    this.values = new Map(requestCookies(request).map(c => [c.name, c.value]));
  }
  get(name: string) { return this.values.get(name); }
  set(name: string, value: string, maxAge: number) {
    this.values.set(name, value);
    this.writes.set(name, { value, options: cookieFlags(maxAge) });
  }
  clear(name: string) { this.set(name, "", 0); this.values.delete(name); }
  state<K extends keyof typeof STATE>(kind: K) {
    const raw = this.get(STATE[kind]);
    const value = openState(kind, raw);
    if (raw && !value) this.clear(STATE[kind]);
    return value;
  }
  migrate() {
    if (!this.state("marker")) {
      this.clearAuth();
      this.set(STATE.marker, sealState("marker", { migrated: true }), TTL.marker);
    }
  }
  clearAuth() { for (const name of this.values.keys()) if (isAuthCookie(name)) this.clear(name); }
  clearPending() {
    for (const kind of ["intent", "link", "oauth"] as const) this.clear(STATE[kind]);
    for (const name of this.values.keys()) if (isPkceCookie(name)) this.clear(name);
  }
  clearAll() { this.clearAuth(); this.clearPending(); this.clear(CSRF_COOKIE); }
  csrf(rotate = false) {
    let token = this.get(CSRF_COOKIE);
    if (rotate || !token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      token = randomToken(); this.set(CSRF_COOKIE, token, 3600);
    }
    return token;
  }
  client() {
    return createSupabaseCookieClient({
      secure: secureCookies(),
      getAll: () => Array.from(this.values, ([name, value]) => ({ name, value })),
      setAll: cookies => {
        for (const { name, value, options } of cookies) {
          this.values.set(name, value);
          this.writes.set(name, { value, options });
        }
      },
    });
  }
  apply(response: Response): NextResponse {
    const result = new NextResponse(response.body, { status: response.status, headers: response.headers });
    result.headers.set("Cache-Control", "private, no-store");
    result.headers.set("Referrer-Policy", "no-referrer");
    result.headers.set("X-Content-Type-Options", "nosniff");
    for (const [name, { value, options }] of this.writes) result.cookies.set(name, value, toNextCookieOptions(options));
    return result;
  }
}
