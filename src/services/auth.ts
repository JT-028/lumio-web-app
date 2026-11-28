import "server-only";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { AuthContext, AuthResult, NextPath, Onboarding } from "@/domain/auth-contract";
import type { SessionUser } from "@/domain/types";
import { emailKey, sessionEmail } from "@/domain/email-key";
import { parseFirstName } from "@/domain/name";
import { parseRole } from "@/domain/role";
import { AuthSession, isolatedAuthClient, isPkceCookie } from "@/lib/auth-session";
import { assertCsrf, equalToken, exactBody, parseContinuation, randomToken } from "@/lib/auth-security";
import { STATE, TTL, sealState, validLinkHash, type Intent } from "@/lib/auth-state";
import { resolveAppOrigin, readPublicSupabase } from "@/lib/supabase/public-config";
import { requireSecretKey } from "@/lib/env";
import { AppError, asAppError, errorResponse } from "@/services/errors";
import { createProfile, getMe, readJsonObject } from "@/services/profile";
import { logRequest } from "@/lib/logger";

export type AuthOperation = "context" | "intent" | "sign-in" | "sign-up" | "google" | "resend" | "forgot-password" | "confirm" | "reset-password" | "cancel" | "refresh" | "sign-out";
const unavailable = () => new AppError("AUTH_UNAVAILABLE", 503, "Sign in is temporarily unavailable.");
function configured() {
  try { resolveAppOrigin(); requireSecretKey(); if (!readPublicSupabase()) throw unavailable(); }
  catch { throw unavailable(); }
}
function validation(field?: string): never {
  throw new AppError("VALIDATION", 400, "Check the supplied details.", field ? { field } : null);
}
function emailInput(value: unknown): string {
  if (typeof value !== "string") validation("email");
  const email = sessionEmail(value);
  if (!email || email.length > 254 || !/^[^\s@\u0000-\u001f\u007f]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) validation("email");
  return email;
}
function passwordInput(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 1024) validation("password");
  return value;
}
function onboardingInput(body: Record<string, unknown>): Onboarding {
  const name = parseFirstName(body.first_name);
  const role = parseRole(body.role);
  if (!name.ok) validation("first_name");
  if (!role) validation("role");
  return { first_name: name.name, role };
}
function errorFields(error: unknown) {
  const row = error && typeof error === "object" ? error as Record<string, unknown> : {};
  return { code: typeof row.code === "string" ? row.code : "", status: typeof row.status === "number" ? row.status : 0 };
}
export function providerFailure(error: unknown, mode: "signin" | "signup" | "link" | "google" | "general" = "general"): AppError {
  if (error instanceof AppError) return error;
  const { code, status } = errorFields(error);
  if (status === 429 || ["over_request_rate_limit", "over_email_send_rate_limit"].includes(code)) return new AppError("RATE_LIMITED", 429, "Too many attempts. Try again later.");
  if (mode === "link" && code === "otp_expired") return new AppError("LINK_EXPIRED", 410, "This link is invalid or expired. Request a new link.");
  if (mode === "link" && status >= 400 && status < 500) return new AppError("LINK_INVALID", 400, "This link is invalid or expired. Request a new link.");
  if (code === "email_not_confirmed") return new AppError("EMAIL_UNCONFIRMED", 403, "Confirm your email before signing in.");
  if (mode === "signin" && code === "invalid_credentials") return new AppError("INVALID_CREDENTIALS", 401, "Email or password did not match.");
  if (["weak_password", "validation_failed", "same_password"].includes(code)) return new AppError("VALIDATION", 400, "Choose a valid password.", { field: "password" });
  if (mode === "google" || ["provider_disabled", "oauth_provider_not_supported"].includes(code)) return new AppError("PROVIDER_UNAVAILABLE", 503, "Google sign in is unavailable. Use email instead.");
  return unavailable();
}
async function provider<T extends { error: unknown }>(run: () => Promise<T>, mode: Parameters<typeof providerFailure>[1] = "general"): Promise<T> {
  try { const result = await run(); if (result.error) throw result.error; return result; }
  catch (error) { throw providerFailure(error, mode); }
}
function verifiedIdentity(user: User | null | undefined): SessionUser {
  if (!user || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)) throw unavailable();
  const email = sessionEmail(user.email);
  if (!email || !emailKey(email)) throw unavailable();
  if (!user.email_confirmed_at) throw new AppError("EMAIL_UNCONFIRMED", 403, "Confirm your email before signing in.");
  return { id: user.id, email };
}
async function checkedSession(client: SupabaseClient, session: Session | null | undefined, user: User | null | undefined): Promise<SessionUser> {
  if (!session?.access_token || !session.refresh_token || !user || session.user.id !== user.id || !session.expires_at || session.expires_at * 1000 <= Date.now()) throw unavailable();
  const expected = verifiedIdentity(user);
  const checked = await provider(() => client.auth.getUser());
  const actual = verifiedIdentity(checked.data.user);
  if (expected.id !== actual.id || emailKey(expected.email) !== emailKey(actual.email)) throw unavailable();
  return actual;
}
// Identity failures are a 4xx (not 429) provider answer; everything else (network, status 0,
// unknown status, 429, 5xx, retryable) is transient and must never sign the user out.
export function isTransientAuthError(error: unknown): boolean {
  const row = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const status = row.status;
  const identity = typeof status === "number" && status >= 400 && status < 500 && status !== 429;
  return !identity || row.code === "unexpected_failure" || row.name === "AuthRetryableFetchError";
}
export async function currentIdentity(scope: AuthSession): Promise<SessionUser | null> {
  let result;
  try { result = await scope.client().auth.getUser(); }
  catch (error) { throw providerFailure(error); }
  if (result.error && isTransientAuthError(result.error)) throw providerFailure(result.error);
  let user: SessionUser | null = null;
  if (!result.error) { try { user = verifiedIdentity(result.data.user); } catch { user = null; } }
  if (!user) scope.clearAuth();
  return user;
}
function writeIntent(scope: AuthSession, intent: Intent) {
  if (!Object.keys(intent).length) scope.clear(STATE.intent);
  else scope.set(STATE.intent, sealState("intent", intent, scope.get(STATE.intent)), TTL.intent);
}
export function consumeConnectContinuation(request: Request, path: string, response: Response): Response {
  const scope = new AuthSession(request);
  const intent = scope.state("intent");
  if (intent?.continuation === path) {
    delete intent.continuation;
    writeIntent(scope, intent);
  }
  return scope.apply(response);
}
export async function resolveAuthNext(scope: AuthSession, user: SessionUser): Promise<NextPath> {
  const me = await getMe(user);
  const intent = scope.state("intent");
  if (!me.role) return "/role";
  if (intent?.onboarding || intent?.email || intent?.user_id) writeIntent(scope, intent.continuation ? { continuation: intent.continuation } : {});
  if (intent?.continuation?.startsWith("/connect/")) return intent.continuation;
  return me.role === "student" && !me.has_main_parent ? "/wait" : "/home";
}
async function finalize(scope: AuthSession, user: SessionUser, allowOnboarding: boolean): Promise<AuthResult> {
  const intent = scope.state("intent");
  if (intent?.onboarding) {
    if (allowOnboarding && intent.user_id === user.id && intent.email && emailKey(intent.email) === emailKey(user.email)) {
      try { await createProfile(user, intent.onboarding); }
      catch (error) { if (!(error instanceof AppError) || error.code !== "ROLE_ALREADY_SET") throw error; }
    }
    writeIntent(scope, intent.continuation ? { continuation: intent.continuation } : {});
  }
  scope.set(STATE.marker, sealState("marker", { migrated: true }), TTL.marker);
  scope.csrf(true);
  return { status: "authenticated", next: await resolveAuthNext(scope, user) };
}
function checkEmail() { return Response.json({ status: "check_email" }, { status: 202 }); }
function safeLog(code: string) {
  logRequest({ level: "error", msg: "auth", request_id: crypto.randomUUID(), user_id: null, route: "auth", code, duration_ms: 0 });
}
async function revoke(client: SupabaseClient) {
  try { const result = await client.auth.signOut({ scope: "global" }); if (result.error) safeLog("AUTH_REVOCATION_FAILED"); }
  catch { safeLog("AUTH_REVOCATION_FAILED"); }
}

