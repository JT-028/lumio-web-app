import "./support/dom.ts";
import React, { act, type ReactNode } from "react";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import { createRoot, type Root } from "react-dom/client";
import type { Me } from "../src/domain/types.ts";
import { dom, navigations, setViewport, typeInto } from "./support/dom.ts";

const fixture = "synthetic-connect-fixture";
const privateValue = "private-response-fixture";
const student: Me = { id: "student-fixture", role: "student", first_name: "Lin", email: "lin@gmail.com", has_main_parent: false };
const parent: Me = { ...student, id: "parent-fixture", role: "parent", first_name: "Ada" };
const preview = { parent_first_name: "Ada", invited_email: "lin@gmail.com", expires_at: "2026-11-01T09:00:00.000Z", state: "sent" };
let me: Me | null;
let sessionAfterAuth: Me | null;
let signUpSession: boolean;
let authError: { code?: string; message?: string } | null;
let emptyIdentities: boolean;
let throwAuth: boolean;
let oauthUrl: string | null;
const authCalls: { name: string; args: unknown }[] = [];
mock.module("@/lib/supabase/browser", { exports: {
  browserSupabase: () => ({ auth: {
    async signInWithPassword(args: unknown) {
      authCalls.push({ name: "signin", args });
      if (throwAuth) throw new Error(fixture);
      if (!authError) me = sessionAfterAuth;
      return { error: authError };
    },
    async signUp(args: unknown) {
      authCalls.push({ name: "signup", args });
      if (throwAuth) throw new Error(fixture);
      if (signUpSession) me = sessionAfterAuth;
      return { error: authError, data: { user: { identities: emptyIdentities ? [] : [{}] }, session: signUpSession ? {} : null } };
    },
    async signInWithOAuth(args: unknown) {
      authCalls.push({ name: "google", args });
      if (throwAuth) throw new Error(fixture);
      return { error: authError, data: { url: oauthUrl } };
    },
    async signOut() {},
  } }),
} });
mock.module("next/navigation", { exports: { useParams: () => ({ token: fixture }) } });

type Reply = { status: number; body?: unknown; network?: boolean };
let previewReply: Reply;
let acceptReply: Reply;
let homeReply: Reply;
let inviteReply: Reply;
let holdAccept: Promise<void> | null;
let holdPreview: Promise<void> | null;
let holdHome: Promise<void> | null;
let holdMe: Promise<void> | null;
let holdInvite: Promise<void> | null;
const calls: { url: string; init?: RequestInit }[] = [];
function response(reply: Reply) {
  if (reply.network) throw new Error(fixture);
  return new Response(JSON.stringify(reply.body ?? { error: { code: "UNKNOWN", message: fixture, details: { value: fixture } } }), { status: reply.status });
}
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input); calls.push({ url, init });
  if (url === "/api/me") {
    const reply = me ? { status: 200, body: me } : { status: 401 };
    if (holdMe) await holdMe;
    return response(reply);
  }
  if (url === "/api/home") { const reply = homeReply; if (holdHome) await holdHome; return response(reply); }
  if (url === "/api/invites") { const reply = inviteReply; if (holdInvite) await holdInvite; return response(reply); }
  if (url === "/api/sign-out") return new Response(null, { status: 204 });
  if (url.endsWith("/accept")) { if (holdAccept) await holdAccept; return response(acceptReply); }
  if (url.startsWith("/api/connect/")) { if (holdPreview) await holdPreview; return response(previewReply); }
  throw new Error("Unexpected request");
}) as typeof fetch;

