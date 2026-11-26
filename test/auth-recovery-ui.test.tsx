import "./support/dom.ts";
import React, { act, type ReactNode } from "react";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import { createRoot, type Root } from "react-dom/client";
import { navigations, setViewport, typeInto } from "./support/dom.ts";
import { assertArt, assertCalm, assertPage, focused, isShown, normalize, precedes, within } from "./support/ui.ts";
import type { AuthContext } from "../src/domain/auth-contract.ts";

mock.module("next/navigation", { exports: {
  useRouter: () => ({ replace: (path: string) => navigations.push(path) }),
  usePathname: () => window.location.pathname,
} });
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
  try { assertCalm(); assertArt(); }
  finally { if (root) await act(async () => root?.unmount()); root = null; }
  assert.doesNotMatch(document.body.textContent ?? "", /synthetic-private|access_token|refresh_token/);
});
async function settle() { await act(async () => { await new Promise(r => setTimeout(r, 5)); }); }
async function mount(node: ReactNode) {
  if (root) await act(async () => root?.unmount());
  const container = document.createElement("div"); document.body.replaceChildren(container); root = createRoot(container);
  await act(async () => root?.render(node)); await settle();
}
async function screen(mode: Mode) { await mount(<AuthFlowProvider><AuthScreen mode={mode} /></AuthFlowProvider>); }
/** Next route in the same tree: the provider keeps its send context, the screen remounts as its page does. */
async function stay(mode: Mode) {
  window.history.replaceState(null, "", `/${mode}`);
  await act(async () => root?.render(<AuthFlowProvider><AuthScreen key={mode} mode={mode} /></AuthFlowProvider>)); await settle();
}
const text = () => document.body.textContent ?? "";
const control = (label: string) => {
  const button = [...document.querySelectorAll("button")].find(b => b.textContent === label);
  assert.ok(button, `Missing button ${label}`); return button;
};
const value = (id: string) => document.getElementById(id) as HTMLInputElement;
/** Missing, or inside the inactive register step (`hidden`). */
const unseen = (id: string) => !isShown(document.getElementById(id));
const follows = (first: Element, second: Element) => precedes(first, second);
async function input(id: string, content: string) { assert.ok(value(id), `Missing field ${id}`); await typeInto(value(id), content); }
async function click(label: string) { await act(async () => control(label).click()); await settle(); }
async function submit() {
  const form = document.querySelector("form"); assert.ok(form);
  await act(async () => { form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })); }); await settle();
}
async function chooseRole(role: "parent" | "student") {
  await act(async () => value(`role-${role}`).click()); await click("Continue");
}
async function credentials(signup = false) {
  if (signup) { await chooseRole("student"); await input("first_name", "Lin"); }
  await input("email", "lin@example.test"); await input("password", "fixture-password");
  if (signup) await input("confirm", "fixture-password");
}
const posts = (path?: string) => calls.filter(c => c.init?.method === "POST" && (!path || c.path === path));
const stepLabel = () => normalize(document.getElementById("signup-step-label")?.textContent);
const HERO_ALT = "Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books.";

test("public landing has real login/signup links and no embedded credential form", async () => {
  await mount(<Landing />);
  assert.match(text(), /Grade 6 starts with family/);
  assert.ok(document.querySelector('a[href="/login"]'));
  assert.ok(document.querySelector('a[href="/signup"]'));
  assert.equal(document.querySelector("form, input[type=password]"), null);
  assert.match(document.querySelector("img")?.getAttribute("src") ?? "", /lumi-hero/);
  assert.equal(document.querySelector("img")?.getAttribute("alt"), HERO_ALT);
  assertPage();
  assert.equal(posts().length, 0);
});