async function operation(scope: AuthSession, op: AuthOperation): Promise<Response> {
  // Local logout is available even when provider credentials/configuration fail.
  // Origin/CSRF and the exact empty body still precede every cookie mutation.
  if (op === "sign-out") {
    assertCsrf(scope.request);
    exactBody(await readJsonObject(scope.request), []);
    try { await revoke(scope.client()); }
    catch { safeLog("AUTH_REVOCATION_FAILED"); }
    finally { scope.clearAll(); }
    return new Response(null, { status: 204 });
  }
  configured();
  const request = scope.request;
  if (op === "context") {
    if (new URL(request.url).search) validation();
    scope.migrate();
    const csrf = scope.csrf();
    const intent = scope.state("intent");
    const hadLink = !!scope.get(STATE.link);
    const link = scope.state("link");
    scope.state("oauth");
    const user = await currentIdentity(scope);
    const context: AuthContext = {
      authenticated: !!user, next: user ? await resolveAuthNext(scope, user) : null,
      onboarding: user && intent?.user_id === user.id && intent.email && emailKey(intent.email) === emailKey(user.email) ? intent.onboarding ?? null : null,
      has_continuation: !!intent?.continuation,
      link: link ? link.purpose === "signup" ? "confirmation" : "recovery" : hadLink ? "invalid" : "none",
    };
    // Slide the migration marker only here: migrate() ran first, so only a marker valid at request start is extended.
    if (user) scope.set(STATE.marker, sealState("marker", { migrated: true }), TTL.marker);
    return Response.json(context, { headers: { "X-CSRF-Token": csrf } });
  }
  assertCsrf(request);
  const body = await readJsonObject(request);
  const keys: Record<Exclude<AuthOperation, "context" | "sign-out">, string[]> = {
    intent: ["continuation"], "sign-in": ["email", "password"], "sign-up": ["email", "password", "first_name", "role"],
    google: [], resend: ["email"], "forgot-password": ["email"], confirm: [], "reset-password": ["password"], cancel: [], refresh: [],
  };
  exactBody(body, keys[op], op === "intent" ? [] : keys[op]);
  if (op === "intent") {
    const continuation = body.continuation === undefined ? undefined : parseContinuation(body.continuation);
    if (continuation === null) validation("continuation");
    const intent = scope.state("intent") ?? {};
    delete intent.continuation;
    if (continuation) intent.continuation = continuation;
    writeIntent(scope, intent);
    return Response.json({ status: "ready" });
  }
  if (op === "cancel") { scope.clearPending(); return Response.json({ status: "cancelled", next: "/login" }); }
  if (op === "resend" || op === "forgot-password") {
    const email = emailInput(body.email);
    const client = isolatedAuthClient();
    try {
      const result = op === "resend"
        ? await client.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${resolveAppOrigin()}/auth/confirm` } })
        : await client.auth.resetPasswordForEmail(email, { redirectTo: `${resolveAppOrigin()}/auth/recovery` });
      if (result.error) {
        const { status } = errorFields(result.error);
        if (status === 429 || status >= 500 || status === 0) throw providerFailure(result.error);
      }
    } catch (error) {
      // Account-specific failures are concealed; network/rate/service failures remain actionable.
      throw providerFailure(error);
    }
    return checkEmail();
  }
  if (op === "google") {
    const intent = scope.state("intent");
    writeIntent(scope, intent?.continuation ? { continuation: intent.continuation } : {});
    scope.clear(STATE.oauth);
    for (const name of scope.values.keys()) if (isPkceCookie(name)) scope.clear(name);
    const nonce = randomToken();
    const result = await provider(() => scope.client().auth.signInWithOAuth({ provider: "google", options: { skipBrowserRedirect: true, redirectTo: `${resolveAppOrigin()}/auth/callback?flow=oauth&nonce=${nonce}` } }), "google");
    const config = readPublicSupabase();
    if (!result.data.url || !config) throw providerFailure(null, "google");
    const target = new URL(result.data.url);
    if (target.origin !== new URL(config.url).origin || target.pathname !== "/auth/v1/authorize" || target.username || target.password || target.hash || target.searchParams.get("provider") !== "google") throw providerFailure(null, "google");
    if (!Array.from(scope.values.keys()).some(isPkceCookie)) throw providerFailure(null, "google");
    scope.set(STATE.oauth, sealState("oauth", { nonce }), TTL.oauth);
    return Response.json({ status: "redirect", url: target.toString() });
  }
  if (op === "reset-password" || op === "confirm") {
    const link = scope.state("link");
    scope.clear(STATE.link);
    const purpose = op === "confirm" ? "signup" : "recovery";
    if (!link || link.purpose !== purpose) throw new AppError("LINK_INVALID", 400, "This link is invalid or expired. Request a new link.");
    const password = op === "reset-password" ? passwordInput(body.password) : null;
    const isolated = isolatedAuthClient();
    const verified = await provider(() => isolated.auth.verifyOtp({ token_hash: link.token_hash, type: purpose }), "link");
    const user = await checkedSession(isolated, verified.data.session, verified.data.user);
    if (op === "confirm") {
      const session = verified.data.session!;
      const client = scope.client();
      const installed = await provider(() => client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }));
      const installedUser = await checkedSession(client, installed.data.session, installed.data.user);
      if (installedUser.id !== user.id || emailKey(installedUser.email) !== emailKey(user.email)) { scope.clearAuth(); throw unavailable(); }
      return Response.json(await finalize(scope, user, true));
    }
    // This client holds only the freshly verified recovery identity in memory.
    const updated = await provider(() => isolated.auth.updateUser({ password: password! }));
    if (!updated.data.user || updated.data.user.id !== user.id) throw unavailable();
    await revoke(isolated);
    scope.clearAll();
    scope.csrf(true);
    return Response.json({ status: "password_updated", next: "/login?notice=password_updated" });
  }
  if (op === "sign-up") {
    const email = emailInput(body.email), password = passwordInput(body.password), onboarding = onboardingInput(body);
    const previous = scope.state("intent");
    writeIntent(scope, previous?.continuation ? { continuation: previous.continuation } : {});
    const isolated = isolatedAuthClient();
    let result;
    try { result = await isolated.auth.signUp({ email, password, options: { emailRedirectTo: `${resolveAppOrigin()}/auth/confirm` } }); }
    catch (error) { throw providerFailure(error, "signup"); }
    if (result.error) {
      if (["user_already_exists", "email_exists"].includes(errorFields(result.error).code)) return checkEmail();
      throw providerFailure(result.error, "signup");
    }
    const candidate = result.data.user;
    // Supabase returns an obfuscated user with no identities for concealed duplicate signup.
    if (!candidate || !candidate.identities?.length) return checkEmail();
    if (sessionEmail(candidate.email) !== email || !/^[0-9a-f-]{36}$/i.test(candidate.id)) throw unavailable();
    writeIntent(scope, { ...(previous?.continuation ? { continuation: previous.continuation } : {}), email, user_id: candidate.id, onboarding });
    if (!result.data.session) return checkEmail();
    const user = await checkedSession(isolated, result.data.session, candidate);
    const client = scope.client();
    const session = result.data.session;
    const installed = await provider(() => client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }));
    const actual = await checkedSession(client, installed.data.session, installed.data.user);
    if (actual.id !== user.id) { scope.clearAuth(); throw unavailable(); }
    return Response.json(await finalize(scope, actual, true));
  }
  if (op === "sign-in") {
    const email = emailInput(body.email), password = passwordInput(body.password);
    const client = scope.client();
    const result = await provider(() => client.auth.signInWithPassword({ email, password }), "signin");
    const user = await checkedSession(client, result.data.session, result.data.user);
    return Response.json(await finalize(scope, user, true));
  }
  const client = scope.client();
  let refreshed;
  try {
    refreshed = await client.auth.refreshSession();
    if (refreshed.error) {
      const { code, status } = errorFields(refreshed.error);
      if (["refresh_token_not_found", "refresh_token_already_used", "session_not_found", "session_expired"].includes(code) || (status >= 400 && status < 500 && status !== 429)) {
        scope.clearAuth();
        throw new AppError("UNAUTHENTICATED", 401, "Sign in is required.");
      }
      throw refreshed.error;
    }
  } catch (error) { throw providerFailure(error); }
  if (!refreshed.data.session || !refreshed.data.user) { scope.clearAuth(); throw new AppError("UNAUTHENTICATED", 401, "Sign in is required."); }
  return Response.json(await finalize(scope, await checkedSession(client, refreshed.data.session, refreshed.data.user), false));
}

export async function handleAuth(request: Request, op: AuthOperation): Promise<Response> {
  const scope = new AuthSession(request);
  try { return scope.apply(await operation(scope, op)); }
  catch (error) {
    if (["sign-in", "confirm", "sign-up", "refresh"].includes(op) && scope.writes.size && !(error instanceof AppError && error.code === "CSRF_REJECTED")) scope.clearAuth();
    if (op === "google" && scope.writes.size) { scope.clear(STATE.oauth); for (const name of scope.values.keys()) if (isPkceCookie(name)) scope.clear(name); }
    let appError = asAppError(error);
    if (!(error instanceof AppError)) { safeLog("AUTH_UNEXPECTED_FAILURE"); appError = unavailable(); }
    const response = errorResponse(appError);
    if (appError.httpStatus === 429) response.headers.set("Retry-After", "60");
    return scope.apply(response);
  }
}

function callbackRedirect(scope: AuthSession, destination: string) {
  return scope.apply(new Response(null, { status: 303, headers: { Location: destination } }));
}
export async function handleEmailLink(request: Request, purpose: "signup" | "recovery") {
  const scope = new AuthSession(request);
  const page = purpose === "signup" ? "/confirm-email" : "/reset-password";
  scope.clear(STATE.link);
  try {
    configured();
    const query = new URL(request.url).searchParams;
    const hash = query.get("token_hash");
    if (Array.from(query.keys()).some(k => !["type", "token_hash"].includes(k)) || query.getAll("type").length !== 1 || query.getAll("token_hash").length !== 1 || query.get("type") !== purpose || !validLinkHash(hash)) return callbackRedirect(scope, `${page}?error=invalid_link`);
    scope.set(STATE.link, sealState("link", { purpose, token_hash: hash }), TTL.link);
    return callbackRedirect(scope, page);
  } catch { return callbackRedirect(scope, `${page}?error=unavailable`); }
}
export async function handleOAuthCallback(request: Request) {
  const scope = new AuthSession(request);
  let destination = "/login?error=auth";
  const finish = (path: string) => {
    scope.clear(STATE.oauth);
    for (const name of scope.values.keys()) if (isPkceCookie(name)) scope.clear(name);
    return callbackRedirect(scope, path);
  };
  try {
    configured();
    const query = new URL(request.url).searchParams;
    const correlation = scope.state("oauth");
    const nonce = query.get("nonce") ?? "";
    const code = query.get("code");
    const valid = query.getAll("flow").length === 1 && query.get("flow") === "oauth" && query.getAll("nonce").length === 1 && correlation && equalToken(nonce, correlation.nonce) && Array.from(scope.values.keys()).some(isPkceCookie);
    if (!valid) return finish(destination);
    if (query.has("error")) {
      destination = query.get("error") === "access_denied" ? "/login?error=cancelled" : destination;
      return finish(destination);
    }
    if (Array.from(query.keys()).some(k => !["flow", "code", "nonce"].includes(k)) || query.getAll("code").length !== 1 || !code || code.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(code)) return finish(destination);
    const client = scope.client();
    const result = await provider(() => client.auth.exchangeCodeForSession(code), "link");
    const user = await checkedSession(client, result.data.session, result.data.user);
    destination = (await finalize(scope, user, false)).next;
  } catch (error) {
    scope.clearAuth();
    const appError = providerFailure(error);
    if (appError.httpStatus >= 500) destination = "/login?error=unavailable";
  } finally {
    scope.clear(STATE.oauth);
    for (const name of scope.values.keys()) if (isPkceCookie(name)) scope.clear(name);
  }
  return finish(destination);
}
