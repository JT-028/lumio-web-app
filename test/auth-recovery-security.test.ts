import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";

mock.module("server-only", { exports: {} });
let assertCsrf: typeof import("../src/lib/auth-security.ts").assertCsrf;
let parseContinuation: typeof import("../src/lib/auth-security.ts").parseContinuation;
let equalToken: typeof import("../src/lib/auth-security.ts").equalToken;
let exactBody: typeof import("../src/lib/auth-security.ts").exactBody;
before(async () => { ({ assertCsrf, parseContinuation, equalToken, exactBody } = await import("../src/lib/auth-security.ts")); });
const origin = "https://lumio.example.test";
const token = "q".repeat(43);
beforeEach(() => { process.env.NEXT_PUBLIC_APP_URL = origin; });

function mutation(overrides: Record<string, string | null> = {}) {
  const headers = new Headers({ origin, "content-type": "application/json", "x-csrf-token": token,
    cookie: `lumio_csrf=${token}`, "sec-fetch-site": "same-origin" });
  for (const [name, value] of Object.entries(overrides)) {
    if (value === null) headers.delete(name); else headers.set(name, value);
  }
  return new Request(`${origin}/api/auth/sign-in`, { method: "POST", headers, body: "{}" });
}

test("same-origin JSON mutations with matching CSRF cookie/header pass", () => {
  assert.doesNotThrow(() => assertCsrf(mutation()));
});

for (const [label, headers] of Object.entries<Record<string, string | null>>({
  "missing origin": { origin: null },
  "foreign origin": { origin: "https://attacker.example.test" },
  "null origin": { origin: "null" },
  "missing cookie": { cookie: null },
  "missing header": { "x-csrf-token": null },
  "mismatched token": { "x-csrf-token": "z".repeat(43) },
  "cross-site metadata": { "sec-fetch-site": "cross-site" },
  "HTML form encoding": { "content-type": "application/x-www-form-urlencoded" },
  "missing media type": { "content-type": null },
})) {
  test(`CSRF rejects ${label}`, () => {
    assert.throws(() => assertCsrf(mutation(headers)), { code: "CSRF_REJECTED", httpStatus: 403 });
  });
}

for (const path of ["/home", "/wait", "/role", `/connect/${"a".repeat(43)}`, `/connect/${"Z_0-".repeat(32)}`]) {
  test(`continuation accepts only the literal allowed path: ${path.slice(0, 24)}`, () => {
    assert.equal(parseContinuation(path), path);
  });
}

for (const path of [undefined, null, 3, {}, "", "/", "//attacker.test", "https://attacker.test/home",
  "/home?next=//attacker.test", "/home#fragment", "/%68ome", "/home%0a", "/home ", " /home",
  "/home/../role", "/connect/../home", "/connect/%2f%2fattacker.test", "/connect/" + "a".repeat(42),
  "/connect/" + "a".repeat(129), "/connect/" + "a".repeat(43) + "?email=x", "/\\attacker.test", "/home\n"]) {
  test(`unsafe continuation fails closed: ${JSON.stringify(path)}`, () => {
    assert.equal(parseContinuation(path), null);
  });
}

test("token comparison handles different lengths without throwing", () => {
  assert.equal(equalToken(token, token), true);
  assert.equal(equalToken(token, ""), false);
  assert.equal(equalToken(token, "z".repeat(43)), false);
});

test("exact bodies reject privilege hints and missing required fields", () => {
  assert.throws(() => exactBody({ email: "a@example.test", role: "parent" }, ["email"]), { code: "VALIDATION" });
  assert.throws(() => exactBody({}, ["email"]), { code: "VALIDATION" });
  assert.doesNotThrow(() => exactBody({}, ["continuation"], []));
});

test("trusted callback origin never falls back to request Host", async () => {
  const { resolveAppOrigin } = await import("../src/lib/supabase/public-config.ts");
  for (const configured of ["", "https://user:pass@lumio.example.test", "https://lumio.example.test/path",
    "https://lumio.example.test/?x=1", "https://lumio.example.test/#x", "http://remote.example.test"]) {
    process.env.NEXT_PUBLIC_APP_URL = configured;
    assert.throws(() => resolveAppOrigin("https://attacker.example.test"));
  }
});
