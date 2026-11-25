import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { beforeEach, mock, test } from "node:test";
import { cookieJar, cookies, mutationHeaders, rememberSetCookie, resetCookies } from "./support/cookies.ts";
import { createAdminClient, inserts, profiles, resetProfiles } from "./support/memory-db.ts";

type Account = { id: string; email: string; email_confirmed_at: string };

const accounts = new Map<string, Account>();

mock.module("server-only", { exports: {} });
mock.module("next/headers", { exports: { cookies } });
mock.module("@/lib/supabase/admin", { exports: { createAdminClient } });
mock.module("@/lib/supabase/cookie-client", {
  exports: {
    createSupabaseCookieClient(options: {
      getAll: () => { name: string; value: string }[];
      setAll: (
        cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
        headers?: Record<string, string>,
      ) => void;
    }) {
      let memory: Account | null = null;
      return {
        auth: {
          async exchangeCodeForSession(code: string) {
            if (code !== "google-code") {
              return { data: { session: null, user: null }, error: { message: "bad code" } };
            }
            memory = { id: userId(1), email: "ada@gmail.com", email_confirmed_at: "2026-10-01T00:00:00Z" };
            accounts.set(memory.id, memory);
            options.setAll(
              [
                {
                  name: "sb-fixture-auth-token",
                  value: memory.id,
                  options: { path: "/", httpOnly: true, sameSite: "lax", secure: false },
                },
              ],
              {},
            );
            return {
              data: { session: { access_token: memory.id }, user: memory },
              error: null,
            };
          },
          async getUser() {
            if (memory) {
              return { data: { user: memory }, error: null };
            }
            const token = options.getAll().find((cookie) => cookie.name === "sb-fixture-auth-token")?.value;
            const user = token ? accounts.get(token) : undefined;
            if (!user) {
              return { data: { user: null }, error: { message: "Auth session missing" } };
            }
            return { data: { user }, error: null };
          },
          async signOut() {
            memory = null;
            options.setAll([{ name: "sb-fixture-auth-token", value: "", options: { path: "/", maxAge: 0 } }], {});
            return { error: null };
          },
        },
      };
    },
  },
});

function userId(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

function signIn(id: string, email: string): void {
  accounts.set(id, { id, email, email_confirmed_at: "2026-10-01T00:00:00Z" });
  cookieJar.length = 0;
  cookieJar.push({ name: "sb-fixture-auth-token", value: id });
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3010";
  process.env.SUPABASE_SECRET_KEY = "synthetic-key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://provider.example.test";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "synthetic-public-key";
  accounts.clear();
  resetCookies();
  resetProfiles();
});

