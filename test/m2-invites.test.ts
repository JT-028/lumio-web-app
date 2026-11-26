import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { beforeEach, mock, test } from "node:test";
import { mutationHeaders } from "./support/cookies.ts";

type Row = Record<string, unknown>;
const parentId = "00000000-0000-4000-8000-000000000001";
const rows: Row[] = [];
let profile: Row | null;
let signedIn: boolean;
let mailStatus: number;
let mailThrows: boolean;
let deleteFails: boolean;
let rpcFails: boolean;
let seq: number;
const mailCalls: { url: string; body: Record<string, unknown> }[] = [];
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

type CappedArgs = { p_parent_id: string; p_invited_email: string; p_invited_email_key: string; p_token_hash: string };

// ARIA_INVITE_CAP_v1 §4: stands in for create_connect_invite_capped. No await inside, so the
// count and the push run in one synchronous turn, the way the parent's row lock serialises them.
async function rpc(name: string, args: CappedArgs) {
  if (name !== "create_connect_invite_capped") return { data: null, error: { code: "42883" } };
  if (rpcFails) return { data: null, error: { code: "synthetic-db-error" } };
  const since = Date.now() - HOUR_MS;
  const recent = rows.filter((row) => row.parent_id === args.p_parent_id && Date.parse(String(row.created_at)) >= since);
  if (recent.length >= 10) return { data: { result: "rate_limited" }, error: null };
  const now = Date.now();
  const id = `20000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`;
  const expires_at = new Date(now + 7 * DAY_MS).toISOString();
  rows.push({ id, parent_id: args.p_parent_id, invited_email: args.p_invited_email, invited_email_key: args.p_invited_email_key,
    token_hash: args.p_token_hash, state: "sent", created_at: new Date(now).toISOString(), expires_at });
  return { data: { result: "sent", id, invited_email: args.p_invited_email, expires_at, state: "sent" }, error: null };
}

mock.module("server-only", { exports: {} });
mock.module("@/lib/supabase/server", { exports: {
  clearServerAuthCookies: async () => {},
  createSupabaseServerClient: async () => ({ auth: { getUser: async () => ({
    data: { user: signedIn ? { id: parentId, email: "parent@example.test", email_confirmed_at: "2026-10-01T00:00:00Z" } : null }, error: null,
  }) } }),
} });
mock.module("@/data/db", { exports: { getDb: () => ({ rpc, from(table: string) {
  const filters: ((row: Row) => boolean)[] = [];
  let deleting = false;
  const matched = () => (table === "profiles" ? profile ? [profile] : [] : rows)
    .filter((row) => filters.every((filter) => filter(row)));
  const query = {
    select() { return query; },
    eq(key: string, value: unknown) { filters.push((row) => row[key] === value); return query; },
    insert(): never { assert.fail("direct insert bypasses the cap"); },
    delete() { deleting = true; return query; },
    async maybeSingle() { return { data: matched()[0] ?? null, error: null }; },
    then(resolve: (result: { count: number | null; error: { code: string } | null }) => unknown) {
      const selected = matched();
      if (deleting && !deleteFails) {
        for (const row of selected) rows.splice(rows.indexOf(row), 1);
      }
      return Promise.resolve({ count: selected.length, error: deleting && deleteFails ? { code: "synthetic-db-error" } : null }).then(resolve);
    },
  };
  return query;
} }) } });

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  assert.equal(String(input), "https://api.resend.com/emails", "all mail transport is intercepted");
  mailCalls.push({ url: String(input), body: JSON.parse(String(init?.body)) as Record<string, unknown> });
  if (mailThrows) throw new Error("synthetic-private-provider-error");
  return new Response("synthetic-private-provider-error", { status: mailStatus });
}) as typeof fetch;

beforeEach(() => {
  rows.length = 0; mailCalls.length = 0;
  signedIn = true; mailStatus = 200; mailThrows = false; deleteFails = false; rpcFails = false; seq = 0;
  profile = { id: parentId, role: "parent", first_name: "Ada", email: "parent@example.test" };
  process.env.NEXT_PUBLIC_APP_URL = "https://lumio.example.test";
  process.env.RESEND_API_KEY = "synthetic-not-a-real-key";
  process.env.RESEND_FROM_EMAIL = "Lumio <sender@example.test>";
});

