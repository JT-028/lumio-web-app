import assert from "node:assert/strict";
import { before, beforeEach, test } from "node:test";
import { NextRequest } from "next/server";
import { credential, defaultUser, installProviderFixture, origin, provider, resetProviderFixture, sessionCookie } from "./support/auth-provider.ts";
import { dbFaults, profiles } from "./support/memory-db.ts";
installProviderFixture();
let middleware: typeof import("../src/middleware.ts").middleware;
before(async () => { ({ middleware } = await import("../src/middleware.ts")); });
beforeEach(() => resetProviderFixture());
function signedRequest(path: string) {
  provider.ordinary = defaultUser;
  return new NextRequest(`${origin}${path}`, { headers: { cookie: `${sessionCookie}=${credential}; ${sessionCookie}.0=old; ${sessionCookie}.1=old` } });
}

test("middleware preserves every rotation/deletion batch on request and redirect response", async () => {
  profiles.push({ id: defaultUser.id, email: defaultUser.email, email_key: defaultUser.email, first_name: "Ada", role: "parent" });
  const request = signedRequest("/login");
  provider.rotations.push([{ name: `${sessionCookie}.0`, value: "rotated-first", options: { secure: true, maxAge: 3600 } }],
    [{ name: `${sessionCookie}.1`, value: "", options: { secure: true, maxAge: 0 } }],
    [{ name: sessionCookie, value: credential, options: { secure: true, maxAge: 3600 } }]);
  const response = await middleware(request);
  assert.equal(response.status, 303); assert.equal(response.headers.get("location"), `${origin}/home`);
  assert.equal(request.cookies.get(`${sessionCookie}.0`)?.value, "rotated-first");
  assert.equal(request.cookies.has(`${sessionCookie}.1`), false);
  const writes = response.headers.getSetCookie();
  assert.ok(writes.some(line => line.startsWith(`${sessionCookie}.0=rotated-first`)));
  assert.ok(writes.some(line => line.startsWith(`${sessionCookie}.1=`) && /Max-Age=0/.test(line)));
  for (const line of writes) { assert.match(line, /HttpOnly/i); assert.match(line, /Secure/i); assert.match(line, /SameSite=Lax/i); }
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
});

test("invalid provider session clears all chunks before protected-route redirect", async () => {
  const request = signedRequest("/home"); provider.readError = { code: "refresh_token_not_found", status: 400 };
  const response = await middleware(request);
  assert.equal(response.status, 303); assert.equal(response.headers.get("location"), `${origin}/login`);
  for (const name of [sessionCookie, `${sessionCookie}.0`, `${sessionCookie}.1`]) {
    assert.equal(request.cookies.has(name), false);
    assert.ok(response.headers.getSetCookie().some(line => line.startsWith(`${name}=`) && /Max-Age=0/.test(line)));
  }
});

// ARIA_AUTH_DECISIONS_v1 B1: transient failures keep every auth cookie; account/auth pages rest at /resting.
const chunks = [sessionCookie, `${sessionCookie}.0`, `${sessionCookie}.1`];
function assertSessionKept(response: Response, request: NextRequest) {
  for (const name of chunks) {
    assert.equal(request.cookies.has(name), true, `${name} stays on the downstream request`);
    assert.equal(response.headers.getSetCookie().some(line => line.startsWith(`${name}=`) && /Max-Age=0/i.test(line)), false, `${name} is not expired`);
  }
  assert.equal(request.cookies.get(sessionCookie)?.value, credential);
}
// Fixed same-origin /resting with no query or return URL, built from the request (not config).
// Absolute on purpose: Next's middleware adapter parses Location without a base, so a relative one 500s.
function assertRestingLocation(response: Response, request: NextRequest) {
  assert.equal(response.headers.get("location"), `${origin}/resting`);
  assert.equal(request.nextUrl.origin, origin);
}
function assertResting(response: Response, request: NextRequest) {
  assert.equal(response.status, 303);
  assertRestingLocation(response, request);
  assertSessionKept(response, request);
  assert.match(response.headers.get("cache-control") ?? "", /private, no-store/);
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
}

for (const path of ["/home", "/role", "/wait", "/login", "/signup"]) {
  test(`provider outage on ${path} rests at /resting and keeps every session chunk`, async () => {
    const request = signedRequest(path); provider.readError = { code: "unexpected_failure", status: 503 };
    assertResting(await middleware(request), request);
  });
}

for (const [label, readError] of [
  ["network status 0", { status: 0 }],
  ["unknown status (AuthUnknownError)", { name: "AuthUnknownError" }],
  ["retryable fetch error", { name: "AuthRetryableFetchError", status: 0 }],
  ["rate limit 429", { code: "over_request_rate_limit", status: 429 }],
  ["server 500", { status: 500 }],
  ["unexpected_failure on a 4xx", { code: "unexpected_failure", status: 400 }],
] as const) {
  test(`transient getUser error (${label}) rests at /resting and keeps cookies`, async () => {
    const request = signedRequest("/home"); provider.readError = { ...readError };
    assertResting(await middleware(request), request);
  });
}