async function postProfile(body: unknown): Promise<Response> {
  const { POST } = await import("../src/app/api/profile/route.ts");
  return POST(
    new Request("http://localhost:3010/api/profile", {
      method: "POST",
      headers: mutationHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

async function getMe(): Promise<Response> {
  const { GET } = await import("../src/app/api/me/route.ts");
  return GET(new Request("http://localhost:3010/api/me"));
}

function assertEnvelope(body: { error?: Record<string, unknown> }): {
  code: string;
  message: string;
  details: { field?: string } | null;
} {
  assert.deepEqual(Object.keys(body).sort(), ["error"]);
  const error = body.error ?? {};
  assert.deepEqual(Object.keys(error).sort(), ["code", "details", "message"]);
  assert.equal(typeof error.code, "string");
  assert.equal(typeof error.message, "string");
  assert.notEqual(error.message, "");
  return error as { code: string; message: string; details: { field?: string } | null };
}

test("uncorrelated Google callback does not insert a profile or create a session", async () => {
  const { GET } = await import("../src/app/auth/callback/route.ts");
  const response = await GET(new Request("http://localhost:3010/auth/callback?code=google-code"));
  assert.equal(response.status, 303);
  assert.match(response.headers.get("location") ?? "", /login\?error=auth$/);
  assert.equal(inserts.length, 0); assert.equal(profiles.length, 0);
  rememberSetCookie(response);
  assert.equal(cookieJar.some(cookie => cookie.name === "sb-fixture-auth-token"), false);
});

test("verified session resolves consistently on repeated API reads", async () => {
  signIn(userId(1), "ada@gmail.com");
  const first = await getMe(); const second = await getMe();
  assert.equal(first.status, 200); assert.equal(second.status, 200);
  assert.deepEqual(await first.json(), await second.json()); assert.equal(inserts.length, 0);
});

test("POST /api/profile accepts parent and student once", async () => {
  const parentId = userId(2);
  signIn(parentId, "parent@example.com");
  const parent = await postProfile({ first_name: "Ada", role: "parent" });
  const parentBody = (await parent.json()) as Record<string, unknown>;
  assert.equal(parent.status, 201);
  assert.equal(parentBody.role, "parent");
  assert.equal(parentBody.first_name, "Ada");
  assert.equal(parentBody.email, "parent@example.com");
  assert.equal(parentBody.has_main_parent, false);
  assert.equal("error" in parentBody, false);
  assert.match(parent.headers.get("cache-control") ?? "", /private/);

  const studentId = userId(3);
  signIn(studentId, "student@example.com");
  const student = await postProfile({ first_name: "Lin", role: "student" });
  const studentBody = (await student.json()) as Record<string, unknown>;
  assert.equal(student.status, 201);
  assert.equal(studentBody.role, "student");
  assert.equal(studentBody.has_main_parent, false);
});

test("POST /api/profile rejects teacher and a second role with Aria's envelope", async () => {
  const id = userId(4);
  signIn(id, "ada@example.com");
  const teacher = await postProfile({ first_name: "Ada", role: "teacher" });
  const teacherError = assertEnvelope((await teacher.json()) as { error: Record<string, unknown> });
  assert.equal(teacher.status, 400);
  assert.equal(teacherError.code, "VALIDATION");
  assert.deepEqual(teacherError.details, { field: "role" });
  assert.equal(profiles.length, 0);

  const created = await postProfile({ first_name: "Ada", role: "parent" });
  assert.equal(created.status, 201);
  const again = await postProfile({ first_name: "Ada", role: "student" });
  const againError = assertEnvelope((await again.json()) as { error: Record<string, unknown> });
  assert.equal(again.status, 409);
  assert.equal(againError.code, "ROLE_ALREADY_SET");
  assert.equal(againError.details, null);
  const me = await getMe();
  const body = (await me.json()) as { role: string };
  assert.equal(body.role, "parent");
});

test("first name rules reject blank, 41 characters, digits, and @", async () => {
  const rejected = ["", "   ", "A".repeat(41), "Ada@", "Ada2", "---", "Ann@example.com"];
  let n = 10;
  for (const firstName of rejected) {
    signIn(userId(n), `name${n}@example.com`);
    n += 1;
    const response = await postProfile({ first_name: firstName, role: "parent" });
    const error = assertEnvelope((await response.json()) as { error: Record<string, unknown> });
    assert.equal(response.status, 400);
    assert.equal(error.code, "VALIDATION");
    assert.deepEqual(error.details, { field: "first_name" });
  }
  assert.equal(profiles.length, 0);

  for (const firstName of ["A", "A".repeat(40), "Mary Jane", "Mary-Jane", "O'Brien"]) {
    const id = userId(n);
    signIn(id, `ok${n}@example.com`);
    n += 1;
    const response = await postProfile({ first_name: firstName, role: "student" });
    const body = (await response.json()) as { first_name: string };
    assert.equal(response.status, 201);
    assert.equal(body.first_name, firstName);
  }
});

test("a non-string first name is rejected", async () => {
  signIn(userId(30), "num@example.com");
  const response = await postProfile({ first_name: 12, role: "parent" });
  const error = assertEnvelope((await response.json()) as { error: Record<string, unknown> });
  assert.equal(response.status, 400);
  assert.equal(error.code, "VALIDATION");
  assert.deepEqual(error.details, { field: "first_name" });
});

test("two Gmail addresses that share an email_key are not labeled ROLE_ALREADY_SET", async () => {
  signIn(userId(40), "ada@gmail.com");
  const first = await postProfile({ first_name: "Ada", role: "parent" });
  assert.equal(first.status, 201);
  assert.equal(profiles[0]?.email_key, "ada@gmail.com");

  signIn(userId(41), "ada@googlemail.com");
  const second = await postProfile({ first_name: "Ada", role: "student" });
  const error = assertEnvelope((await second.json()) as { error: Record<string, unknown> });
  assert.equal(second.status, 500);
  assert.equal(error.code, "INTERNAL");
  assert.notEqual(error.code, "ROLE_ALREADY_SET");
  assert.equal(error.details, null);
  assert.doesNotMatch(error.message, /ada@gmail\.com|ROLE_ALREADY_SET|duplicate key/i);
  assert.equal(profiles.length, 1);
  assert.equal(profiles[0]?.id, userId(40));
});

test("an accented first name is stored composed", async () => {
  const composed = "Jos\u00e9";
  const decomposed = "Jose\u0301";
  assert.equal(decomposed.length, 5);
  assert.equal(composed.length, 4);
  signIn(userId(50), "jose@example.com");
  const response = await postProfile({ first_name: decomposed, role: "student" });
  const body = (await response.json()) as { first_name: string };
  assert.equal(response.status, 201);
  assert.equal(body.first_name, composed);
  assert.equal(body.first_name.length, 4);
  assert.equal(profiles[0]?.first_name, composed);
  assert.equal(profiles[0]?.first_name.normalize("NFC"), composed);
});

test("an unlinked student resolves to /wait, including when the guide route does not exist", async () => {
  const id = userId(60);
  const email = "lin@example.com";
  signIn(id, email);
  const created = await postProfile({ first_name: "Lin", role: "student" });
  assert.equal(created.status, 201);
  const { pathAfterSignIn } = await import("../src/services/profile.ts");
  assert.equal(await pathAfterSignIn({ id, email }), "/wait");
  assert.equal(existsSync(new URL("../src/app/guides", import.meta.url)), false);
  assert.equal(existsSync(new URL("../content/guides", import.meta.url)), false);
  await assert.rejects(
    () => import("../src/app/guides/[slug]/route.ts"),
    (error: NodeJS.ErrnoException) => {
      assert.ok(
        error.code === "ERR_MODULE_NOT_FOUND" || /Cannot find module/.test(error.message),
      );
      return true;
    },
  );
});

test("POST /api/sign-out clears the session so the next read is 401", async () => {
  signIn(userId(70), "ada@example.com");
  const { POST } = await import("../src/app/api/sign-out/route.ts");
  const signedOut = await POST(new Request("http://localhost:3010/api/sign-out", { method: "POST", headers: mutationHeaders(), body: "{}" }));
  assert.equal(signedOut.status, 204);
  rememberSetCookie(signedOut);
  const me = await getMe();
  const error = assertEnvelope((await me.json()) as { error: Record<string, unknown> });
  assert.equal(me.status, 401);
  assert.equal(error.code, "UNAUTHENTICATED");
});
