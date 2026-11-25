import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beforeEach, mock, test } from "node:test";
import {
  cookieJar, credential, defaultUser, installProviderFixture, origin, provider,
  refreshCredential, rememberSetCookie, request, resetProviderFixture, sessionCookie,
} from "./support/auth-provider.ts";
import { inserts, profiles } from "./support/memory-db.ts";

installProviderFixture();
const invite = `/connect/${"i".repeat(43)}`;
const signup = { email: defaultUser.email, password: "fixture-password", first_name: "Ada", role: "student" };

async function route(path: string, body?: unknown, headers?: Record<string, string>) {
  const file = path.split("?")[0];
  const handler = await import(`../src/app${file}/route.ts`);
  const response = await handler[body === undefined ? "GET" : "POST"](request(path, body, headers)) as Response;
  rememberSetCookie(response);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  return response;
}
const post = (operation: string, body: unknown = {}, headers?: Record<string, string>) => route(`/api/auth/${operation}`, body, headers);
async function context() { return route("/api/auth/context"); }
async function body(response: Response) { return await response.json() as Record<string, unknown>; }
async function failure(response: Response, status: number, code: string) {
  assert.equal(response.status, status);
  const result = await body(response);
  const error = result.error as Record<string, unknown>;
  assert.deepEqual(Object.keys(result), ["error"]);
  assert.deepEqual(Object.keys(error).sort(), ["code", "details", "message"]);
  assert.equal(error.code, code);
  assert.doesNotMatch(JSON.stringify(result), /synthetic-private|access_token|refresh_token|token_hash|stack|provider-error/);
}
async function stage(purpose: "signup" | "recovery", hash = "proof".repeat(12)) {
  const path = purpose === "signup" ? "confirm" : "recovery";
  const response = await route(`/auth/${path}?token_hash=${hash}&type=${purpose}`);
  assert.equal(response.status, 303);
  assert.equal(new URL(response.headers.get("location")!, origin).href, `${origin}/${purpose === "signup" ? "confirm-email" : "reset-password"}`);
  assert.equal(provider.calls.filter(c => c.name === "verifyOtp").length, 0);
  return hash;
}
beforeEach(async () => { resetProviderFixture(); await context(); provider.calls.length = 0; });

test("context exposes only public state and issues a one-hour HttpOnly CSRF cookie", async () => {
  const response = await context();
  assert.deepEqual(await body(response), { authenticated: false, next: null, onboarding: null, has_continuation: false, link: "none" });
  const csrf = response.headers.get("x-csrf-token");
  assert.match(csrf ?? "", /^[A-Za-z0-9_-]{43}$/);
  assert.equal(cookieJar.find(c => c.name === "lumio_csrf")?.value, csrf);
  assert.ok(cookieJar.find(c => c.name === "lumio_auth_v1"));
});

for (const operation of ["intent", "sign-in", "sign-up", "google", "resend", "forgot-password", "confirm", "reset-password", "cancel", "refresh"]) {
  test(`${operation} rejects cross-origin writes before calling the provider`, async () => {
    const response = await post(operation, {}, { origin: "https://attacker.example.test" });
    await failure(response, 403, "CSRF_REJECTED");
    assert.equal(provider.calls.length, 0);
  });
}

test("sign-in establishes the shared session without JSON credentials and rotates CSRF", async () => {
  const previousCsrf = cookieJar.find(c => c.name === "lumio_csrf")?.value;
  const response = await post("sign-in", { email: defaultUser.email, password: "fixture-password" });
  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), { status: "authenticated", next: "/role" });
  const session = response.headers.getSetCookie().find(c => c.startsWith(`${sessionCookie}=`));
  assert.ok(session);
  assert.match(session, /HttpOnly/i); assert.match(session, /Secure/i); assert.match(session, /SameSite=Lax/i); assert.match(session, /Path=\//i);
  assert.notEqual(cookieJar.find(c => c.name === "lumio_csrf")?.value, previousCsrf);
  const me = await route("/api/me"); assert.equal(me.status, 200);
  assert.equal((await body(me)).role, null);
  assert.equal((await body(await context())).next, "/role");
});

for (const [providerCode, status, code] of [["invalid_credentials", 401, "INVALID_CREDENTIALS"], ["email_not_confirmed", 403, "EMAIL_UNCONFIRMED"], ["over_request_rate_limit", 429, "RATE_LIMITED"]] as const) {
  test(`sign-in maps ${providerCode} safely`, async () => {
    provider.error = { code: providerCode, message: "synthetic-private-provider-error", status };
    const response = await post("sign-in", { email: defaultUser.email, password: "wrong-fixture" });
    await failure(response, status, code);
    if (status === 429) assert.equal(response.headers.get("retry-after"), "60");
    assert.equal(cookieJar.some(c => c.name === sessionCookie && c.value), false);
  });
}