for (const mode of ["login", "signup"] as const) {
  test(`${mode} form comes before the whole Lumi art at phone and desktop widths`, async () => {
    for (const width of [320, 390, 1280]) {
      setViewport(width); await screen(mode);
      const form = document.querySelector("form"); assert.ok(form);
      const images = [...document.querySelectorAll("img")]; assert.ok(images.length > 0);
      for (const image of images) assert.ok(follows(form, image), "no image before the form");
      const art = images.find(image => !within(form, image)); assert.ok(art);
      if (mode === "login") assert.ok(images[0] === art, "the art is the first image");
      assert.match(art.getAttribute("src") ?? "", /lumi-hero/);
      assert.equal(art.getAttribute("alt"), HERO_ALT);
      assert.equal(document.querySelector('input[type="checkbox"]'), null);
      assertPage();
      if (mode === "login") {
        assert.equal(normalize(document.getElementById("auth-title")?.textContent), "Welcome back");
        assert.equal(value("password").autocomplete, "current-password");
        assert.ok(document.querySelector('a[href="/forgot-password"]'));
      } else {
        assert.equal(normalize(document.getElementById("auth-title")?.textContent), "Create your Lumio account");
      }
    }
  });
}

test("blank signup focuses first invalid field and offers only explicit parent/student roles", async () => {
  await screen("signup"); await submit();
  assert.equal(focused(), "role-parent");
  assert.deepEqual([...document.querySelectorAll('input[type="radio"]')].map(el => (el as HTMLInputElement).value), ["parent", "student"]);
  assert.equal(document.querySelector('input[type="radio"]:checked'), null);
  await chooseRole("parent"); await submit();
  assert.equal(focused(), "first_name");
  assert.equal(value("first_name").getAttribute("aria-invalid"), "true");
  assert.ok(value("first_name").getAttribute("aria-describedby")?.split(" ").includes("first_name-error"));
  assert.equal(document.getElementById("first_name-error")?.textContent, "Enter your first name.");
  assert.equal(posts().length, 0);
});

test("register step 1 is only the role choice, and Continue is blocked until a role is picked", async () => {
  await screen("signup");
  assert.equal(stepLabel(), "Step 1 of 2");
  const heading = document.getElementById("signup-step-1-title");
  assert.equal(normalize(heading?.textContent), "Who is this account for?");
  assert.equal(heading?.closest("legend")?.parentElement?.tagName, "FIELDSET");
  for (const id of ["first_name", "email", "password", "confirm"]) assert.ok(unseen(id), `${id} waits for step 2`);
  assert.ok(!isShown([...document.querySelectorAll("button")].find(b => b.textContent === "Continue with Google")));
  const radios = [value("role-parent"), value("role-student")];
  for (const radio of radios) {
    assert.equal(radio.type, "radio"); assert.equal(radio.name, "role"); assert.equal(radio.getAttribute("tabindex"), null);
    assert.ok(isShown(radio));
  }
  assert.equal(normalize(document.getElementById("role-help")?.textContent), "Choose carefully. Your saved role can't be changed later.");
  assert.doesNotMatch(text(), /teacher/i);
  await click("Continue");
  assert.equal(focused(), "role-parent");
  assert.equal(document.getElementById("role-error")?.textContent, "Choose Parent or Student.");
  for (const radio of radios) assert.equal(radio.getAttribute("aria-invalid"), "true");
  assert.equal(stepLabel(), "Step 1 of 2"); assert.equal(posts().length, 0);
  // Native radios: arrow keys and Space move or pick, and nothing auto-advances or submits.
  for (const key of ["ArrowDown", "ArrowRight", " "]) {
    await act(async () => { value("role-parent").dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true })); }); await settle();
  }
  await act(async () => value("role-student").click()); await settle();
  assert.equal(document.getElementById("role-error")?.textContent ?? "", "");
  assert.equal(stepLabel(), "Step 1 of 2"); assert.ok(unseen("email")); assert.equal(posts().length, 0);
  await click("Continue");
  assert.equal(stepLabel(), "Step 2 of 2");
  assert.equal(focused(), "signup-step-2-title");
  assert.equal(normalize(document.getElementById("signup-step-2-title")?.textContent), "Your details");
  assert.match(normalize(text()), /Signing up as a Student\./);
  assert.ok(unseen("role-parent")); assert.ok(isShown(value("email"))); assert.equal(posts().length, 0);
});