let ConnectScreen: typeof import("../src/components/connect-screen.tsx").ConnectScreen;
let HomeScreen: typeof import("../src/components/home-screen.tsx").HomeScreen;
let WaitScreen: typeof import("../src/components/wait-screen.tsx").WaitScreen;
let getHome: typeof import("../src/lib/m2-client.ts").getHome;
let getConnectPreview: typeof import("../src/lib/m2-client.ts").getConnectPreview;
let acceptConnect: typeof import("../src/lib/m2-client.ts").acceptConnect;
let connectExpiry: typeof import("../src/lib/m2-client.ts").connectExpiry;
let postInvite: typeof import("../src/lib/lumio-client.ts").postInvite;
before(async () => {
  ({ ConnectScreen } = await import("../src/components/connect-screen.tsx"));
  ({ HomeScreen } = await import("../src/components/home-screen.tsx"));
  ({ WaitScreen } = await import("../src/components/wait-screen.tsx"));
  ({ getHome, getConnectPreview, acceptConnect, connectExpiry } = await import("../src/lib/m2-client.ts"));
  ({ postInvite } = await import("../src/lib/lumio-client.ts"));
});
let root: Root | null = null;
const text = () => document.body.textContent ?? "";
const buttons = () => Array.from(document.querySelectorAll("button"));
const button = (label: string) => {
  const found = buttons().find((el) => el.textContent === label);
  assert.ok(found, `Missing control: ${label}`); return found;
};
async function settle() { await act(async () => { await new Promise((r) => setTimeout(r, 5)); }); }
async function render(node: ReactNode) {
  if (root) await act(async () => root?.unmount());
  const container = document.createElement("div"); document.body.replaceChildren(container);
  root = createRoot(container);
  await act(async () => root?.render(node)); await settle();
}
async function click(label: string) { await act(async () => button(label).click()); await settle(); }
async function submit() {
  const form = document.querySelector("form"); assert.ok(form);
  await act(async () => { form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true })); });
  await settle();
}
async function input(id: string, value: string) { await typeInto(document.getElementById(id) as HTMLInputElement, value); }
async function credentials(create = false) {
  if (create) await click("Create account");
  await input("connect-password", "test-password");
  if (create) await input("connect-confirm", "test-password");
}
const accepts = () => calls.filter((c) => c.url.endsWith("/accept"));
function noLeaks() {
  assert.ok(!document.body.innerHTML.includes(fixture));
  assert.ok(!document.body.innerHTML.includes(privateValue));
  assert.ok(!document.title.includes(fixture));
  assert.ok(!JSON.stringify(authCalls).includes(fixture));
  assert.ok(navigations.every((path) => ["/", "/role", "/wait", "/home"].includes(path)));
}
beforeEach(() => {
  navigations.length = 0; calls.length = 0; authCalls.length = 0;
  me = null; sessionAfterAuth = student; signUpSession = false; authError = null;
  emptyIdentities = false; throwAuth = false; oauthUrl = "https://example.test/mock-oauth";
  holdAccept = null; holdPreview = null; holdHome = null; holdMe = null; holdInvite = null;
  previewReply = { status: 200, body: { ...preview, token: fixture, invited_email_key: privateValue } };
  acceptReply = { status: 200, body: { state: "accepted", student_id: privateValue, main_parent_id: privateValue } };
  homeReply = { status: 200, body: { role: "student", first_name: "Lin", needs_parent: true, children: [] } };
  inviteReply = { status: 201, body: { invited_email: "child@gmail.com", token: fixture } };
  document.title = "Connect — Lumio"; setViewport(320);
});
afterEach(async () => { noLeaks(); if (root) await act(async () => root?.unmount()); root = null; });

test("preview loading has real chrome, skeleton, no auth or accept", async () => {
  let release!: () => void; holdPreview = new Promise((r) => { release = r; });
  await render(<ConnectScreen token={fixture} />);
  assert.ok(document.querySelector('.skeleton'));
  assert.equal(document.querySelector("main")?.getAttribute("aria-busy"), "true");
  assert.match(text(), /Learn\. Grow\. Level Up\./); assert.equal(document.querySelector("form"), null);
  release(); await settle(); assert.ok(document.querySelector("form"));
});