test("thrown provider failure returns a safe error without an authenticated context", async () => {
  provider.throws = true;
  await failure(await post("sign-in", { email: defaultUser.email, password: "fixture-password" }), 503, "AUTH_UNAVAILABLE");
  provider.throws = false;
  assert.equal((await body(await context())).authenticated, false);
});

for (const extra of [{ confirm: "fixture-password" }, { next: "/home" }, { access_token: credential }]) {
  test(`sign-in rejects unknown input ${Object.keys(extra)[0]}`, async () => {
    await failure(await post("sign-in", { email: defaultUser.email, password: "fixture-password", ...extra }), 400, "VALIDATION");
    assert.equal(provider.calls.length, 0);
  });
}

test("confirmation-disabled signup validates identity and inserts onboarding once", async () => {
  await post("intent", { continuation: invite });
  const response = await post("sign-up", signup);
  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), { status: "authenticated", next: invite });
  assert.equal(inserts.length, 1); assert.equal(inserts[0]?.role, "student");
  assert.equal((await body(await context())).onboarding, null);
  await context(); assert.equal(inserts.length, 1);
});

test("confirmation-required signup installs no session until explicit confirmation", async () => {
  provider.confirmationRequired = true;
  await post("intent", { continuation: invite });
  const sent = await post("sign-up", signup);
  assert.equal(sent.status, 202); assert.deepEqual(await body(sent), { status: "check_email" });
  assert.equal(inserts.length, 0); assert.equal(cookieJar.some(c => c.name === sessionCookie && c.value), false);
  await stage("signup");
  assert.equal((await body(await context())).link, "confirmation");
  assert.equal(inserts.length, 0);
  const confirmed = await post("confirm");
  assert.equal(confirmed.status, 200); assert.equal((await body(confirmed)).next, invite);
  assert.equal(inserts.length, 1); assert.equal(inserts[0]?.role, "student");
  assert.equal(cookieJar.some(c => c.name === "lumio_link"), false);
  assert.equal(provider.calls.some(c => c.name === "verifyOtp" && c.isolated), true);
});

test("signup intent bound to another verified user never creates their profile", async () => {
  provider.confirmationRequired = true;
  await post("sign-up", signup);
  provider.user = { ...defaultUser, id: "00000000-0000-4000-8000-000000000002", email: "other@example.test" };
  await stage("signup");
  const response = await post("confirm");
  assert.equal(response.status, 200); assert.equal((await body(response)).next, "/role");
  assert.equal(inserts.length, 0);
});

test("existing saved name and parent role win over new student onboarding intent", async () => {
  profiles.push({ id: defaultUser.id, email: defaultUser.email, email_key: defaultUser.email, first_name: "Saved", role: "parent" });
  const response = await post("sign-up", signup);
  assert.equal(response.status, 200); assert.equal((await body(response)).next, "/home");
  assert.equal(inserts.length, 0); assert.equal(profiles[0]?.role, "parent"); assert.equal(profiles[0]?.first_name, "Saved");
});

test("concealed duplicate signup discards unbound onboarding", async () => {
  provider.confirmationRequired = true; provider.user = { ...defaultUser, identities: [] };
  const response = await post("sign-up", signup);
  assert.equal(response.status, 202); assert.deepEqual(await body(response), { status: "check_email" });
  assert.equal((await body(await context())).onboarding, null); assert.equal(inserts.length, 0);
});

for (const operation of ["resend", "forgot-password"]) {
  test(`${operation} is neutral for known and unknown account provider responses`, async () => {
    const known = await post(operation, { email: defaultUser.email });
    assert.equal(known.status, 202); const knownBody = await body(known);
    provider.error = { code: "user_not_found", message: "synthetic-private-provider-error", status: 400 };
    const unknown = await post(operation, { email: "missing@example.test" });
    assert.equal(unknown.status, 202); assert.deepEqual(await body(unknown), knownBody);
    assert.deepEqual(knownBody, { status: "check_email" });
  });
}

test("an ordinary session cannot reset a password without recovery proof", async () => {
  await post("sign-in", { email: defaultUser.email, password: "fixture-password" });
  await context();
  await failure(await post("reset-password", { password: "new-fixture-password" }), 400, "LINK_INVALID");
  assert.equal(provider.calls.some(c => c.name === "updateUser"), false);
});

test("signup proof cannot authorize password reset", async () => {
  await stage("signup");
  await failure(await post("reset-password", { password: "new-fixture-password" }), 400, "LINK_INVALID");
  assert.equal(provider.calls.some(c => c.name === "updateUser"), false);
});

