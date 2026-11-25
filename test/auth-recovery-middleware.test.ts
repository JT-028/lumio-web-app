import assert from "node:assert/strict";
import { before, beforeEach, test } from "node:test";
import { NextRequest } from "next/server";
import { credential, defaultUser, installProviderFixture, origin, provider, resetProviderFixture, sessionCookie } from "./support/auth-provider.ts";
import { profiles } from "./support/memory-db.ts";
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

test("provider outage returns unavailable and propagates cookie cleanup on the error response", async () => {
  const request = signedRequest("/home"); provider.readError = { code: "unexpected_failure", status: 503 };
  const response = await middleware(request);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "AUTH_UNAVAILABLE");
  assert.ok(response.headers.getSetCookie().some(line => line.startsWith(`${sessionCookie}=`) && /Max-Age=0/.test(line)));
});

test("public landing stays public for authenticated users", async () => {
  const response = await middleware(signedRequest("/"));
  assert.equal(response.headers.get("location"), null);
});

test("middleware never calls a provider before JSON mutation CSRF validation", async () => {
  const request = signedRequest("/api/auth/sign-in");
  await middleware(request); assert.equal(provider.calls.length, 0);
});
