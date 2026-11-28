// Controlled SDK boundary only. Application handlers/state/security remain real.
import { createRequire } from "node:module";
import { mock } from "node:test";
import { pathToFileURL } from "node:url";
import * as ssr from "@supabase/ssr";
import { cookieJar, cookies, rememberSetCookie, resetCookies } from "./cookies.ts";
import { createAdminClient, resetProfiles } from "./memory-db.ts";

export const origin = "https://lumio.example.test";
export const credential = "synthetic-private-access-credential";
export const refreshCredential = "synthetic-private-refresh-credential";
export const sessionCookie = "sb-fixture-auth-token";
export type User = { id: string; email: string; email_confirmed_at?: string; identities?: object[] };
export const defaultUser: User = { id: "00000000-0000-4000-8000-000000000001", email: "ada@example.test", email_confirmed_at: "2026-10-01T00:00:00Z", identities: [{}] };
export const provider = {
  user: { ...defaultUser } as User,
  ordinary: null as User | null,
  confirmationRequired: false,
  error: null as { code: string; message: string; status?: number } | null,
  throws: false,
  signOutThrows: false,
  updateError: false,
  verifyError: null as { code: string; message: string; status?: number } | null,
  calls: [] as { name: string; args: unknown; isolated: boolean }[],
  usedProofs: new Set<string>(),
  clientOptions: [] as Record<string, unknown>[],
  rotations: [] as Cookie[][],
  // SDK `result.error` shape for getUser: status 0 is a network failure, a missing status is AuthUnknownError.
  readError: null as { code?: string; status?: number; name?: string } | null,
};

type Cookie = { name: string; value: string; options?: Record<string, unknown> };
type Options = { cookieOptions?: Record<string, unknown>; cookies?: {
  getAll(): { name: string; value: string }[]; setAll(values: Cookie[], headers?: Record<string, string>): void;
}; auth?: Record<string, unknown> };

function client(options: Options, isolated: boolean) {
  let local: User | null = null;
  const session = () => ({ access_token: credential, refresh_token: refreshCredential,
    expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: "bearer", user: provider.user });
  const call = (name: string, args: unknown) => {
    provider.calls.push({ name, args, isolated });
    if (provider.throws) throw new Error("synthetic-private-provider-error");
  };
  const writeSession = () => {
    local = provider.user;
    if (!isolated) {
      provider.ordinary = provider.user;
      options.cookies?.setAll([{ name: sessionCookie, value: credential, options: options.cookieOptions }], {});
    }
  };
  return { auth: {
    async getUser() {
      call("getUser", {});
      if (provider.readError) return { data: { user: null }, error: provider.readError };
      for (const batch of provider.rotations.splice(0)) options.cookies?.setAll(batch, {});
      const saved = options.cookies?.getAll().some(c => c.name === sessionCookie && [credential, "rotated-credential"].includes(c.value));
      return { data: { user: local ?? (saved ? provider.ordinary : null) }, error: null };
    },
    async getClaims() { call("getClaims", {}); return { data: { claims: {} }, error: null }; },
    async signInWithPassword(args: unknown) {
      call("signInWithPassword", args);
      if (!provider.error) writeSession();
      return { data: { user: provider.error ? null : provider.user, session: provider.error ? null : session() }, error: provider.error };
    },
    async signUp(args: unknown) {
      call("signUp", args);
      if (!provider.error && !provider.confirmationRequired) writeSession();
      return { data: { user: provider.user, session: provider.confirmationRequired || provider.error ? null : session() }, error: provider.error };
    },
    async signInWithOAuth(args: { options?: { redirectTo?: string } }) {
      call("signInWithOAuth", args);
      if (!provider.error) options.cookies?.setAll([{ name: `${sessionCookie}-code-verifier`, value: "synthetic-pkce", options: options.cookieOptions }], {});
      return { data: { url: provider.error ? null : "https://provider.example.test/auth/v1/authorize?provider=google" }, error: provider.error };
    },
    async exchangeCodeForSession(code: string) {
      call("exchangeCodeForSession", code);
      if (!provider.error) writeSession();
      return { data: { user: provider.user, session: provider.error ? null : session() }, error: provider.error };
    },
    async verifyOtp(args: { token_hash: string; type: string }) {
      call("verifyOtp", args);
      if (provider.verifyError) return { data: { user: null, session: null }, error: provider.verifyError };
      if (provider.usedProofs.has(args.token_hash)) return { data: { user: null, session: null }, error: { code: "otp_expired", message: "synthetic-private-provider-error", status: 403 } };
      provider.usedProofs.add(args.token_hash); local = provider.user;
      return { data: { user: provider.user, session: session() }, error: null };
    },
    async setSession(args: unknown) { call("setSession", args); writeSession(); return { data: { user: provider.user, session: session() }, error: null }; },
    async updateUser(args: unknown) {
      call("updateUser", args);
      if (!isolated || !local) throw new Error("password update attempted without isolated recovery identity");
      return { data: { user: local }, error: provider.updateError ? { code: "weak_password", message: "synthetic-private-provider-error", status: 422 } : null };
    },
    async resend(args: unknown) { call("resend", args); return { data: {}, error: provider.error }; },
    async resetPasswordForEmail(...args: unknown[]) { call("resetPasswordForEmail", args); return { data: {}, error: provider.error }; },
    async refreshSession() {
      call("refreshSession", {});
      if (!provider.error && provider.ordinary) {
        local = provider.ordinary;
        options.cookies?.setAll([{ name: sessionCookie, value: "rotated-credential", options: options.cookieOptions }], {});
      }
      return { data: { user: provider.error ? null : provider.ordinary, session: provider.error || !provider.ordinary ? null : session() }, error: provider.error };
    },
    async signOut(args: unknown) {
      provider.calls.push({ name: "signOut", args, isolated });
      if (provider.signOutThrows) throw new Error("synthetic-private-provider-error");
      local = null;
      if (!isolated) { provider.ordinary = null; options.cookies?.setAll([{ name: sessionCookie, value: "", options: { ...options.cookieOptions, maxAge: 0 } }], {}); }
      return { error: null };
    },
  } };
}