test("register Back keeps typed values and the role, and only step 2 posts the same sign-up payload", async () => {
  reply = { status: 202, body: { status: "check_email" } };
  await screen("signup"); await chooseRole("parent");
  assert.match(normalize(text()), /Signing up as a Parent\./);
  await input("first_name", "Lin"); await input("email", "lin@example.test");
  await input("password", "fixture-password"); await input("confirm", "fixture-password");
  await click("Back");
  assert.equal(stepLabel(), "Step 1 of 2");
  assert.equal(focused(), "signup-step-1-title");
  assert.equal(value("role-parent").checked, true); assert.ok(unseen("email")); assert.equal(posts().length, 0);
  await act(async () => value("role-student").click()); await click("Continue");
  assert.equal(focused(), "signup-step-2-title");
  assert.deepEqual(["first_name", "email", "password", "confirm"].map(id => value(id).value), ["Lin", "lin@example.test", "fixture-password", "fixture-password"]);
  await submit();
  assert.deepEqual(posts().map(c => c.path), ["/api/auth/sign-up"]);
  assert.deepEqual(JSON.parse(String(posts()[0]!.init?.body)), { email: "lin@example.test", password: "fixture-password", first_name: "Lin", role: "student" });
  assert.deepEqual(navigations, ["/check-email"]);
});

test("a server role error on step 2 returns to step 1, shows it on the role and focuses Parent", async () => {
  reply = { status: 400, body: { error: { code: "VALIDATION", message: "synthetic-private-provider-error", details: { field: "role" } } } };
  await screen("signup"); await credentials(true); await submit();
  assert.equal(posts("/api/auth/sign-up").length, 1);
  assert.equal(stepLabel(), "Step 1 of 2");
  assert.equal(focused(), "role-parent");
  assert.equal(document.getElementById("role-error")?.textContent, "Check the highlighted field and try again.");
  assert.ok(unseen("email"));
});

test("login puts Google first, then the or divider, then the email form, and one polite #auth-status", async () => {
  await screen("login");
  assert.equal(normalize(text()).includes("Sign in to your Lumio account."), true);
  const form = document.querySelector("form"); assert.ok(form);
  const google = control("Continue with Google");
  const divider = [...document.querySelectorAll("body *")].find(el => el.children.length === 0 && normalize(el.textContent) === "or");
  assert.ok(divider, "an or divider");
  assert.ok(follows(google, divider) && follows(divider, form) && !within(form, google));
  const order = [value("email"), value("password"), document.querySelector('a[href="/forgot-password"]'), control("Sign in")];
  for (const [index, node] of order.entries()) {
    assert.ok(node && within(form, node));
    if (index > 0) assert.ok(follows(order[index - 1]!, node));
  }
  assert.equal(value("email").type, "email"); assert.equal(value("email").autocomplete, "username");
  assert.equal(value("email").getAttribute("inputmode"), "email"); assert.equal(value("email").getAttribute("autocapitalize"), "none");
  assert.equal(value("email").getAttribute("spellcheck"), "false");
  const statuses = document.querySelectorAll("#auth-status"); assert.equal(statuses.length, 1);
  assert.equal(statuses[0]!.getAttribute("role"), "status"); assert.ok(follows(control("Sign in"), statuses[0]!));
  assert.match(normalize(text()), /New to Lumio\? Create account/);
});

test("a password-updated notice is a polite success in #auth-status", async () => {
  window.history.replaceState(null, "", "/login?notice=password_updated");
  await screen("login");
  const status = document.getElementById("auth-status");
  assert.equal(normalize(status?.textContent), "Your password has been updated.");
  assert.equal(status?.getAttribute("role"), "status"); assert.equal(window.location.search, "");
});

test("signup password mismatch is local and never sends confirmation to the server", async () => {
  await screen("signup"); await credentials(true); await input("confirm", "different-fixture"); await submit();
  assert.equal(posts().length, 0); assert.equal(document.activeElement, value("confirm"));
  assert.match(text(), /Those passwords do not match/);
  assert.equal(control("Show confirmation password").getAttribute("aria-controls"), "confirm");
  assert.equal(control("Show confirmation password").getAttribute("aria-pressed"), "false");
});