test("recovery stages without authentication then updates only the isolated verified identity", async () => {
  await stage("recovery");
  assert.equal((await body(await context())).authenticated, false);
  const response = await post("reset-password", { password: "new-fixture-password" });
  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), { status: "password_updated", next: "/login?notice=password_updated" });
  const updates = provider.calls.filter(c => c.name === "updateUser");
  assert.equal(updates.length, 1); assert.equal(updates[0]?.isolated, true);
  assert.equal(provider.calls.some(c => c.name === "signOut" && (c.args as { scope: string }).scope === "global"), true);
  assert.equal(cookieJar.some(c => c.name === sessionCookie || c.name === "lumio_link"), false);
  assert.ok(provider.clientOptions.some(o => (o.auth as Record<string, unknown>)?.persistSession === false));
});

test("expired provider proof never reaches password update and is cleared", async () => {
  await stage("recovery");
  provider.verifyError = { code: "otp_expired", message: "synthetic-private-provider-error", status: 403 };
  const response = await post("reset-password", { password: "new-fixture-password" });
  assert.ok([400, 410].includes(response.status));
  assert.equal(provider.calls.some(c => c.name === "updateUser"), false);
  assert.equal(cookieJar.some(c => c.name === "lumio_link"), false);
});

test("replayed recovery proof cannot change a second password", async () => {
  const proof = await stage("recovery");
  assert.equal((await post("reset-password", { password: "new-fixture-password" })).status, 200);
  await context(); provider.calls.length = 0;
  await stage("recovery", proof);
  const response = await post("reset-password", { password: "another-fixture-password" });
  assert.ok([400, 410].includes(response.status));
  assert.equal(provider.calls.some(c => c.name === "updateUser"), false);
});

test("failed password update consumes the staged proof and never retries automatically", async () => {
  await stage("recovery"); provider.updateError = true;
  const response = await post("reset-password", { password: "weak-fixture" });
  assert.ok(response.status >= 400);
  assert.equal(provider.calls.filter(c => c.name === "updateUser").length, 1);
  assert.equal(cookieJar.some(c => c.name === "lumio_link"), false);
});

test("recovery of another account never mutates the ordinary signed-in account", async () => {
  await post("sign-in", { email: defaultUser.email, password: "fixture-password" });
  await context();
  provider.user = { ...defaultUser, id: "00000000-0000-4000-8000-000000000099", email: "recovered@example.test" };
  await stage("recovery");
  const response = await post("reset-password", { password: "new-fixture-password" });
  assert.equal(response.status, 200);
  assert.equal(provider.calls.filter(c => c.name === "updateUser").every(c => c.isolated), true);
  assert.equal(cookieJar.some(c => c.name === sessionCookie), false);
});

test("Google start uses server PKCE and callback correlation then requests explicit role", async () => {
  const response = await post("google");
  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), { status: "redirect", url: "https://provider.example.test/auth/v1/authorize?provider=google" });
  const start = provider.calls.find(c => c.name === "signInWithOAuth"); assert.ok(start);
  const options = (start.args as { options: { redirectTo: string; skipBrowserRedirect: boolean } }).options;
  assert.equal(options.skipBrowserRedirect, true);
  const callback = new URL(options.redirectTo);
  assert.equal(callback.origin, origin); assert.equal(callback.searchParams.get("flow"), "oauth");
  assert.match(callback.searchParams.get("nonce") ?? "", /^[A-Za-z0-9_-]{43}$/);
  callback.searchParams.set("code", "synthetic-oauth-code");
  const finished = await route(`${callback.pathname}${callback.search}`);
  assert.equal(finished.status, 303); assert.equal(new URL(finished.headers.get("location")!, origin).href, `${origin}/role`);
  assert.equal(inserts.length, 0);
  assert.equal(cookieJar.some(c => c.name === "lumio_oauth"), false);
});

test("disabled Google provider returns a usable service error", async () => {
  provider.error = { code: "provider_disabled", message: "synthetic-private-provider-error", status: 400 };
  await failure(await post("google"), 503, "PROVIDER_UNAVAILABLE");
});

for (const query of ["flow=oauth&code=fake&nonce=missing", "flow=oauth&code=a&code=b&nonce=x", "error=access_denied", "flow=other&code=a"]) {
  test(`uncorrelated/cancelled OAuth callback is clean and installs no session: ${query}`, async () => {
    const response = await route(`/auth/callback?${query}`);
    assert.equal(response.status, 303);
    assert.match(response.headers.get("location") ?? "", /\/login\?error=(auth|cancelled)$/);
    assert.equal(provider.calls.some(c => c.name === "exchangeCodeForSession"), false);
    assert.equal(cookieJar.some(c => c.name === sessionCookie && c.value), false);
  });
}