export function installProviderFixture() {
  mock.module("server-only", { exports: {} });
  mock.module("next/headers", { exports: { cookies } });
  mock.module("@/lib/supabase/admin", { exports: { createAdminClient } });
  mock.module("@supabase/ssr", { exports: { ...ssr,
    createServerClient(_url: string, _key: string, options: Options) {
      provider.clientOptions.push(options as Record<string, unknown>); return client(options, false);
    },
  } });
  const supabaseJs = {
    createClient(_url: string, _key: string, options: Options) {
      provider.clientOptions.push(options as Record<string, unknown>); return client(options, true);
    },
  };
  mock.module("@supabase/supabase-js", { exports: supabaseJs });
  // supabase-js is a dual package: "import" -> dist/index.mjs, "require" -> dist/index.cjs. tsx loads this
  // CommonJS-typed project through require(). Without the nodejs/node#58231 fix (absent in 24.18, present in
  // 26.12.1) a bare-specifier mock covers only the ESM entry, so mock the require() entry by its resolved URL too.
  mock.module(pathToFileURL(createRequire(import.meta.url).resolve("@supabase/supabase-js")).href, { exports: supabaseJs });
}

export function resetProviderFixture() {
  resetCookies(); resetProfiles();
  provider.user = { ...defaultUser }; provider.ordinary = null; provider.confirmationRequired = false;
  provider.error = null; provider.verifyError = null; provider.throws = false; provider.signOutThrows = false; provider.updateError = false;
  provider.calls.length = 0; provider.clientOptions.length = 0; provider.usedProofs.clear();
  provider.rotations.length = 0; provider.readError = null;
  process.env.NEXT_PUBLIC_APP_URL = origin;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://provider.example.test";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "synthetic-public-key";
  process.env.SUPABASE_SECRET_KEY = "synthetic-server-key";
  globalThis.fetch = (async () => { throw new Error("Live network is forbidden in auth fixtures"); }) as typeof fetch;
}

export function request(path: string, body?: unknown, headers: Record<string, string> = {}) {
  const csrf = cookieJar.find(c => c.name === "lumio_csrf")?.value ?? "";
  return new Request(`${origin}${path}`, { method: body === undefined ? "GET" : "POST",
    headers: { cookie: cookieJar.map(c => `${c.name}=${c.value}`).join("; "),
      ...(body === undefined ? {} : { origin, "content-type": "application/json", "x-csrf-token": csrf }), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
export { cookieJar, rememberSetCookie };