async function send(body: unknown = { invited_email: "child@gmail.com" }, raw = false) {
  const { POST } = await import("../src/app/api/invites/route.ts");
  return POST(new Request("http://localhost:3010/api/invites", {
    method: "POST", headers: mutationHeaders("https://lumio.example.test"),
    body: raw ? String(body) : JSON.stringify(body),
  }));
}

async function failure(response: Response, status: number, code: string, field: string | null = null) {
  assert.equal(response.status, status);
  const body = await response.json() as { error: { code: string; message: string; details: unknown } };
  assert.deepEqual(Object.keys(body), ["error"]);
  assert.deepEqual(Object.keys(body.error).sort(), ["code", "details", "message"]);
  assert.equal(body.error.code, code);
  assert.equal(typeof body.error.message, "string");
  assert.deepEqual(body.error.details, field ? { field } : null);
  assert.doesNotMatch(JSON.stringify(body), /synthetic-private|token_hash|Bearer|\/connect\//);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
}

test("parent send mails one canonical Gmail link, stores only its hash, and creates a fresh seven-day invite per send", async () => {
  for (let i = 0; i < 2; i += 1) {
    const response = await send({ invited_email: "  Ada.Lovelace+kid@GoogleMail.com " });
    assert.equal(response.status, 201);
    const body = await response.json() as Row;
    assert.deepEqual(Object.keys(body).sort(), ["expires_at", "id", "invited_email", "state"]);
    assert.equal(body.invited_email, "ada.lovelace+kid@googlemail.com");
    assert.equal(body.state, "sent");
    const row = rows[i];
    assert.equal(row.parent_id, parentId);
    assert.equal(row.invited_email_key, "adalovelace@gmail.com");
    assert.equal(Date.parse(String(row.expires_at)) - Date.parse(String(row.created_at)), 7 * 24 * 60 * 60 * 1000);
    const mail = mailCalls[i].body;
    assert.deepEqual(mail.to, [body.invited_email]);
    assert.equal(mail.subject, "Ada sent you a Lumio connect link");
    assert.match(String(mail.text), /You still cannot study until you accept/);
    const raw = String(mail.text).match(/https:\/\/lumio\.example\.test\/connect\/([A-Za-z0-9_-]{43})/)?.[1];
    assert.ok(raw);
    assert.equal(row.token_hash, createHash("sha256").update(raw).digest("hex"));
    assert.ok(!JSON.stringify(row).includes(raw));
    assert.ok(!JSON.stringify(body).includes(raw));
  }
  assert.equal(mailCalls.length, 2);
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].token_hash, rows[1].token_hash);
});

for (const role of ["signed-out", "student", "unselected", "no-profile"] as const) {
  test(`invite send refuses ${role} before any mail or invite write`, async () => {
    if (role === "signed-out") signedIn = false;
    else if (role === "no-profile") profile = null;
    else profile = { ...profile, role: role === "student" ? "student" : null };
    await failure(await send(), role === "signed-out" ? 401 : 403, role === "signed-out" ? "UNAUTHENTICATED" : "ROLE_FORBIDDEN");
    assert.deepEqual(rows, []); assert.deepEqual(mailCalls, []);
  });
}

test("invalid Gmail and malformed JSON never save an invite or send mail", async () => {
  for (const invited_email of ["", "child@example.test", "child@gmail.com.evil.test", null]) {
    await failure(await send({ invited_email }), 400, "INVALID_EMAIL", "invited_email");
  }
  await failure(await send("{", true), 400, "VALIDATION");
  assert.deepEqual(rows, []); assert.deepEqual(mailCalls, []);
});

test("missing mail configuration returns 503 before saving a token", async () => {
  process.env.RESEND_FROM_EMAIL = "";
  await failure(await send(), 503, "EMAIL_NOT_CONFIGURED");
  assert.deepEqual(rows, []); assert.deepEqual(mailCalls, []);
});

const parentRows = () => rows.filter((row) => row.parent_id === parentId);

test("from empty, ten sends succeed and the eleventh is RATE_LIMITED with nothing saved or mailed", async () => {
  for (let i = 0; i < 10; i += 1) assert.equal((await send()).status, 201, `send ${i + 1}`);
  await failure(await send(), 429, "RATE_LIMITED");
  assert.equal(parentRows().length, 10); assert.equal(mailCalls.length, 10);
});