for (const [status, message] of [[404, "This connect link could not be found."], [410, "This link has expired."]] as const) {
  test(`preview ${status} has generic title and no form or accept`, async () => {
    previewReply = { status }; me = student;
    await render(<ConnectScreen token={fixture} />);
    assert.ok(text().includes(message)); assert.equal(document.title, "Connect — Lumio");
    assert.equal(document.querySelector("form"), null); assert.equal(accepts().length, 0);
    assert.ok(!buttons().some((v) => v.textContent === "Accept this link"));
  });
}
test("network preview failure focuses retry; retry repeats GET without accepting", async () => {
  previewReply = { status: 500, network: true };
  await render(<ConnectScreen token={fixture} />);
  assert.match(text(), /This page could not be loaded/); assert.equal(document.activeElement, button("Try again"));
  previewReply = { status: 200, body: preview }; await click("Try again");
  assert.equal(calls.filter((c) => c.url.startsWith("/api/connect/")).length, 2);
  assert.equal(accepts().length, 0); assert.equal((document.getElementById("connect-email") as HTMLInputElement).value, "lin@gmail.com");
});
test("expiry uses local date and time, and malformed expiry never renders raw data", async () => {
  assert.equal(connectExpiry(preview.expires_at), `This link lasts until ${new Date(preview.expires_at).toLocaleString()}. Links last 7 days.`);
  previewReply = { status: 200, body: { ...preview, expires_at: fixture } };
  await render(<ConnectScreen token={fixture} />);
  assert.match(text(), /This link has an end time, and the date could not be shown/);
});
for (const state of ["accepted", "ignored"]) {
  test(`signed-out ${state} preview allows sign-in and Google, never create`, async () => {
    previewReply = { status: 200, body: { ...preview, state } };
    await render(<ConnectScreen token={fixture} />);
    button("Continue with Google"); assert.ok(buttons().some((b) => b.textContent === "Sign in"));
    assert.ok(!buttons().some((b) => b.textContent === "Create account")); assert.equal(accepts().length, 0);
  });
}
test("signup password mismatch and missing fields focus errors without auth", async () => {
  await render(<ConnectScreen token={fixture} />); await click("Create account");
  await input("connect-email", ""); await submit();
  assert.equal(document.activeElement?.id, "connect-email"); assert.match(text(), /Enter your email/);
  await input("connect-email", "bad"); await submit(); assert.match(text(), /Enter a valid email address/);
  await input("connect-email", "lin@gmail.com"); await input("connect-password", "one"); await input("connect-confirm", "two");
  await submit(); assert.match(text(), /Those passwords do not match/);
  assert.equal(document.activeElement?.id, "connect-confirm"); assert.equal(authCalls.length, 0);
});
test("signup awaiting confirmation stays on link and sends no role, return, or accept", async () => {
  await render(<ConnectScreen token={fixture} />); await credentials(true); await submit();
  assert.match(text(), /Then come back to this page and sign in/); assert.deepEqual(navigations, []);
  assert.deepEqual(authCalls, [{ name: "signup", args: { email: "lin@gmail.com", password: "test-password", options: { emailRedirectTo: "http://localhost:3010/auth/callback" } } }]);
  assert.equal(accepts().length, 0);
});
test("signup with session and no role leaves for role without token or profile write", async () => {
  sessionAfterAuth = { ...student, role: null, first_name: null }; signUpSession = true;
  await render(<ConnectScreen token={fixture} />); await credentials(true); await submit();
  assert.deepEqual(navigations, ["/role"]); assert.equal(document.querySelector("form"), null);
  assert.equal(accepts().length, 0); assert.ok(!calls.some((c) => c.url === "/api/profile"));
});
for (const role of ["parent", "student"] as const) {
  test(`signup with existing ${role} role opens explicit connect state`, async () => {
    sessionAfterAuth = role === "parent" ? parent : student; signUpSession = true;
    await render(<ConnectScreen token={fixture} />); await credentials(true); await submit();
    if (role === "student") button("Accept this link");
    else { assert.match(text(), /A parent account cannot accept/); button("Go to home"); }
    assert.equal(accepts().length, 0); assert.deepEqual(navigations, []);
  });
}
test("successful auth without a readable session remains generic and never accepts", async () => {
  sessionAfterAuth = null;
  await render(<ConnectScreen token={fixture} />); await credentials(); await submit();
  assert.match(text(), /Sign-in did not finish/); assert.equal(accepts().length, 0);
});
test("existing session without role goes to role; unlinked student can stay on connect", async () => {
  me = { ...student, role: null, first_name: null }; await render(<ConnectScreen token={fixture} />);
  assert.deepEqual(navigations, ["/role"]); navigations.length = 0;
  me = student; await render(<ConnectScreen token={fixture} />); button("Accept this link");
  assert.deepEqual(navigations, []); assert.equal(accepts().length, 0);
});
test("sign-in keeps student on connect until explicit acceptance; edited email is only auth input", async () => {
  await render(<ConnectScreen token={fixture} />); await credentials(); await input("connect-email", "other@gmail.com"); await submit();
  button("Accept this link"); assert.equal(accepts().length, 0); assert.deepEqual(navigations, []);
  await click("Accept this link"); assert.deepEqual(navigations, ["/wait"]);
  assert.equal(accepts().length, 1); assert.equal(accepts()[0].init?.body, undefined);
  assert.equal(accepts()[0].init?.method, "POST");
});
for (const error of ["invalid_credentials", "email_not_confirmed", "unknown"]) {
  test(`sign-in maps ${error} without provider message`, async () => {
    authError = { code: error, message: fixture };
    await render(<ConnectScreen token={fixture} />); await credentials(); await submit();
    assert.ok(text().includes(error === "invalid_credentials" ? "That email and password do not match." : error === "email_not_confirmed" ? "Confirm your email first" : "Sign-in did not finish."));
    assert.equal((document.getElementById("connect-password") as HTMLInputElement).value, "");
    assert.equal((document.getElementById("connect-email") as HTMLInputElement).value, "lin@gmail.com");
  });
}
for (const kind of ["registered", "identities", "password"]) {
  test(`signup ${kind} maps safely and preserves email`, async () => {
    if (kind === "identities") emptyIdentities = true;
    else authError = { code: kind === "registered" ? "user_already_exists" : "weak_password", message: fixture };
    await render(<ConnectScreen token={fixture} />); await credentials(true); await submit();
    if (kind === "password") assert.match(text(), /That password was not accepted/);
    else { assert.match(text(), /That email is already registered/); await click("Sign in instead"); assert.equal(document.getElementById("connect-confirm"), null); }
    assert.equal((document.getElementById("connect-email") as HTMLInputElement).value, "lin@gmail.com");
    assert.equal(accepts().length, 0);
  });
}
test("Google reuses callback exactly; missing OAuth URL and thrown auth stay generic", async () => {
  oauthUrl = null; await render(<ConnectScreen token={fixture} />); await click("Continue with Google");
  assert.match(text(), /Google sign-in did not finish/);
  assert.deepEqual(authCalls[0], { name: "google", args: { provider: "google", options: { redirectTo: "http://localhost:3010/auth/callback" } } });
  throwAuth = true; await credentials(); await submit(); assert.match(text(), /Sign-in did not finish/); assert.equal(accepts().length, 0);
});