test("getUser throwing (network or abort) rests at /resting and keeps cookies", async () => {
  const request = signedRequest("/home"); provider.throws = true;
  assertResting(await middleware(request), request);
});

test("profile DB failure during resolveAuthNext rests at /resting and keeps cookies and SDK rotations", async () => {
  dbFaults.profileRead = { code: "08006" };
  const request = signedRequest("/home");
  provider.rotations.push([{ name: `${sessionCookie}.0`, value: "rotated-first", options: { secure: true, maxAge: 3600 } }]);
  const response = await middleware(request);
  assert.equal(response.status, 303); assertRestingLocation(response, request);
  assert.ok(response.headers.getSetCookie().some(line => line.startsWith(`${sessionCookie}.0=rotated-first`)));
  for (const name of chunks) assert.equal(response.headers.getSetCookie().some(line => line.startsWith(`${name}=`) && /Max-Age=0/i.test(line)), false);
  assert.equal(request.cookies.get(sessionCookie)?.value, credential);
});

test("unverifiable saved profile (InvalidProfileError) rests at /resting and keeps cookies", async () => {
  profiles.push({ id: defaultUser.id, email: defaultUser.email, email_key: defaultUser.email, first_name: null, role: "parent" });
  const request = signedRequest("/login");
  assertResting(await middleware(request), request);
});

test("missing Supabase and app config rests account pages without clearing cookies or calling a provider", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_APP_URL;
  const request = signedRequest("/home");
  assertResting(await middleware(request), request);
  assert.equal(provider.calls.length, 0);
});

for (const path of ["/", `/connect/${"i".repeat(43)}`]) {
  test(`provider outage leaves ${path} reachable with cookies untouched`, async () => {
    const request = signedRequest(path); provider.readError = { status: 0 };
    const response = await middleware(request);
    assert.equal(response.status, 200); assert.equal(response.headers.get("location"), null);
    assertSessionKept(response, request);
  });
}

test("/resting is never redirected and makes zero provider calls, even during an outage or broken config", async () => {
  provider.readError = { status: 0 }; provider.throws = true;
  const outage = await middleware(signedRequest("/resting"));
  assert.equal(outage.status, 200); assert.equal(outage.headers.get("location"), null);
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  const request = signedRequest("/resting");
  const broken = await middleware(request);
  assert.equal(broken.status, 200); assert.equal(broken.headers.get("location"), null);
  assertSessionKept(broken, request);
  assert.equal(provider.calls.length, 0);
});

for (const [label, arrange] of [
  ["bad_jwt 401", () => { provider.readError = { code: "bad_jwt", status: 401 }; }],
  ["session_not_found 403", () => { provider.readError = { code: "session_not_found", status: 403 }; }],
  ["no user and no error", () => { provider.ordinary = null; }],
  ["non-UUID user id", () => { provider.ordinary = { ...defaultUser, id: "not-a-uuid" }; }],
  ["unconfirmed email", () => { provider.ordinary = { ...defaultUser, email_confirmed_at: undefined }; }],
] as const) {
  test(`identity rejection (${label}) clears every chunk and redirects to /login`, async () => {
    const request = signedRequest("/home"); arrange();
    const response = await middleware(request);
    assert.equal(response.status, 303); assert.equal(response.headers.get("location"), `${origin}/login`);
    for (const name of chunks) {
      assert.equal(request.cookies.has(name), false);
      assert.ok(response.headers.getSetCookie().some(line => line.startsWith(`${name}=`) && /Max-Age=0/i.test(line)));
    }
  });
}

// ARIA_AUTH_DECISIONS_v1 C2: only the context operation renews the marker; middleware never runs migrate().
test("middleware never renews the lumio_auth_v1 marker, even on an authenticated pass", async () => {
  profiles.push({ id: defaultUser.id, email: defaultUser.email, email_key: defaultUser.email, first_name: "Ada", role: "parent" });
  for (const path of ["/home", "/login", "/"]) {
    const response = await middleware(signedRequest(path));
    assert.equal(response.headers.getSetCookie().some(line => line.startsWith("lumio_auth_v1=")), false, path);
  }
  assert.ok(provider.calls.some(c => c.name === "getUser"));
});

test("public landing stays public for authenticated users", async () => {
  const response = await middleware(signedRequest("/"));
  assert.equal(response.headers.get("location"), null);
});

test("middleware never calls a provider before JSON mutation CSRF validation", async () => {
  const request = signedRequest("/api/auth/sign-in");
  await middleware(request); assert.equal(provider.calls.length, 0);
});
