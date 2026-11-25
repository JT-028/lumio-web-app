import "./support/dom.ts";
import React, { act, type ReactNode } from "react";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import { createRoot, type Root } from "react-dom/client";
import { dom, navigations, setViewport, typeInto } from "./support/dom.ts";
import type { AuthContext } from "../src/domain/auth-contract.ts";

mock.module("next/navigation", { exports: {
  useRouter: () => ({ replace: (path: string) => navigations.push(path) }),
  usePathname: () => window.location.pathname,
} });
mock.module("@/lib/supabase/browser", { exports: { browserSupabase() { throw new Error("Browser auth must never be used"); } } });
let AuthScreen: typeof import("../src/components/auth-screen.tsx").AuthScreen;
let AuthFlowProvider: typeof import("../src/components/auth-flow.tsx").AuthFlowProvider;
let Landing: typeof import("../src/components/landing.tsx").Landing;
let ConnectAuth: typeof import("../src/components/connect-auth.tsx").ConnectAuth;
before(async () => {
  ({ AuthScreen } = await import("../src/components/auth-screen.tsx"));
  ({ AuthFlowProvider } = await import("../src/components/auth-flow.tsx"));
  ({ Landing } = await import("../src/components/landing.tsx"));
  ({ ConnectAuth } = await import("../src/components/connect-auth.tsx"));
});
type Mode = Parameters<typeof AuthScreen>[0]["mode"];
const anonymous: AuthContext = { authenticated: false, next: null, onboarding: null, has_continuation: false, link: "none" };
let context: AuthContext;
let reply: { status: number; body: unknown };
let networkFailure = false;
let contextFailure = false;
let held: Promise<void> | null = null;
let contextHeld: Promise<void> | null = null;
let root: Root | null = null;
const calls: { path: string; init?: RequestInit }[] = [];

beforeEach(() => {
  context = { ...anonymous }; reply = { status: 200, body: { status: "authenticated", next: "/home" } };
  networkFailure = false; contextFailure = false; held = null; contextHeld = null;
  calls.length = 0; navigations.length = 0; window.history.replaceState(null, "", "/login");
  window.localStorage.clear(); window.sessionStorage.clear();
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input); calls.push({ path, init });
    if (path === "/api/auth/context") {
      const snapshot = { ...context };
      if (contextHeld) await contextHeld;
      if (contextFailure) throw new Error("synthetic-private-network-error");
      return new Response(JSON.stringify(snapshot), { headers: { "X-CSRF-Token": "c".repeat(43) } });
    }
    if (path === "/api/me") return new Response(JSON.stringify({ error: { code: "UNAUTHENTICATED" } }), { status: 401 });
    const snapshot = reply;
    if (held) await held;
    if (networkFailure) throw new Error("synthetic-private-network-error");
    return new Response(JSON.stringify(snapshot.body), { status: snapshot.status });
  }) as typeof fetch;
});
afterEach(async () => {
  if (root) await act(async () => root?.unmount()); root = null;
  assert.doesNotMatch(document.body.textContent ?? "", /synthetic-private|access_token|refresh_token/);
});
async function settle() { await act(async () => { await new Promise(r => setTimeout(r, 5)); }); }
async function mount(node: ReactNode) {
  if (root) await act(async () => root?.unmount());
  const container = document.createElement("div"); document.body.replaceChildren(container); root = createRoot(container);
  await act(async () => root?.render(node)); await settle();
}
async function screen(mode: Mode) { await mount(<AuthFlowProvider><AuthScreen mode={mode} /></AuthFlowProvider>); }
const text = () => document.body.textContent ?? "";
const control = (label: string) => {
  const button = [...document.querySelectorAll("button")].find(b => b.textContent === label);
  assert.ok(button, `Missing button ${label}`); return button;
};
const value = (id: string) => document.getElementById(id) as HTMLInputElement;
async function input(id: string, content: string) { assert.ok(value(id), `Missing field ${id}`); await typeInto(value(id), content); }
async function click(label: string) { await act(async () => control(label).click()); await settle(); }
async function submit() {
  const form = document.querySelector("form"); assert.ok(form);
  await act(async () => { form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true })); }); await settle();
}
async function credentials(signup = false) {
  if (signup) { await input("first_name", "Lin"); await act(async () => value("role-student").click()); }
  await input("email", "lin@example.test"); await input("password", "fixture-password");
  if (signup) await input("confirm", "fixture-password");
}
const posts = (path?: string) => calls.filter(c => c.init?.method === "POST" && (!path || c.path === path));