for (const state of ["sent", "accepted", "ignored"]) {
  test(`student may explicitly accept ${state} preview; duplicate clicks send one request`, async () => {
    me = student; previewReply = { status: 200, body: { ...preview, state } };
    let release!: () => void; holdAccept = new Promise((r) => { release = r; });
    await render(<ConnectScreen token={fixture} />); assert.equal(accepts().length, 0);
    await click("Accept this link"); assert.equal(button("Accepting…").disabled, true);
    await act(async () => button("Accepting…").click()); assert.equal(accepts().length, 1);
    release(); await settle(); assert.deepEqual(navigations, ["/wait"]);
  });
}
test("ignored acceptance stays with first parent and offers home", async () => {
  me = student; acceptReply = { status: 200, body: { state: "ignored", student_id: privateValue, reason: privateValue } };
  await render(<ConnectScreen token={fixture} />); await click("Accept this link");
  assert.match(text(), /You stay with the first parent/); assert.deepEqual(navigations, []);
  await click("Go to home"); assert.deepEqual(navigations, ["/home"]);
});
for (const [status, code, message] of [
  [403, "EMAIL_MISMATCH", "You are signed in as the wrong address"],
  [403, "ROLE_NOT_STUDENT", "A parent account cannot accept"],
  [409, "ALREADY_USED", "Someone else already used this link"],
  [410, "LINK_EXPIRED", "This link has expired"],
  [404, "NOT_FOUND", "This connect link could not be found"],
] as const) {
  test(`accept ${code} displays safe sentence and removes accept`, async () => {
    me = student; acceptReply = { status, body: { error: { code, message: fixture, details: fixture } } };
    await render(<ConnectScreen token={fixture} />); await click("Accept this link");
    assert.ok(text().includes(message)); assert.ok(!buttons().some((b) => b.textContent === "Accept this link"));
    assert.deepEqual(navigations, []);
  });
}
test("known parent has no accept and a path to home", async () => {
  me = parent; await render(<ConnectScreen token={fixture} />);
  assert.match(text(), /A parent account cannot accept/); assert.equal(accepts().length, 0);
  assert.ok(!buttons().some((b) => b.textContent === "Accept this link")); button("Go to home");
});
test("accept network error leaves retryable button; later 401 clears private preview", async () => {
  me = student; acceptReply = { status: 500, network: true };
  await render(<ConnectScreen token={fixture} />); await click("Accept this link");
  assert.match(text(), /This link could not be accepted/); button("Accept this link");
  acceptReply = { status: 401 }; await click("Accept this link");
  assert.deepEqual(navigations, ["/"]); assert.doesNotMatch(text(), /lin@gmail|Ada sent/);
});
test("accept role-required goes to role without retaining preview or forwarding token", async () => {
  me = student; acceptReply = { status: 403, body: { error: { code: "ROLE_REQUIRED", message: fixture } } };
  await render(<ConnectScreen token={fixture} />); await click("Accept this link");
  assert.deepEqual(navigations, ["/role"]); assert.doesNotMatch(text(), /lin@gmail|Ada sent/);
});
test("accepted navigation failure offers retry without another accept", async () => {
  me = student; const original = dom.location.replace;
  dom.location.replace = () => { throw new Error(fixture); };
  try {
    await render(<ConnectScreen token={fixture} />); await click("Accept this link");
    assert.match(text(), /waiting page did not open/);
  } finally { dom.location.replace = original; }
  await click("Try again"); assert.deepEqual(navigations, ["/wait"]); assert.equal(accepts().length, 1);
});
test("parent home lists returned first names in order, including duplicates, at both widths", async () => {
  me = parent;
  homeReply = { status: 200, body: { role: "parent", first_name: "HomeName", needs_parent: false,
    children: ["Zoe", "Lin", "Lin"].map((first_name) => ({ first_name, id: privateValue, email: privateValue, official_cards: [privateValue], study_sets: [privateValue] })) } };
  for (const width of [320, 1280]) {
    setViewport(width); await render(<HomeScreen />);
    assert.match(text(), /Hello, HomeName/);
    assert.deepEqual(Array.from(document.querySelectorAll(".linked-children li")).map((li) => li.textContent), ["Zoe", "Lin", "Lin"]);
    assert.equal(document.querySelectorAll(".linked-children a").length, 0); button("Send connect email");
  }
});
test("empty parent list remains empty after invite success", async () => {
  me = parent; homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [] } };
  await render(<HomeScreen />); await input("child-gmail", "child@gmail.com"); await submit();
  assert.match(text(), /No child is linked yet/); assert.match(text(), /Connect email sent to child@gmail.com/);
  assert.equal(document.querySelectorAll(".linked-children li").length, 0);
  assert.deepEqual(JSON.parse(String(calls.find((c) => c.url === "/api/invites")?.init?.body)), { invited_email: "child@gmail.com" });
});
test("parent invite invalid email error is attached to and focuses the field", async () => {
  me = parent; homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [] } };
  inviteReply = { status: 400, body: { error: { code: "INVALID_EMAIL", message: fixture, details: { field: "invited_email" } } } };
  await render(<HomeScreen />); await input("child-gmail", "child@gmail.com"); await submit();
  assert.equal(document.activeElement?.id, "child-gmail");
  assert.equal(document.getElementById("child-gmail")?.getAttribute("aria-invalid"), "true");
  assert.match(document.getElementById("child-gmail-error")?.textContent ?? "", /Enter a Gmail address/);
});

