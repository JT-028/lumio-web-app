import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { beforeEach, mock, test } from "node:test";
import { emailKey } from "../src/domain/email-key.ts";
import { cookieJar, cookies, resetCookies } from "./support/cookies.ts";

type Row = Record<string, unknown>;
type Account = { id: string; email: string };

const OFFICIAL: [string, number][] = [
  ["geography_6", 1],
  ["geography_6", 2],
  ["history_6", 1],
  ["history_6", 2],
  ["language_6", 1],
  ["language_6", 2],
  ["mathematics_6", 1],
  ["mathematics_6", 2],
];

const tables: Record<string, Row[]> = {
  profiles: [],
  connect_invites: [],
  households: [],
  cards: [],
};

const accounts = new Map<string, Account>();
let rpcCalls = 0;
let cardSeq = 0;

mock.module("server-only", { exports: {} });
mock.module("next/headers", { exports: { cookies } });
mock.module("@/lib/supabase/admin", {
  exports: {
    createAdminClient,
  },
});
mock.module("@/lib/supabase/cookie-client", {
  exports: {
    createSupabaseCookieClient(options: {
      getAll: () => { name: string; value: string }[];
    }) {
      return {
        auth: {
          async getUser() {
            const token = options.getAll().find((cookie) => cookie.name === "sb-access-token")?.value;
            const user = token ? accounts.get(token) : undefined;
            if (!user) {
              return { data: { user: null }, error: { message: "Auth session missing" } };
            }
            return { data: { user }, error: null };
          },
        },
      };
    },
  },
});