test("public landing has real login/signup links and no embedded credential form", async () => {
  await mount(<Landing />);
  assert.match(text(), /Grade 6 starts with family/);
  assert.ok(document.querySelector('a[href="/login"]'));
  assert.ok(document.querySelector('a[href="/signup"]'));
  assert.equal(document.querySelector("form, input[type=password]"), null);
  assert.match(document.querySelector("img")?.getAttribute("src") ?? "", /lumi-hero\.png/);
  assert.equal(posts().length, 0);
});

test("login form comes before whole supplied Lumi art at phone and desktop widths", async () => {
  for (const width of [320, 390, 1280]) {
    setViewport(width); await screen("login");
    const form = document.querySelector("form"); const image = document.querySelector("img");
    assert.ok(form); assert.ok(image);
    assert.ok(form.compareDocumentPosition(image) & dom.Node.DOCUMENT_POSITION_FOLLOWING);
    assert.match(image.getAttribute("src") ?? "", /lumi-hero\.png/);
    assert.equal(image.getAttribute("alt"), "Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books.");
    assert.equal(document.querySelector('input[type="checkbox"]'), null);
    assert.equal(document.querySelectorAll("h1").length, 1);
    assert.equal(value("password").autocomplete, "current-password");
    assert.ok(document.querySelector('a[href="/forgot-password"]'));
  }
});

test("blank signup focuses first invalid field and offers only explicit parent/student roles", async () => {
  await screen("signup"); await submit();
  assert.equal(document.activeElement, value("first_name"));
  assert.equal(value("first_name").getAttribute("aria-invalid"), "true");
  assert.ok(value("first_name").getAttribute("aria-describedby"));
  assert.deepEqual([...document.querySelectorAll('input[type="radio"]')].map(el => (el as HTMLInputElement).value), ["parent", "student"]);
  assert.equal(document.querySelector('input[type="radio"]:checked'), null);
  assert.equal(posts().length, 0);
});

test("signup password mismatch is local and never sends confirmation to the server", async () => {
  await screen("signup"); await credentials(true); await input("confirm", "different-fixture"); await submit();
  assert.equal(posts().length, 0); assert.equal(document.activeElement, value("confirm"));
  assert.match(text(), /Those passwords do not match/);
});

test("wrong credentials clear password, retain email and restore retry controls", async () => {
  reply = { status: 401, body: { error: { code: "INVALID_CREDENTIALS", message: "synthetic-private-provider-error", details: null } } };
  await screen("login"); await credentials(); await submit();
  assert.equal(value("password").value, ""); assert.equal(value("email").value, "lin@example.test");
  assert.match(text(), /That email and password do not match/); assert.equal(control("Sign in").disabled, false);
  const call = posts("/api/auth/sign-in")[0]!;
  assert.deepEqual(JSON.parse(String(call.init?.body)), { email: "lin@example.test", password: "fixture-password" });
  assert.equal(new Headers(call.init?.headers).get("x-csrf-token"), "c".repeat(43));
  assert.equal(call.init?.credentials, "same-origin"); assert.equal(navigations.length, 0);
});

test("signup confirmation-required response clears passwords and replaces with check-email", async () => {
  reply = { status: 202, body: { status: "check_email" } };
  await screen("signup"); await credentials(true); await submit();
  assert.deepEqual(navigations, ["/check-email"]);
  const call = posts("/api/auth/sign-up")[0]!;
  assert.deepEqual(JSON.parse(String(call.init?.body)), { email: "lin@example.test", password: "fixture-password", first_name: "Lin", role: "student" });
  assert.equal(value("password").value, ""); assert.equal(value("confirm").value, "");
  assert.equal(posts("/api/profile").length, 0);
});

test("immediate authenticated signup trusts server continuation and never rewrites profile in UI", async () => {
  const next = `/connect/${"i".repeat(43)}`;
  reply = { status: 200, body: { status: "authenticated", next } };
  await screen("signup"); await credentials(true); await submit();
  assert.deepEqual(navigations, [next]); assert.equal(posts("/api/profile").length, 0);
});