test("invite validation keeps a typed field independent of provider copy", async () => {
  inviteReply = { status: 400, body: { error: { code: "INVALID_EMAIL", message: fixture } } };
  const result = await postInvite("child@gmail.com");
  assert.deepEqual(result, {
    ok: false, status: 400, field: "invited_email",
    message: "Enter a Gmail address ending in @gmail.com or @googlemail.com.",
  });
});
test("parent invite 401 removes greeting, child list, and form before navigation", async () => {
  me = parent; homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [{ first_name: "Zoe" }] } };
  inviteReply = { status: 401 };
  await render(<HomeScreen />); await input("child-gmail", "child@gmail.com"); await submit();
  assert.deepEqual(navigations, ["/"]); assert.doesNotMatch(text(), /Hello, Ada|Zoe|Connect a child/);
});
test("parent household error retries without a false empty list or invite form", async () => {
  me = parent; homeReply = { status: 503 };
  await render(<HomeScreen />); assert.match(text(), /We could not open your home/);
  assert.equal(document.querySelector("form"), null); assert.doesNotMatch(text(), /No child is linked/);
  homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [] } };
  await click("Try again"); button("Send connect email");
});
for (const status of [401, 403]) {
  test(`parent home ${status} clears private UI and follows guard`, async () => {
    me = parent; homeReply = { status, body: { error: { code: "ROLE_REQUIRED", message: fixture } } };
    await render(<HomeScreen />); assert.deepEqual(navigations, [status === 401 ? "/" : "/role"]);
    assert.equal(document.querySelector("form"), null); assert.doesNotMatch(text(), /Hello, Ada/);
  });
}
test("linked student dashboard still reads only me and study names remain nonfunctional", async () => {
  me = { ...student, has_main_parent: true }; await render(<HomeScreen />);
  assert.match(text(), /Your next guide is not on this page yet/); assert.match(text(), /No study time yet/);
  assert.equal(calls.filter((c) => c.url === "/api/home").length, 0);
  assert.ok(Array.from(document.querySelectorAll("a")).every((a) => a.getAttribute("href") === "/home"));
});
test("waiting uses home on mount and Check again, stays waiting, then exits when linked", async () => {
  await render(<WaitScreen />); button("Check again"); await click("Check again");
  assert.match(text(), /Still waiting for a parent/);
  homeReply = { status: 200, body: { role: "student", first_name: "Lin", needs_parent: false, children: [] } };
  await click("Check again"); assert.deepEqual(navigations, ["/home"]);
  assert.deepEqual(calls.map((c) => c.url), ["/api/home", "/api/home", "/api/home"]);
  assert.doesNotMatch(text(), /Continue learning|No study time yet/);
});
for (const [status, code, next] of [[401, "UNAUTHENTICATED", "/"], [403, "ROLE_REQUIRED", "/role"], [200, "parent", "/home"]] as const) {
  test(`waiting guard ${code} follows ${next}`, async () => {
    homeReply = { status, body: status === 200 ? { role: "parent", first_name: "Ada", needs_parent: false, children: [] } : { error: { code, message: fixture } } };
    await render(<WaitScreen />); assert.deepEqual(navigations, [next]);
    assert.doesNotMatch(text(), /Waiting for a parent/);
  });
}
test("waiting network failure stays waiting and retry never assumes linked", async () => {
  homeReply = { status: 500, network: true }; await render(<WaitScreen />);
  assert.match(text(), /We could not check your account/); assert.deepEqual(navigations, []);
  await click("Check again"); assert.match(text(), /Waiting for a parent/); assert.deepEqual(navigations, []);
});
test("client adapters discard private fields and reject malformed success", async () => {
  assert.deepEqual(await getConnectPreview(fixture), { ok: true, data: preview });
  assert.deepEqual(await acceptConnect(fixture), { ok: true, data: "accepted" });
  homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [{ first_name: "Lin", email: privateValue, id: privateValue }] } };
  assert.deepEqual(await getHome(), { ok: true, data: { role: "parent", first_name: "Ada", needs_parent: false, children: [{ first_name: "Lin" }] } });
  homeReply = { status: 200, body: { children: [] } }; assert.equal((await getHome()).ok, false);
  previewReply = { status: 200, body: { state: "sent" } }; assert.equal((await getConnectPreview(fixture)).ok, false);
  acceptReply = { status: 200, body: { state: "unknown" } }; assert.equal((await acceptConnect(fixture)).ok, false);
});