test("Google does not consume stale email signup onboarding", async () => {
  provider.confirmationRequired = true; await post("sign-up", signup);
  const started = await post("google"); assert.equal(started.status, 200);
  const start = provider.calls.find(c => c.name === "signInWithOAuth")!;
  const callback = new URL((start.args as { options: { redirectTo: string } }).options.redirectTo);
  callback.searchParams.set("code", "synthetic-oauth-code");
  const response = await route(callback.pathname + callback.search);
  assert.equal(new URL(response.headers.get("location")!, origin).href, `${origin}/role`); assert.equal(inserts.length, 0);
});

test("rejected correlated OAuth attempt expires correlation and PKCE response cookies", async () => {
  await post("google");
  const callback = new URL((provider.calls.find(c => c.name === "signInWithOAuth")!.args as { options: { redirectTo: string } }).options.redirectTo);
  callback.searchParams.set("nonce", "wrong-nonce"); callback.searchParams.set("code", "fake-code");
  const response = await route(callback.pathname + callback.search);
  assert.equal(response.status, 303);
  assert.equal(provider.calls.some(c => c.name === "exchangeCodeForSession"), false);
  assert.equal(cookieJar.some(c => c.name === "lumio_oauth"), false);
  assert.equal(cookieJar.some(c => c.name.endsWith("-code-verifier")), false);
});

test("refresh emits rotated cookies and logout clears locally even when provider throws", async () => {
  await post("sign-in", { email: defaultUser.email, password: "fixture-password" }); await context();
  const refreshed = await post("refresh"); assert.equal(refreshed.status, 200);
  assert.ok(refreshed.headers.getSetCookie().some(c => c.startsWith(`${sessionCookie}=rotated-credential`)));
  await context(); provider.signOutThrows = true;
  const response = await route("/api/sign-out", {}); assert.equal(response.status, 204);
  assert.equal(cookieJar.some(c => c.name === sessionCookie || c.name === "lumio_intent" || c.name === "lumio_link"), false);
  assert.equal((await body(await context())).authenticated, false);
});

test("cancel removes pending continuation without signing out an unrelated session", async () => {
  await post("sign-in", { email: defaultUser.email, password: "fixture-password" }); await context();
  await post("intent", { continuation: invite });
  const response = await post("cancel");
  assert.deepEqual(await body(response), { status: "cancelled", next: "/login" });
  assert.equal((await body(await context())).authenticated, true);
  assert.equal(cookieJar.some(c => c.name === "lumio_intent"), false);
});

test("pending /home never bypasses an unlinked student gate, and saved role is immutable", async () => {
  await post("sign-up", signup); await context();
  await post("intent", { continuation: "/home" });
  assert.equal((await body(await context())).next, "/wait");
  const response = await route("/api/profile", { first_name: "Changed", role: "parent" });
  await failure(response, 409, "ROLE_ALREADY_SET"); assert.equal(profiles[0]?.role, "student");
});

test("cross-device confirmation with no signup intent asks for role instead of inventing it", async () => {
  await stage("signup");
  const response = await post("confirm");
  assert.equal(response.status, 200); assert.equal((await body(response)).next, "/role");
  assert.equal(inserts.length, 0);
});

test("schema-valid existing profile without name or role can finish onboarding exactly once", async () => {
  profiles.push({ id: defaultUser.id, email: defaultUser.email, email_key: defaultUser.email, first_name: null, role: null });
  await post("sign-in", { email: defaultUser.email, password: "fixture-password" }); await context();
  assert.equal((await body(await context())).next, "/role");
  const completed = await route("/api/profile", { first_name: "Ada", role: "student" });
  assert.equal(completed.status, 201);
  assert.equal((await body(completed)).role, "student");
  assert.equal(profiles.length, 1); assert.equal(profiles[0]?.first_name, "Ada");
  assert.equal((await body(await context())).next, "/wait");
  await failure(await route("/api/profile", { first_name: "Changed", role: "parent" }), 409, "ROLE_ALREADY_SET");
  assert.equal(profiles[0]?.role, "student"); assert.equal(profiles[0]?.first_name, "Ada");
});

test("checked-in schema forbids a chosen role with a null or blank name", () => {
  const migration = readFileSync(new URL("../supabase/migrations/20261012120000_profiles.sql", import.meta.url), "utf8");
  assert.match(migration, /profiles_role_requires_name_check\s+check\s*\(\s*role is null or first_name is not null/);
  assert.match(migration, /char_length\(btrim\(first_name\)\) between 1 and 40/);
});

for (const continuation of ["//attacker.test", "/%68ome", "/home?next=//attacker.test", "/connect/short", "/home/../role"]) {
  test(`intent route rejects hostile continuation ${continuation}`, async () => {
    await failure(await post("intent", { continuation }), 400, "VALIDATION");
    assert.equal(cookieJar.some(c => c.name === "lumio_intent"), false);
  });
}
