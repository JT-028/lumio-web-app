import assert from "node:assert/strict";
import { beforeEach, mock, test } from "node:test";
import { cookies, resetCookies } from "./support/cookies.ts";

mock.module("server-only", { exports: {} });
mock.module("next/headers", { exports: { cookies } });

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

function clearEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

let networkCalls = 0;

beforeEach(() => {
  clearEnv();
  resetCookies();
  networkCalls = 0;
  globalThis.fetch = (async () => {
    networkCalls += 1;
    throw new Error("session tests must not call the network");
  }) as typeof fetch;
});

async function getMe(): Promise<Response> {
  const { GET } = await import("../src/app/api/me/route.ts");
  return GET(new Request("http://127.0.0.1:3010/api/me"));
}

async function errorBody(response: Response): Promise<{
  code: string;
  message: string;
  details: { field: string } | null;
}> {
  const body = (await response.json()) as { error?: Record<string, unknown> };
  assert.deepEqual(Object.keys(body).sort(), ["error"]);
  const error = body.error ?? {};
  assert.deepEqual(Object.keys(error).sort(), ["code", "details", "message"]);
  return {
    code: String(error.code),
    message: String(error.message),
    details: (error.details ?? null) as { field: string } | null,
  };
}

test("GET /api/me returns 503 AUTH_UNAVAILABLE when the server is not configured", async () => {
  const response = await getMe();
  const error = await errorBody(response);
  assert.equal(response.status, 503);
  assert.equal(error.code, "AUTH_UNAVAILABLE");
  assert.equal(error.message, "Sign in is temporarily unavailable.");
  assert.equal(error.details, null);
  assert.match(response.headers.get("cache-control") ?? "", /private/);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  assert.equal(networkCalls, 0);
});

test("GET /api/me without a session is 401 UNAUTHENTICATED when the server is configured", async () => {
  process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3010";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:9";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
  const response = await getMe();
  const error = await errorBody(response);
  assert.equal(response.status, 401);
  assert.equal(error.code, "UNAUTHENTICATED");
  assert.equal(error.message, "Sign in is required.");
  assert.equal(error.details, null);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  assert.equal(networkCalls, 0);
});