test("a departed waiting screen cannot redirect the new connect screen", async () => {
  let release!: () => void; holdHome = new Promise((r) => { release = r; });
  homeReply = { status: 200, body: { role: "student", first_name: "Lin", needs_parent: false, children: [] } };
  await render(<WaitScreen />);
  await render(<ConnectScreen token={fixture} />);
  release(); await settle();
  assert.match(text(), /Connect to a parent/);
  assert.deepEqual(navigations, []);
});

test("a departed connect screen cannot navigate after its accept resolves", async () => {
  me = student;
  let release!: () => void; holdAccept = new Promise((r) => { release = r; });
  await render(<ConnectScreen token={fixture} />); await click("Accept this link");
  await render(<WaitScreen />);
  release(); await settle();
  assert.match(text(), /Waiting for a parent/);
  assert.deepEqual(navigations, []);
});

test("a departed auth form cannot redirect after its profile read resolves", async () => {
  sessionAfterAuth = { ...student, role: null, first_name: null };
  await render(<ConnectScreen token={fixture} />); await credentials();
  let release!: () => void; holdMe = new Promise((r) => { release = r; });
  await submit(); await render(<WaitScreen />);
  release(); await settle();
  assert.match(text(), /Waiting for a parent/);
  assert.deepEqual(navigations, []);
});