test("repeated pending submits send once and thrown network failure releases the lock", async () => {
  let release!: () => void; held = new Promise(r => { release = r; });
  await screen("login"); await credentials(); await submit(); await submit();
  assert.equal(posts().length, 1); assert.equal(document.querySelector("form")?.getAttribute("aria-busy"), "true");
  assert.equal(value("email").disabled, true);
  networkFailure = true; release(); await settle();
  assert.equal(control("Sign in").disabled, false); assert.match(text(), /couldn’t connect/);
  networkFailure = false; held = null; await submit(); assert.equal(posts().length, 2);
});

test("a departed auth screen ignores a late successful response", async () => {
  let release!: () => void; held = new Promise(r => { release = r; });
  await screen("login"); await credentials(); await submit();
  await mount(<p>New route</p>); release(); await settle();
  assert.deepEqual(navigations, []); assert.equal(text(), "New route");
});

test("a departed mode ignores the old context response", async () => {
  let release!: () => void; contextHeld = new Promise(r => { release = r; });
  context = { ...anonymous, authenticated: true, next: "/home" };
  await screen("login"); await mount(<p>Signup route</p>); release(); await settle();
  assert.deepEqual(navigations, []);
});

test("Google provider disabled restores email controls and disables only the provider action", async () => {
  reply = { status: 503, body: { error: { code: "PROVIDER_UNAVAILABLE", message: "synthetic-private-provider-error", details: null } } };
  await screen("login"); await click("Continue with Google");
  assert.equal(control("Continue with Google").disabled, true); assert.equal(control("Sign in").disabled, false);
  assert.match(text(), /Google sign-in isn’t available right now. Use email to continue/);
  assert.ok(document.querySelector('a[href="#auth-title"]'));
});

test("Google thrown request clears pending and permits another attempt", async () => {
  await screen("signup"); networkFailure = true; await click("Continue with Google");
  assert.equal(control("Continue with Google").disabled, false);
  assert.equal(posts("/api/auth/google").length, 1);
  assert.deepEqual(JSON.parse(String(posts()[0]!.init?.body)), {});
  assert.equal(posts("/api/profile").length, 0);
});

test("Google cancellation displays clean retry copy without leaking provider query data", async () => {
  window.history.replaceState(null, "", "/login?error=cancelled");
  await screen("login");
  assert.match(text(), /Google sign-in didn’t finish/); assert.equal(control("Continue with Google").disabled, false);
  assert.equal(window.location.search, ""); assert.equal(posts().length, 0);
});

test("initial context network failure shows retry rather than a credential form", async () => {
  contextFailure = true; await screen("login");
  assert.equal(document.querySelector("form"), null); assert.match(text(), /couldn’t check your account/);
  contextFailure = false; await click("Try again"); assert.ok(document.querySelector("form"));
});

for (const next of ["/role", "/wait", "/home"] as const) {
  test(`signed-in auth visit follows ${next} without flashing a form`, async () => {
    context = { ...anonymous, authenticated: true, next };
    await screen("login"); assert.deepEqual(navigations, [next]); assert.equal(document.querySelector("form"), null);
  });
}

test("reset without a staged recovery candidate offers a new link and no save control", async () => {
  await screen("reset-password");
  assert.match(text(), /This reset link can’t be used/); assert.equal(document.querySelector("form"), null);
  assert.ok(document.querySelector('a[href="/forgot-password"]')); assert.equal(posts().length, 0);
});

test("reset submits only password and returns to fresh login on success", async () => {
  context.link = "recovery";
  reply = { status: 200, body: { status: "password_updated", next: "/login?notice=password_updated" } };
  await screen("reset-password"); await input("password", "new-fixture-password"); await input("confirm", "new-fixture-password"); await submit();
  assert.deepEqual(JSON.parse(String(posts()[0]?.init?.body)), { password: "new-fixture-password" });
  assert.deepEqual(navigations, ["/login?notice=password_updated"]); assert.equal(value("password").value, "");
});

test("authoritative invalid recovery response removes the save form and leaves a usable action", async () => {
  context.link = "recovery"; reply = { status: 410, body: { error: { code: "LINK_EXPIRED", details: null } } };
  await screen("reset-password"); await input("password", "new-fixture-password"); await input("confirm", "new-fixture-password"); await submit();
  assert.equal(document.querySelector("form"), null); assert.ok(document.querySelector('a[href="/forgot-password"]'));
  assert.equal(navigations.length, 0);
});