function userId(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

function inviteId(n: number): string {
  return `20000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

function rawToken(label: string): string {
  return label.replace(/[^A-Za-z0-9_-]/g, "x").padEnd(43, "0").slice(0, 43);
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

function resetRows(): void {
  for (const rows of Object.values(tables)) {
    rows.length = 0;
  }
  rpcCalls = 0;
  cardSeq = 0;
}

function signIn(id: string, email: string): void {
  accounts.set(id, { id, email });
  cookieJar.length = 0;
  cookieJar.push({ name: "sb-access-token", value: id });
}

function signOut(): void {
  cookieJar.length = 0;
}

function seedProfile(input: {
  id: string;
  role: "parent" | "student" | null;
  firstName: string | null;
  email: string;
}): void {
  const key = emailKey(input.email);
  if (!key) {
    throw new Error("seed email");
  }
  tables.profiles.push({
    id: input.id,
    role: input.role,
    first_name: input.firstName,
    email: input.email,
    email_key: key,
  });
}

function seedInvite(input: {
  id: string;
  parentId: string;
  email: string;
  raw: string;
  state?: "sent" | "accepted" | "ignored";
  expiresAt: string;
}): string {
  const email = input.email.trim().toLowerCase();
  const key = emailKey(email);
  if (!key) {
    throw new Error("invite email");
  }
  tables.connect_invites.push({
    id: input.id,
    parent_id: input.parentId,
    invited_email: email,
    invited_email_key: key,
    token_hash: hashToken(input.raw),
    state: input.state ?? "sent",
    expires_at: input.expiresAt,
    accepted_at: null,
    accepted_by_student_id: null,
    created_at: "2026-10-13T00:00:00.000Z",
  });
  return input.raw;
}

function createAdminClient() {
  return {
    from(table: string) {
      const rows = tables[table];
      if (!rows) {
        const missing = {
          select() {
            return missing;
          },
          eq() {
            return missing;
          },
          in() {
            return missing;
          },
          order() {
            return missing;
          },
          async maybeSingle() {
            return { data: null, error: { code: "42P01" } };
          },
          then(resolve: (value: { data: null; error: { code: string } }) => unknown) {
            return Promise.resolve({ data: null, error: { code: "42P01" } }).then(resolve);
          },
        };
        return missing;
      }
      const filters: ((row: Row) => boolean)[] = [];
      let sortKey: string | null = null;
      let sortAsc = true;
      const chain = {
        select() {
          return chain;
        },
        eq(column: string, value: unknown) {
          filters.push((row) => row[column] === value);
          return chain;
        },
        in(column: string, values: readonly unknown[]) {
          const allowed = new Set(values);
          filters.push((row) => allowed.has(row[column]));
          return chain;
        },
        order(column: string, options?: { ascending?: boolean }) {
          sortKey = column;
          sortAsc = options?.ascending !== false;
          return chain;
        },
        async maybeSingle() {
          const found = matched();
          if (found.length > 1) {
            return { data: null, error: { code: "PGRST116" } };
          }
          return { data: found[0] ?? null, error: null };
        },
        then(
          resolve: (value: { data: Row[]; error: null }) => unknown,
          reject?: (reason: unknown) => unknown,
        ) {
          return Promise.resolve({ data: matched(), error: null }).then(resolve, reject);
        },
      };
      function matched(): Row[] {
        let found = rows.filter((row) => filters.every((fn) => fn(row)));
        if (sortKey) {
          const key = sortKey;
          found = [...found].sort((a, b) => {
            const av = String(a[key] ?? "");
            const bv = String(b[key] ?? "");
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return sortAsc ? cmp : -cmp;
          });
        }
        return found.map((row) => ({ ...row }));
      }
      return chain;
    },
    async rpc(name: string, args: { p_token_hash: string; p_student_id: string; p_email_key: string }) {
      rpcCalls += 1;
      if (name !== "accept_connect_invite") {
        return { data: null, error: { code: "42883" } };
      }
      return { data: applyAccept(args), error: null };
    },
  };
}

function applyAccept(args: { p_token_hash: string; p_student_id: string; p_email_key: string }) {
  const invite = tables.connect_invites.find((row) => row.token_hash === args.p_token_hash);
  if (!invite) {
    return { result: "not_found" };
  }
  const profile = tables.profiles.find((row) => row.id === args.p_student_id);
  if (!profile || profile.role !== "student") {
    return { result: "role_not_student" };
  }
  if (invite.state === "sent" && Date.parse(String(invite.expires_at)) <= Date.now()) {
    return { result: "expired" };
  }
  if (profile.email_key !== args.p_email_key || invite.invited_email_key !== args.p_email_key) {
    return { result: "email_mismatch" };
  }
  if (
    (invite.state === "accepted" || invite.state === "ignored") &&
    invite.accepted_by_student_id !== args.p_student_id
  ) {
    return { result: "already_used" };
  }
  const household = tables.households.find((row) => row.student_id === args.p_student_id);
  if (
    invite.state === "accepted" &&
    invite.accepted_by_student_id === args.p_student_id &&
    household &&
    household.accepted_invite_id === invite.id
  ) {
    ensureCards(args.p_student_id);
    return {
      result: "accepted",
      student_id: args.p_student_id,
      main_parent_id: household.main_parent_id,
    };
  }
  if (invite.state === "ignored" && invite.accepted_by_student_id === args.p_student_id) {
    return {
      result: "ignored",
      student_id: args.p_student_id,
      reason: "MAIN_PARENT_EXISTS",
    };
  }
  if (household) {
    invite.state = "ignored";
    invite.accepted_at = "2026-10-13T01:00:00.000Z";
    invite.accepted_by_student_id = args.p_student_id;
    return {
      result: "ignored",
      student_id: args.p_student_id,
      reason: "MAIN_PARENT_EXISTS",
    };
  }
  const parentId = invite.parent_id;
  tables.households.push({
    student_id: args.p_student_id,
    main_parent_id: parentId,
    accepted_invite_id: invite.id,
    created_at: "2026-10-13T01:00:00.000Z",
  });
  invite.state = "accepted";
  invite.accepted_at = "2026-10-13T01:00:00.000Z";
  invite.accepted_by_student_id = args.p_student_id;
  ensureCards(args.p_student_id);
  return {
    result: "accepted",
    student_id: args.p_student_id,
    main_parent_id: parentId,
  };
}

function ensureCards(studentId: string): void {
  for (const [course, quarter] of OFFICIAL) {
    const exists = tables.cards.some(
      (row) => row.student_id === studentId && row.course === course && row.quarter === quarter,
    );
    if (exists) {
      continue;
    }
    cardSeq += 1;
    tables.cards.push({
      id: `10000000-0000-4000-8000-${cardSeq.toString(16).padStart(12, "0")}`,
      student_id: studentId,
      school_year: "2026-2027",
      kind: "official",
      course,
      quarter,
      study_set_id: null,
      created_at: "2026-10-13T01:00:00.000Z",
    });
  }
}

beforeEach(() => {
  accounts.clear();
  resetCookies();
  resetRows();
});

function context(token: string): { params: Promise<{ token: string }> } {
  return { params: Promise.resolve({ token }) };
}

async function getConnect(token: string): Promise<Response> {
  const { GET } = await import("../src/app/api/connect/[token]/route.ts");
  return GET(new Request(`http://localhost:3010/api/connect/${token}`), context(token));
}

async function postAccept(token: string, body?: unknown): Promise<Response> {
  const { POST } = await import("../src/app/api/connect/[token]/accept/route.ts");
  return POST(
    new Request(`http://localhost:3010/api/connect/${token}/accept`, {
      method: "POST",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    context(token),
  );
}

async function getHome(): Promise<Response> {
  const { GET } = await import("../src/app/api/home/route.ts");
  return GET(new Request("http://localhost:3010/api/home"));
}

async function getMe(): Promise<Response> {
  const { GET } = await import("../src/app/api/me/route.ts");
  return GET(new Request("http://localhost:3010/api/me"));
}

function assertEnvelope(body: { error?: Record<string, unknown> }): {
  code: string;
  message: string;
  details: unknown;
} {
  assert.deepEqual(Object.keys(body).sort(), ["error"]);
  const error = body.error ?? {};
  assert.deepEqual(Object.keys(error).sort(), ["code", "details", "message"]);
  assert.equal(typeof error.message, "string");
  assert.notEqual(error.message, "");
  return error as { code: string; message: string; details: unknown };
}

function assertHidden(body: unknown, secrets: string[]): void {
  const json = JSON.stringify(body);
  for (const secret of secrets) {
    assert.equal(json.includes(secret), false);
  }
  assert.doesNotMatch(json, /token_hash|select |insert |SQL|stack|provider/i);
}

test("an expired connect link is 410 and changes nothing", async () => {
  const parentId = userId(1);
  const studentId = userId(2);
  seedProfile({ id: parentId, role: "parent", firstName: "Ada", email: "parent.a@example.com" });
  seedProfile({
    id: studentId,
    role: "student",
    firstName: "Lin",
    email: "ada.lovelace@gmail.com",
  });
  const raw = seedInvite({
    id: inviteId(1),
    parentId,
    email: "ada.lovelace+kid@googlemail.com",
    raw: rawToken("expired-link"),
    expiresAt: "2020-01-01T00:00:00.000Z",
  });
  const hash = hashToken(raw);

  const preview = await getConnect(raw);
  const previewBody = (await preview.json()) as { error: Record<string, unknown> };
  const previewError = assertEnvelope(previewBody);
  assert.equal(preview.status, 410);
  assert.equal(previewError.code, "LINK_EXPIRED");
  assert.equal(previewError.details, null);
  assertHidden(previewBody, [raw, hash]);
  assert.match(preview.headers.get("cache-control") ?? "", /no-store/);

  const signedOut = await postAccept(raw);
  const signedOutError = assertEnvelope((await signedOut.json()) as { error: Record<string, unknown> });
  assert.equal(signedOut.status, 401);
  assert.equal(signedOutError.code, "UNAUTHENTICATED");
  assert.equal(rpcCalls, 0);

  signIn(studentId, "ada.lovelace@gmail.com");
  const accepted = await postAccept(raw);
  const acceptedError = assertEnvelope((await accepted.json()) as { error: Record<string, unknown> });
  assert.equal(accepted.status, 410);
  assert.equal(acceptedError.code, "LINK_EXPIRED");
  assert.equal(acceptedError.details, null);
  assertHidden(acceptedError, [raw, hash]);
  assert.equal(rpcCalls, 0);
  assert.equal(tables.households.length, 0);
  assert.equal(tables.cards.length, 0);
  assert.equal(tables.connect_invites[0]?.state, "sent");
  assert.equal(tables.connect_invites[0]?.accepted_by_student_id, null);

  const unknown = rawToken("missing-link");
  const missing = await getConnect(unknown);
  const missingError = assertEnvelope((await missing.json()) as { error: Record<string, unknown> });
  assert.equal(missing.status, 404);
  assert.equal(missingError.code, "NOT_FOUND");
  assertHidden(missingError, [unknown]);
});

test("an email mismatch is 403 and ignores a body email", async () => {
  const parentId = userId(1);
  const studentId = userId(3);
  seedProfile({ id: parentId, role: "parent", firstName: "Ada", email: "parent.a@example.com" });
  seedProfile({
    id: studentId,
    role: "student",
    firstName: "Kai",
    email: "other.person@gmail.com",
  });
  const raw = seedInvite({
    id: inviteId(2),
    parentId,
    email: "ada.lovelace+kid@googlemail.com",
    raw: rawToken("mismatch-link"),
    expiresAt: "2099-01-01T00:00:00.000Z",
  });
  signIn(studentId, "other.person@gmail.com");
  const response = await postAccept(raw, {
    invited_email: "ada.lovelace+kid@googlemail.com",
    email: "ada.lovelace@gmail.com",
  });
  const error = assertEnvelope((await response.json()) as { error: Record<string, unknown> });
  assert.equal(response.status, 403);
  assert.equal(error.code, "EMAIL_MISMATCH");
  assert.equal(error.details, null);
  assertHidden(error, [raw, hashToken(raw), "ada.lovelace@gmail.com"]);
  assert.equal(rpcCalls, 0);
  assert.equal(tables.households.length, 0);
  assert.equal(tables.cards.length, 0);
  assert.equal(tables.connect_invites[0]?.state, "sent");

  signIn(parentId, "parent.a@example.com");
  const parentTry = await postAccept(raw);
  const parentError = assertEnvelope((await parentTry.json()) as { error: Record<string, unknown> });
  assert.equal(parentTry.status, 403);
  assert.equal(parentError.code, "ROLE_NOT_STUDENT");
  assert.equal(tables.connect_invites[0]?.state, "sent");
  assert.equal(rpcCalls, 0);
});

test("the first parent wins and the same student can accept again", async () => {
  const parentId = userId(1);
  const studentId = userId(2);
  seedProfile({ id: parentId, role: "parent", firstName: "Ada", email: "parent.a@example.com" });
  seedProfile({
    id: studentId,
    role: "student",
    firstName: "Lin",
    email: "ada.lovelace@gmail.com",
  });
  const raw = seedInvite({
    id: inviteId(3),
    parentId,
    email: "  Ada.Lovelace+kid@GoogleMail.com ",
    raw: rawToken("first-parent"),
    expiresAt: "2099-01-01T00:00:00.000Z",
  });

  const preview = await getConnect(raw);
  const previewBody = (await preview.json()) as Record<string, unknown>;
  assert.equal(preview.status, 200);
  assert.deepEqual(Object.keys(previewBody).sort(), [
    "expires_at",
    "invited_email",
    "parent_first_name",
    "state",
  ]);
  assert.equal(previewBody.invited_email, "ada.lovelace+kid@googlemail.com");
  assert.equal(previewBody.parent_first_name, "Ada");
  assert.equal(previewBody.expires_at, "2099-01-01T00:00:00.000Z");
  assert.equal(previewBody.state, "sent");
  assertHidden(previewBody, [raw, hashToken(raw), "adalovelace@gmail.com", parentId]);

  signIn(studentId, "ada.lovelace@gmail.com");
  const before = await getMe();
  const beforeBody = (await before.json()) as { has_main_parent: boolean };
  assert.equal(before.status, 200);
  assert.equal(beforeBody.has_main_parent, false);

  const accepted = await postAccept(raw, { email: "someoneelse@gmail.com" });
  const body = (await accepted.json()) as Record<string, unknown>;
  assert.equal(accepted.status, 200);
  assert.deepEqual(body, {
    state: "accepted",
    student_id: studentId,
    main_parent_id: parentId,
  });
  assertHidden(body, [raw, hashToken(raw)]);
  assert.equal(tables.households.length, 1);
  assert.equal(tables.households[0]?.main_parent_id, parentId);
  assert.equal(tables.households[0]?.student_id, studentId);
  assert.equal(tables.households[0]?.accepted_invite_id, inviteId(3));
  assert.equal(tables.connect_invites[0]?.state, "accepted");
  assert.equal(tables.cards.length, 8);
  assert.equal(tables.cards.every((row) => row.study_set_id === null && row.kind === "official"), true);

  const again = await postAccept(raw);
  const againBody = (await again.json()) as Record<string, unknown>;
  assert.equal(again.status, 200);
  assert.deepEqual(againBody, {
    state: "accepted",
    student_id: studentId,
    main_parent_id: parentId,
  });
  assert.equal(tables.households.length, 1);
  assert.equal(tables.cards.length, 8);
  assert.equal(tables.households[0]?.main_parent_id, parentId);

  const me = await getMe();
  const meBody = (await me.json()) as { has_main_parent: boolean; role: string };
  assert.equal(me.status, 200);
  assert.equal(meBody.role, "student");
  assert.equal(meBody.has_main_parent, true);

  signIn(parentId, "parent.a@example.com");
  const parentMe = await getMe();
  const parentBody = (await parentMe.json()) as { has_main_parent: boolean; role: string };
  assert.equal(parentBody.role, "parent");
  assert.equal(parentBody.has_main_parent, false);
});

test("a second accept is ignored and the first parent stays", async () => {
  const parentA = userId(1);
  const parentB = userId(4);
  const studentId = userId(2);
  seedProfile({ id: parentA, role: "parent", firstName: "Ada", email: "parent.a@example.com" });
  seedProfile({ id: parentB, role: "parent", firstName: "Bea", email: "parent.b@example.com" });
  seedProfile({
    id: studentId,
    role: "student",
    firstName: "Lin",
    email: "ada.lovelace@gmail.com",
  });
  const first = seedInvite({
    id: inviteId(5),
    parentId: parentA,
    email: "ada.lovelace@gmail.com",
    raw: rawToken("winner-link"),
    expiresAt: "2099-01-01T00:00:00.000Z",
  });
  const second = seedInvite({
    id: inviteId(6),
    parentId: parentB,
    email: "ada.lovelace+other@gmail.com",
    raw: rawToken("second-link"),
    expiresAt: "2099-02-01T00:00:00.000Z",
  });
  signIn(studentId, "ada.lovelace@gmail.com");
  const won = await postAccept(first);
  assert.equal(won.status, 200);
  const household = { ...tables.households[0] };
  const wonInvite = { ...tables.connect_invites[0] };

  const ignored = await postAccept(second);
  const body = (await ignored.json()) as Record<string, unknown>;
  assert.equal(ignored.status, 200);
  assert.deepEqual(body, {
    state: "ignored",
    student_id: studentId,
    reason: "MAIN_PARENT_EXISTS",
  });
  assertHidden(body, [first, second, hashToken(second)]);
  assert.equal(tables.households.length, 1);
  assert.deepEqual(tables.households[0], household);
  assert.equal(tables.households[0]?.main_parent_id, parentA);
  assert.notEqual(tables.households[0]?.main_parent_id, parentB);
  assert.deepEqual(tables.connect_invites[0], wonInvite);
  assert.equal(tables.connect_invites[1]?.state, "ignored");
  assert.equal(tables.connect_invites[1]?.accepted_by_student_id, studentId);
  assert.equal(tables.cards.length, 8);

  const repeat = await postAccept(second);
  const repeatBody = (await repeat.json()) as Record<string, unknown>;
  assert.equal(repeat.status, 200);
  assert.deepEqual(repeatBody, body);
  assert.deepEqual(tables.households[0], household);
  assert.equal(tables.cards.length, 8);
});

test("a parent home lists only that parent's child", async () => {
  const parentA = userId(1);
  const parentB = userId(4);
  const linId = userId(2);
  const kaiId = userId(5);
  const unlinkedId = userId(6);
  const unnamedId = userId(7);
  seedProfile({ id: parentA, role: "parent", firstName: "Ada", email: "parent.a@example.com" });
  seedProfile({ id: parentB, role: "parent", firstName: "Bea", email: "parent.b@example.com" });
  seedProfile({
    id: linId,
    role: "student",
    firstName: "Lin",
    email: "ada.lovelace@gmail.com",
  });
  seedProfile({ id: kaiId, role: "student", firstName: "Kai", email: "kai@gmail.com" });
  seedProfile({
    id: unlinkedId,
    role: "student",
    firstName: "Noa",
    email: "noa@gmail.com",
  });
  seedProfile({ id: unnamedId, role: null, firstName: null, email: "new@example.com" });
  const linToken = seedInvite({
    id: inviteId(7),
    parentId: parentA,
    email: "ada.lovelace@gmail.com",
    raw: rawToken("lin-link"),
    expiresAt: "2099-01-01T00:00:00.000Z",
  });
  const kaiToken = seedInvite({
    id: inviteId(8),
    parentId: parentB,
    email: "kai@gmail.com",
    raw: rawToken("kai-link"),
    expiresAt: "2099-01-01T00:00:00.000Z",
  });

  signIn(linId, "ada.lovelace@gmail.com");
  assert.equal((await postAccept(linToken)).status, 200);
  signIn(kaiId, "kai@gmail.com");
  assert.equal((await postAccept(kaiToken)).status, 200);

  signIn(parentA, "parent.a@example.com");
  const adaHome = await getHome();
  const adaBody = (await adaHome.json()) as {
    role: string;
    first_name: string;
    needs_parent: boolean;
    children: Record<string, unknown>[];
  };
  assert.equal(adaHome.status, 200);
  assert.equal(adaBody.role, "parent");
  assert.equal(adaBody.first_name, "Ada");
  assert.equal(adaBody.needs_parent, false);
  assert.deepEqual(Object.keys(adaBody).sort(), ["children", "first_name", "needs_parent", "role"]);
  assert.equal(adaBody.children.length, 1);
  assert.equal(adaBody.children[0]?.id, linId);
  assert.equal(adaBody.children[0]?.first_name, "Lin");
  assert.equal(adaBody.children[0]?.email, "ada.lovelace@gmail.com");
  assertHidden(adaBody, [kaiId, "kai@gmail.com", "Bea", parentB]);
  assertOfficialCards(adaBody.children[0]?.official_cards);
  assert.deepEqual(adaBody.children[0]?.study_sets, []);

  signIn(parentB, "parent.b@example.com");
  const beaHome = await getHome();
  const beaBody = (await beaHome.json()) as { children: { id: string; first_name: string }[] };
  assert.equal(beaHome.status, 200);
  assert.deepEqual(
    beaBody.children.map((child) => child.id),
    [kaiId],
  );
  assert.equal(beaBody.children[0]?.first_name, "Kai");
  assertHidden(beaBody, [linId, "ada.lovelace@gmail.com"]);

  signIn(linId, "ada.lovelace@gmail.com");
  const linHome = await getHome();
  const linBody = (await linHome.json()) as {
    role: string;
    first_name: string;
    needs_parent: boolean;
    children: { id: string; official_cards: unknown; study_sets: unknown }[];
  };
  assert.equal(linHome.status, 200);
  assert.equal(linBody.role, "student");
  assert.equal(linBody.first_name, "Lin");
  assert.equal(linBody.needs_parent, false);
  assert.equal(linBody.children.length, 1);
  assert.equal(linBody.children[0]?.id, linId);
  assertOfficialCards(linBody.children[0]?.official_cards);
  assert.deepEqual(linBody.children[0]?.study_sets, []);
  assertHidden(linBody, [kaiId, parentB]);

  signIn(unlinkedId, "noa@gmail.com");
  const waiting = await getHome();
  const waitingBody = (await waiting.json()) as Record<string, unknown>;
  assert.equal(waiting.status, 200);
  assert.deepEqual(waitingBody, {
    role: "student",
    first_name: "Noa",
    needs_parent: true,
    children: [],
  });

  signIn(unnamedId, "new@example.com");
  const noRole = await getHome();
  const noRoleError = assertEnvelope((await noRole.json()) as { error: Record<string, unknown> });
  assert.equal(noRole.status, 403);
  assert.equal(noRoleError.code, "ROLE_REQUIRED");
  assert.equal(noRoleError.details, null);
});

function assertOfficialCards(value: unknown): void {
  assert.ok(Array.isArray(value));
  const cards = value as Record<string, unknown>[];
  assert.deepEqual(
    cards.map((card) => card.slug),
    [
      "geography-q1",
      "geography-q2",
      "history-q1",
      "history-q2",
      "language-q1",
      "language-q2",
      "math-q1",
      "math-q2",
    ],
  );
  const expected = [
    ["geography_6", "Geography 6", 1, "Quarter 1"],
    ["geography_6", "Geography 6", 2, "Quarter 2"],
    ["history_6", "History 6", 1, "Quarter 1"],
    ["history_6", "History 6", 2, "Quarter 2"],
    ["language_6", "Language 6", 1, "Quarter 1"],
    ["language_6", "Language 6", 2, "Quarter 2"],
    ["mathematics_6", "Mathematics 6", 1, "Quarter 1"],
    ["mathematics_6", "Mathematics 6", 2, "Quarter 2"],
  ] as const;
  cards.forEach((card, index) => {
    const [course, label, quarter, quarterLabel] = expected[index]!;
    assert.deepEqual(Object.keys(card).sort(), [
      "course",
      "course_label",
      "header",
      "id",
      "kind",
      "quarter",
      "quarter_label",
      "slug",
    ]);
    assert.equal(card.kind, "official");
    assert.equal(card.course, course);
    assert.equal(card.course_label, label);
    assert.equal(card.quarter, quarter);
    assert.equal(card.quarter_label, quarterLabel);
    assert.equal(
      card.header,
      `School Year 2026\u20132027 \u00b7 ${label} \u00b7 ${quarterLabel}`,
    );
    assert.equal("topic_count" in card, false);
    assert.equal("importance" in card, false);
    assert.equal("skill_stamp" in card, false);
  });
}