test("wrong credentials clear password, retain email and restore retry controls", async () => {
  reply = { status: 401, body: { error: { code: "INVALID_CREDENTIALS", message: "synthetic-private-provider-error", details: null } } };
  await screen("login"); await credentials(); await submit();
  assert.equal(value("password").value, ""); assert.equal(value("email").value, "lin@example.test");
  assert.match(text(), /That email and password do not match/); assert.equal(control("Sign in").disabled, false);
  assert.equal(document.getElementById("auth-status")?.getAttribute("role"), "alert");
  assert.equal(focused(), "auth-status");
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
  await screen("signup"); await chooseRole("parent");
  const google = control("Continue with Google"); assert.ok(isShown(google));
  assert.ok(google.getAttribute("aria-describedby")?.split(" ").includes("google-role-note"));
  assert.equal(normalize(document.getElementById("google-role-note")?.textContent), "With Google, you'll choose Parent or Student again on the next screen.");
  networkFailure = true; await click("Continue with Google");
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
  await screen("reset-password");
  assert.match(normalize(text()), /Pick a new password you'll remember\./);
  await input("password", "new-fixture-password"); await input("confirm", "new-fixture-password"); await submit();
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
  assert.match(normalize(text()), /Press the button to finish confirming your email\./);
  await click("Confirm email"); assert.equal(posts("/api/auth/confirm").length, 1);
  assert.deepEqual(JSON.parse(String(posts()[0]?.init?.body)), {});
});

test("forgot password sends a real request with neutral response routing", async () => {
  reply = { status: 202, body: { status: "check_email" } };
  await screen("forgot-password");
  assert.match(normalize(text()), /No worries\. Enter your email and we'll send you a reset link\./);
  await input("email", "lin@example.test"); await submit();
  assert.equal(posts("/api/auth/forgot-password").length, 1); assert.deepEqual(navigations, ["/check-email"]);
});

test("check-email shows a calm text countdown while the resend cooldown runs", async () => {
  reply = { status: 202, body: { status: "check_email" } };
  await screen("forgot-password"); await input("email", "lin@example.test"); await submit();
  await stay("check-email");
  assert.match(normalize(text()), /If an account uses this email, you'll receive a link to reset its password\./);
  const timer = document.getElementById("resend-timer"); assert.ok(timer);
  const match = normalize(timer.textContent).match(/^You can send another email in (\d+) seconds?\.$/);
  assert.ok(match, `countdown text: ${timer.textContent}`);
  assert.ok(Number(match[1]) >= 1 && Number(match[1]) <= 60);
  assert.equal(timer.getAttribute("aria-live"), "off");
  const resend = control("Send another reset link");
  assert.equal(resend.disabled, true);
  assert.ok(resend.getAttribute("aria-describedby")?.split(" ").includes("resend-timer"));
});

test("check-email shows no countdown once the cooldown has ended", async () => {
  reply = { status: 202, body: { status: "check_email" } };
  await screen("forgot-password"); await input("email", "lin@example.test");
  const earlier = Date.now() - 120_000;
  const clock = mock.method(Date, "now", () => earlier);
  try { await submit(); } finally { clock.mock.restore(); }
  await stay("check-email");
  assert.match(normalize(text()), /Check your spam folder too\./);
  assert.equal(document.getElementById("resend-timer"), null);
  assert.equal(control("Send another reset link").disabled, false);
});

test("direct check-email with no trusted send context offers links without claiming mail was sent", async () => {
  await screen("check-email"); assert.match(text(), /Need an email link/);
  assert.equal(document.querySelector("form"), null); assert.equal(posts().length, 0);
});

test("password reveal preserves value and exposes accurate accessible state", async () => {
  await screen("login"); await input("password", "fixture-password");
  assert.equal(control("Show password").getAttribute("aria-pressed"), "false");
  assert.equal(control("Show password").getAttribute("aria-controls"), "password");
  assert.equal(control("Show password").type, "button");
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
  await act(async () => { link.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true })); }); await settle();
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
