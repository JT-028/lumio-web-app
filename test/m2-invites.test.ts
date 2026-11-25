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
const mailCalls: { url: string; body: Record<string, unknown> }[] = [];

mock.module("server-only", { exports: {} });
mock.module("@/lib/supabase/server", { exports: {
  clearServerAuthCookies: async () => {},
  createSupabaseServerClient: async () => ({ auth: { getUser: async () => ({
    data: { user: signedIn ? { id: parentId, email: "parent@example.test", email_confirmed_at: "2026-10-01T00:00:00Z" } : null }, error: null,
  }) } }),
} });
mock.module("@/data/db", { exports: { getDb: () => ({ from(table: string) {
  const filters: ((row: Row) => boolean)[] = [];
  let deleting = false;
  let inserted: Row | null = null;
  const matched = () => (table === "profiles" ? profile ? [profile] : [] : rows)
    .filter((row) => filters.every((filter) => filter(row)));
  const query = {
    select() { return query; },
    eq(key: string, value: unknown) { filters.push((row) => row[key] === value); return query; },
    gte(key: string, value: string) { filters.push((row) => String(row[key]) >= value); return query; },
    insert(row: Row) {
      assert.equal(table, "connect_invites");
      inserted = { ...row, id: `20000000-0000-4000-8000-${(rows.length + 1).toString().padStart(12, "0")}` };
      rows.push(inserted); return query;
    },
    delete() { deleting = true; return query; },
    async single() { return { data: inserted, error: null }; },
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
  signedIn = true; mailStatus = 200; mailThrows = false; deleteFails = false;
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