test("a departed parent form cannot redirect after an invite rejection resolves", async () => {
  me = parent; homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [] } };
  await render(<HomeScreen />); await input("child-gmail", "child@gmail.com");
  let release!: () => void; holdInvite = new Promise((r) => { release = r; }); inviteReply = { status: 401 };
  await submit();
  me = student; await render(<ConnectScreen token={fixture} />);
  release(); await settle();
  button("Accept this link");
  assert.deepEqual(navigations, []);
});

test("parent invite repeated form submissions send once while pending and clear only after success", async () => {
  me = parent;
  homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [] } };
  let release!: () => void; holdInvite = new Promise((r) => { release = r; });
  await render(<HomeScreen />); await input("child-gmail", "child@gmail.com");
  await submit(); await submit();
  assert.equal(button("Sending…").disabled, true);
  assert.equal(calls.filter((call) => call.url === "/api/invites").length, 1);
  assert.equal((document.getElementById("child-gmail") as HTMLInputElement).value, "child@gmail.com");
  release(); await settle();
  assert.equal((document.getElementById("child-gmail") as HTMLInputElement).value, "");
  assert.match(text(), /Connect email sent to child@gmail.com/);
  assert.equal(button("Send connect email").disabled, false);
});

test("parent blank and non-Gmail errors focus the described field without sending", async () => {
  me = parent;
  homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [] } };
  await render(<HomeScreen />);
  for (const [email, message] of [["", "Enter your child’s Gmail address."], ["child@example.test", "Enter a Gmail address ending in @gmail.com or @googlemail.com."]]) {
    await input("child-gmail", email); await submit();
    const field = document.getElementById("child-gmail");
    assert.equal(document.activeElement, field);
    assert.equal(field?.getAttribute("aria-invalid"), "true");
    assert.ok(field?.getAttribute("aria-describedby")?.split(" ").includes("child-gmail-error"));
    assert.equal(document.getElementById("child-gmail-error")?.textContent, message);
  }
  assert.equal(calls.filter((call) => call.url === "/api/invites").length, 0);
});