test("only this parent's recent invites consume the ten-send allowance", async () => {
  for (let i = 0; i < 9; i += 1) rows.push({ parent_id: parentId, created_at: new Date().toISOString() });
  rows.push({ parent_id: parentId, created_at: "2020-01-01T00:00:00.000Z" });
  rows.push({ parent_id: "another-parent", created_at: new Date().toISOString() });
  assert.equal((await send()).status, 201);
  const saved = rows.length;
  await failure(await send(), 429, "RATE_LIMITED");
  assert.equal(rows.length, saved); assert.equal(mailCalls.length, 1);
});

for (const mode of ["provider-rejection", "transport-failure"] as const) {
  test(`${mode} rolls back only the just-created invite and hides provider details`, async () => {
    const previous = { id: "previous", parent_id: parentId, created_at: "2020-01-01T00:00:00.000Z" };
    rows.push(previous);
    mailStatus = 502; mailThrows = mode === "transport-failure";
    await failure(await send(), 502, "EMAIL_FAILED");
    assert.deepEqual(rows, [previous]); assert.equal(mailCalls.length, 1);
  });
}

test("failed rollback returns INTERNAL rather than claiming nothing was saved", async () => {
  mailStatus = 502; deleteFails = true;
  await failure(await send(), 500, "INTERNAL");
  assert.equal(rows.length, 1); assert.equal(mailCalls.length, 1);
});

test("a rolled-back send frees its slot for the next send", async () => {
  for (let i = 0; i < 9; i += 1) rows.push({ parent_id: parentId, created_at: new Date().toISOString() });
  mailStatus = 502;
  await failure(await send(), 502, "EMAIL_FAILED");
  assert.equal(parentRows().length, 9);
  mailStatus = 200;
  assert.equal((await send()).status, 201);
  assert.equal(parentRows().length, 10);
  await failure(await send(), 429, "RATE_LIMITED");
  assert.equal(parentRows().length, 10); assert.equal(mailCalls.length, 2);
});

test("a burst of fifteen parallel sends yields exactly ten invites and five RATE_LIMITED", async () => {
  // Count-then-insert would let every send count 0 before any insert; the capped RPC cannot.
  const responses = await Promise.all(Array.from({ length: 15 }, () => send()));
  const created = responses.filter((response) => response.status === 201);
  const limited = responses.filter((response) => response.status !== 201);
  assert.equal(created.length, 10);
  assert.equal(limited.length, 5);
  for (const response of limited) await failure(response, 429, "RATE_LIMITED");
  assert.equal(parentRows().length, 10); assert.equal(mailCalls.length, 10);
});

test("a database fault on the capped insert is INTERNAL with no row and no mail", async () => {
  rpcFails = true;
  await failure(await send(), 500, "INTERNAL");
  assert.deepEqual(rows, []); assert.deepEqual(mailCalls, []);
});

function withNodeEnv(value: string | undefined): () => void {
  const previous = process.env.NODE_ENV;
  if (value === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
  else Object.assign(process.env, { NODE_ENV: value });
  return () => {
    if (previous === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: previous });
  };
}

test("createInvite refuses a plain-http origin outside local dev as INTERNAL, before any write", async () => {
  const { createInvite } = await import("../src/services/invites.ts");
  const caller = { id: parentId, first_name: "Ada" };
  for (const [origin, env] of [["http://lumio.example.test", undefined], ["http://localhost:3010", "production"]] as const) {
    process.env.NEXT_PUBLIC_APP_URL = origin;
    const restore = env ? withNodeEnv(env) : () => {};
    try {
      await assert.rejects(createInvite(caller, { invited_email: "child@gmail.com" }),
        { code: "INTERNAL", httpStatus: 500, message: "Something went wrong." }, `${origin} NODE_ENV=${env}`);
    } finally { restore(); }
  }
  assert.deepEqual(rows, []); assert.deepEqual(mailCalls, []);
});

test("an https origin still sends in production, and the route refuses a bad origin before any write", async () => {
  const restore = withNodeEnv("production");
  try {
    const response = await send();
    assert.equal(response.status, 201);
    assert.match(String(mailCalls[0]?.body.text), /https:\/\/lumio\.example\.test\/connect\/[A-Za-z0-9_-]{43}/);
    // At the route, assertCsrf resolves the same origin first, so a bad one stops there.
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3010";
    await failure(await send(), 503, "AUTH_UNAVAILABLE");
  } finally { restore(); }
  assert.equal(rows.length, 1); assert.equal(mailCalls.length, 1);
});