test("confirmation candidate never verifies on mount and requires an explicit button", async () => {
  context.link = "confirmation";
  await screen("confirm-email"); assert.equal(posts().length, 0);
  await click("Confirm email"); assert.equal(posts("/api/auth/confirm").length, 1);
  assert.deepEqual(JSON.parse(String(posts()[0]?.init?.body)), {});
});

test("forgot password sends a real request with neutral response routing", async () => {
  reply = { status: 202, body: { status: "check_email" } };
  await screen("forgot-password"); await input("email", "lin@example.test"); await submit();
  assert.equal(posts("/api/auth/forgot-password").length, 1); assert.deepEqual(navigations, ["/check-email"]);
});

test("direct check-email with no trusted send context offers links without claiming mail was sent", async () => {
  await screen("check-email"); assert.match(text(), /Need an email link/);
  assert.equal(document.querySelector("form"), null); assert.equal(posts().length, 0);
});

test("password reveal preserves value and exposes accurate accessible state", async () => {
  await screen("login"); await input("password", "fixture-password");
  await click("Show password"); assert.equal(value("password").type, "text");
  assert.equal(control("Hide password").getAttribute("aria-controls"), "password");
  assert.equal(control("Hide password").getAttribute("aria-pressed"), "true");
  await click("Hide password"); assert.equal(value("password").type, "password"); assert.equal(value("password").value, "fixture-password");
});

test("legacy SDK storage is removed by key without reading credentials or touching unrelated preferences", async () => {
  window.localStorage.setItem("sb-fixture-auth-token", "synthetic-private-legacy");
  window.sessionStorage.setItem("sb-fixture-auth-token-code-verifier", "synthetic-private-legacy");
  window.localStorage.setItem("theme", "cream");
  const read = mock.method(window.localStorage, "getItem", () => { throw new Error("legacy credentials must not be read"); });
  await screen("login");
  assert.equal(read.mock.callCount(), 0); read.mock.restore();
  assert.equal(window.localStorage.getItem("sb-fixture-auth-token"), null);
  assert.equal(window.sessionStorage.getItem("sb-fixture-auth-token-code-verifier"), null);
  assert.equal(window.localStorage.getItem("theme"), "cream");
});

async function follow(label: string) {
  const link = [...document.querySelectorAll("a")].find(a => a.textContent === label); assert.ok(link);
  await act(async () => { link.dispatchEvent(new dom.MouseEvent("click", { bubbles: true, cancelable: true })); }); await settle();
}

for (const destination of ["/login", "/signup"]) {
  test(`connect hands off to clean ${destination} after saving continuation without accepting`, async () => {
    const token = "i".repeat(43);
    await mount(<ConnectAuth token={token} allowCreate />);
    await follow(destination === "/login" ? "Sign in" : "Create account");
    assert.deepEqual(navigations, [destination]);
    assert.deepEqual(posts().map(c => c.path), ["/api/auth/intent"]);
    assert.deepEqual(JSON.parse(String(posts()[0]?.init?.body)), { continuation: `/connect/${token}` });
    assert.equal(window.localStorage.length, 0); assert.equal(window.sessionStorage.length, 0);
  });
}

test("switch account restores invite intent after sign-out and reacquires CSRF for every mutation", async () => {
  await mount(<ConnectAuth token={"i".repeat(43)} allowCreate={false} switchAccount />);
  await follow("Sign out and switch account");
  assert.deepEqual(posts().map(c => c.path), ["/api/auth/intent", "/api/sign-out", "/api/auth/intent"]);
  assert.equal(calls.filter(c => c.path === "/api/auth/context").length, 3);
  assert.deepEqual(navigations, ["/login"]);
});

test("connect handoff failure releases pending and retains explicit retry without accepting", async () => {
  await mount(<ConnectAuth token={"i".repeat(43)} allowCreate />);
  networkFailure = true; await follow("Sign in");
  assert.match(text(), /couldn’t connect/); assert.deepEqual(navigations, []);
  assert.equal(document.querySelector('a[href="/login"]')?.getAttribute("aria-disabled"), "false");
  networkFailure = false; await follow("Sign in"); assert.deepEqual(navigations, ["/login"]);
});

test("a departed connect handoff cannot navigate when its intent request finishes", async () => {
  let release!: () => void; held = new Promise(r => { release = r; });
  await mount(<ConnectAuth token={"i".repeat(43)} allowCreate />); await follow("Sign in");
  await mount(<p>New route</p>); release(); await settle(); assert.deepEqual(navigations, []);
});
