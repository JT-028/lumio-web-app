import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyAuthCacheHeaders,
  sessionCookieOptions,
  toNextCookieOptions,
} from "../src/lib/supabase/cookie-options.ts";

test("production session cookies are HttpOnly, Secure, same-site and scoped to the app", () => {
  const options = toNextCookieOptions(sessionCookieOptions(true));
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.domain, undefined);
});

test("local HTTP session cookies retain the HttpOnly boundary", () => {
  const options = toNextCookieOptions(sessionCookieOptions(false));
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, false);
  assert.equal(options.sameSite, "lax");
});

test("cookie conversion preserves explicit expiry and zero-age deletion", () => {
  const expires = new Date("2020-01-01T00:00:00Z");
  const options = toNextCookieOptions({
    ...sessionCookieOptions(true), expires, maxAge: 0,
  });
  assert.equal(options.expires, expires);
  assert.equal(options.maxAge, 0);
  assert.equal(options.path, "/");
  assert.equal(options.httpOnly, true);
});

test("auth response cache headers prevent shared or persistent storage", () => {
  const headers = new Headers();
  applyAuthCacheHeaders(headers, { "Cache-Control": "public, max-age=600" });
  assert.match(headers.get("cache-control") ?? "", /private/);
  assert.match(headers.get("cache-control") ?? "", /no-store/);
  assert.doesNotMatch(headers.get("cache-control") ?? "", /public|max-age/);
});

test("production cannot downgrade Secure when an SDK cookie requests insecure options", () => {
  const previous = process.env.NODE_ENV;
  try {
    Object.assign(process.env, { NODE_ENV: "production" });
    const options = toNextCookieOptions({ httpOnly: false, secure: false, path: "/wrong", domain: ".example.test", sameSite: "none", maxAge: 9999999 });
    assert.equal(options.secure, true);
    assert.equal(options.httpOnly, true);
    assert.equal(options.path, "/");
    assert.equal(options.domain, undefined);
    assert.equal(options.sameSite, "lax");
    assert.equal(options.maxAge, 604800);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else Object.assign(process.env, { NODE_ENV: previous });
  }
});