test("repeated connect sign-in submits authenticate once while the account read is pending", async () => {
  await render(<ConnectScreen token={fixture} />); await credentials();
  let release!: () => void; holdMe = new Promise((r) => { release = r; });
  await submit(); await submit();
  assert.equal(button("Signing in…").disabled, true);
  assert.equal(authCalls.length, 1);
  assert.equal(document.querySelector("form")?.getAttribute("aria-busy"), "true");
  release(); await settle();
  button("Accept this link"); assert.equal(accepts().length, 0);
});

test("signup without role requires reopening the link after choosing student and still needs explicit accept", async () => {
  sessionAfterAuth = { ...student, role: null, first_name: null }; signUpSession = true;
  await render(<ConnectScreen token={fixture} />); await credentials(true); await submit();
  assert.deepEqual(navigations, ["/role"]); assert.equal(accepts().length, 0);
  me = student; navigations.length = 0;
  await render(<WaitScreen />);
  assert.match(text(), /Waiting for a parent/); assert.equal(accepts().length, 0);
  await render(<ConnectScreen token={fixture} />);
  button("Accept this link"); assert.deepEqual(navigations, []); assert.equal(accepts().length, 0);
  await click("Accept this link");
  assert.deepEqual(navigations, ["/wait"]);
  assert.equal(accepts().length, 1); assert.equal(accepts()[0].init?.body, undefined);
  assert.ok(!calls.some((call) => call.url === "/api/profile"));
});

for (const needs_parent of [true, false]) {
  test(`parent household read that now identifies a student redirects with needs_parent=${needs_parent} before rendering private parent UI`, async () => {
    me = parent;
    homeReply = { status: 200, body: { role: "student", first_name: "Lin", needs_parent, children: [] } };
    await render(<HomeScreen />);
    assert.deepEqual(navigations, [needs_parent ? "/wait" : "/home"]);
    assert.equal(document.querySelector("form"), null);
    assert.doesNotMatch(text(), /Hello, Ada|Connect a child|No child is linked/);
  });
}

test("malformed child data fails the whole household read, focuses retry, and never paints a partial list", async () => {
  me = parent;
  homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [{ first_name: "Zoe" }, { email: privateValue }] } };
  await render(<HomeScreen />);
  assert.match(text(), /We could not open your home/);
  assert.equal(document.activeElement, button("Try again"));
  assert.equal(document.querySelector("form"), null);
  assert.doesNotMatch(text(), /Zoe|No child is linked/); assert.deepEqual(navigations, []);
});

test("malformed acceptance stays retryable without navigating or printing response details", async () => {
  me = student; acceptReply = { status: 200, body: { state: privateValue } };
  await render(<ConnectScreen token={fixture} />); await click("Accept this link");
  assert.match(text(), /This link could not be accepted. Try again./);
  button("Accept this link"); assert.deepEqual(navigations, []);
  assert.match(document.activeElement?.textContent ?? "", /This link could not be accepted/);
  acceptReply = { status: 200, body: { state: "accepted" } };
  await click("Accept this link"); assert.deepEqual(navigations, ["/wait"]);
});

test("malformed invite success remains a fixed failure and preserves the address for retry", async () => {
  me = parent;
  homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [] } };
  inviteReply = { status: 201, body: { invited_email: "https://example.test/private", token: fixture } };
  await render(<HomeScreen />); await input("child-gmail", "child@gmail.com"); await submit();
  assert.match(text(), /The connect email could not be sent. Try again./);
  assert.doesNotMatch(text(), /Connect email sent to|https:\/\//);
  assert.equal((document.getElementById("child-gmail") as HTMLInputElement).value, "child@gmail.com");
  assert.equal(button("Send connect email").disabled, false);
});

test("Strict Mode waiting effect restart releases its request lock and ignores the obsolete completion", async () => {
  let release!: () => void; holdHome = new Promise((r) => { release = r; });
  await render(<React.StrictMode><WaitScreen /></React.StrictMode>);
  assert.equal(calls.filter((call) => call.url === "/api/home").length, 2);
  release(); await settle();
  assert.match(text(), /Waiting for a parent/); assert.deepEqual(navigations, []);
  assert.equal(button("Check again").disabled, false);
  holdHome = null; await click("Check again");
  assert.match(text(), /Still waiting for a parent/);
});
