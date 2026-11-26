import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
mock.module("server-only", { exports: {} });
let sealState: typeof import("../src/lib/auth-state.ts").sealState;
let openState: typeof import("../src/lib/auth-state.ts").openState;
let TTL: typeof import("../src/lib/auth-state.ts").TTL;
let STATE: typeof import("../src/lib/auth-state.ts").STATE;
let AuthSession: typeof import("../src/lib/auth-session.ts").AuthSession;
before(async () => {
  ({ sealState, openState, TTL, STATE } = await import("../src/lib/auth-state.ts"));
  ({ AuthSession } = await import("../src/lib/auth-session.ts"));
});
const origin = "https://lumio.example.test";
beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = origin;
  process.env.SUPABASE_SECRET_KEY = "synthetic-state-key-never-live";
});
afterEach(() => mock.restoreAll());

test("sealed signup intent hides identity and onboarding and round-trips only for its purpose", () => {
  const intent = { user_id: "00000000-0000-4000-8000-000000000001", email: "ada@example.test",
    onboarding: { first_name: "Ada", role: "student" as const }, continuation: "/home" as const };
  const sealed = sealState("intent", intent);
  assert.deepEqual(openState("intent", sealed), intent);
  assert.equal(openState("link", sealed), null);
  assert.doesNotMatch(sealed, /Ada|ada@example|first_name|student/);
  assert.ok(sealed.length <= 3000);
  assert.notEqual(sealState("intent", intent), sealed, "fresh IV required");
});

test("cookie tampering, oversized payload, key rotation and cross-origin replay fail closed", () => {
  const sealed = sealState("link", { purpose: "recovery", token_hash: "proof".repeat(10) });
  const bytes = Buffer.from(sealed, "base64url"); bytes[30] = bytes[30]! ^ 1;
  assert.equal(openState("link", bytes.toString("base64url")), null);
  assert.equal(openState("link", "x".repeat(3001)), null);
  process.env.SUPABASE_SECRET_KEY = "synthetic-different-key";
  assert.equal(openState("link", sealed), null);
  process.env.SUPABASE_SECRET_KEY = "synthetic-state-key-never-live";
  process.env.NEXT_PUBLIC_APP_URL = "https://another.example.test";
  assert.equal(openState("link", sealed), null);
});

for (const kind of ["intent", "link", "oauth", "marker"] as const) {
  test(`${kind} expires at the contract lifetime boundary`, () => {
    const start = Date.now();
    const now = mock.method(Date, "now", () => start);
    const payload = kind === "intent" ? {} : kind === "link" ? { purpose: "recovery", token_hash: "x".repeat(43) }
      : kind === "oauth" ? { nonce: "n".repeat(43) } : { migrated: true };
    // Each variant is deliberately exercised through the real runtime validator.
    const sealed = sealState(kind, payload as never);
    now.mock.mockImplementation(() => start + (TTL[kind] - 1) * 1000);
    assert.notEqual(openState(kind, sealed), null);
    now.mock.mockImplementation(() => start + TTL[kind] * 1000);
    assert.equal(openState(kind, sealed), null);
  });
}

test("unbound onboarding and unknown sensitive state properties cannot be sealed", () => {
  assert.throws(() => sealState("intent", { onboarding: { first_name: "Ada", role: "parent" } }));
  assert.throws(() => sealState("intent", { password: "never-persist" } as never));
  assert.throws(() => sealState("intent", { continuation: "//attacker.test" } as never));
});

test("upgraded context migration expires every legacy session/PKCE chunk once", () => {
  const session = new AuthSession(new Request(origin, { headers: { cookie:
    "sb-project-auth-token.0=old; sb-project-auth-token.1=old; sb-project-auth-token-code-verifier=old" } }));
  session.migrate();
  const response = session.apply(new Response(null));
  const lines = response.headers.getSetCookie();
  for (const name of ["sb-project-auth-token.0", "sb-project-auth-token.1", "sb-project-auth-token-code-verifier"]) {
    const line = lines.find(value => value.startsWith(`${name}=`));
    assert.ok(line); assert.match(line, /Max-Age=0/i); assert.match(line, /HttpOnly/i);
  }
  const marker = session.get(STATE.marker);
  assert.ok(marker);
  const migrated = new AuthSession(new Request(origin, { headers: { cookie:
    `${STATE.marker}=${marker}; sb-project-auth-token=ordinary-session` } }));
  migrated.migrate();
  assert.equal(migrated.get("sb-project-auth-token"), "ordinary-session");
  assert.equal(migrated.writes.size, 0);
});

test("auth responses replace a cacheable Cache-Control so nothing shares or stores them", () => {
  const session = new AuthSession(new Request(origin));
  const response = session.apply(new Response(null, { headers: { "Cache-Control": "public, max-age=600" } }));
  const cache = response.headers.get("cache-control") ?? "";
  assert.match(cache, /private/);
  assert.match(cache, /no-store/);
  assert.doesNotMatch(cache, /public|max-age/);
});

test("invalid staged state is cleared instead of exposed or trusted", () => {
  const session = new AuthSession(new Request(origin, { headers: { cookie: `${STATE.link}=tampered` } }));
  assert.equal(session.state("link"), null);
  assert.equal(session.get(STATE.link), undefined);
  assert.match(session.apply(new Response(null)).headers.get("set-cookie") ?? "", /Max-Age=0/i);
});

test("cancel cleanup preserves an unrelated ordinary session while removing pending/PKCE state", () => {
  const session = new AuthSession(new Request(origin, { headers: { cookie:
    "sb-project-auth-token=ordinary; sb-project-auth-token-code-verifier=pkce; lumio_intent=pending; lumio_link=proof; lumio_oauth=nonce" } }));
  session.clearPending();
  assert.equal(session.get("sb-project-auth-token"), "ordinary");
  for (const name of [STATE.intent, STATE.link, STATE.oauth, "sb-project-auth-token-code-verifier"]) assert.equal(session.get(name), undefined);
});
