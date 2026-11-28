import "./support/dom.ts";
import React, { act, type ReactNode } from "react";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import { createRoot, type Root } from "react-dom/client";
import type { Me, OfficialCard } from "../src/domain/types.ts";
import type { HomeCard, HomeChild } from "../src/lib/m2-client.ts";
import { dom, navigations, setViewport, typeInto } from "./support/dom.ts";
import { courseRuns, guideText, officialCards, runCourses } from "./support/cards.ts";
import { assertArt, assertCalm, assertNoFocusStops, assertPage, guideTexts, normalize } from "./support/ui.ts";

const fixture = "synthetic-connect-fixture";
const privateValue = "private-response-fixture";
const student: Me = { id: "student-fixture", role: "student", first_name: "Lin", email: "lin@gmail.com", has_main_parent: false };
const linkedStudent: Me = { ...student, has_main_parent: true };
const parent: Me = { ...student, id: "parent-fixture", role: "parent", first_name: "Ada" };
const preview = { parent_first_name: "Ada", invited_email: "lin@gmail.com", expires_at: "2026-11-01T09:00:00.000Z", state: "sent" };
// A child exactly as GET /api/home sends it (src/services/home.ts). email and
// study_sets are private to the client (Aria amendment) and must never render.
const child = (key: string, first_name: string, official_cards: OfficialCard[] = officialCards(`${privateValue}-${key}`)) =>
  ({ id: `${privateValue}-${key}`, first_name, email: `${privateValue}@gmail.com`, official_cards, study_sets: [privateValue] });
const linkedHome = (cards?: OfficialCard[]): Reply => ({ status: 200, body: {
  role: "student", first_name: "Lin", needs_parent: false, children: [child("lin", "Lin", cards)], study_sets_next_cursor: privateValue,
} });
const greeting = (name: string) => new RegExp(`(Hello|Good (morning|afternoon|evening)), ${name}`);
const ownText = () => normalize(document.body.textContent);
function noCardInternals(cards: OfficialCard[]) {
  const html = document.body.innerHTML;
  for (const card of cards) {
    assert.ok(!html.includes(card.id) && !html.includes(card.slug) && !html.includes(card.header), `card internals rendered: ${card.slug}`);
  }
  assert.doesNotMatch(ownText(), /\bofficial\b|School Year 2026/i);
}
let me: Me | null;
let sessionAfterAuth: Me | null;
let signUpSession: boolean;
let authError: { code?: string; message?: string } | null;
let emptyIdentities: boolean;
let throwAuth: boolean;
let oauthUrl: string | null;
const authCalls: { name: string; args: unknown }[] = [];
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
  if (url === "/api/auth/context") return new Response(JSON.stringify({ authenticated: !!me,
    next: me ? !me.role ? "/role" : me.role === "student" && !me.has_main_parent ? "/wait" : "/home" : null,
    onboarding: null, has_continuation: false, link: "none" }), { headers: { "X-CSRF-Token": "c".repeat(43) } });
  if (url === "/api/auth/intent") return Response.json({ status: "ready" });
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
let connectExpiry: typeof import("../src/lib/m2-client.ts").connectExpiry;
before(async () => {
  ({ ConnectScreen } = await import("../src/components/connect-screen.tsx"));
  ({ HomeScreen } = await import("../src/components/home-screen.tsx"));
  ({ WaitScreen } = await import("../src/components/wait-screen.tsx"));
  ({ getHome, getConnectPreview, connectExpiry } = await import("../src/lib/m2-client.ts"));
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
  await act(async () => { form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })); });
  await settle();
}
async function input(id: string, value: string) { await typeInto(document.getElementById(id) as HTMLInputElement, value); }
const accepts = () => calls.filter((c) => c.url.endsWith("/accept"));
function noLeaks() {
  assert.ok(!document.body.innerHTML.includes(fixture));
  assert.ok(!document.body.innerHTML.includes(privateValue));
  assert.ok(!document.title.includes(fixture));
  assert.ok(!JSON.stringify(authCalls).includes(fixture));
  assert.ok(navigations.every((path) => ["/", "/login", "/signup", "/role", "/wait", "/home"].includes(path)));
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
afterEach(async () => {
  try { noLeaks(); assertCalm(); assertArt(); }
  finally { if (root) await act(async () => root?.unmount()); root = null; }
});

test("preview loading has real chrome, skeleton, no auth or accept", async () => {
  let release!: () => void; holdPreview = new Promise((r) => { release = r; });
  await render(<ConnectScreen token={fixture} />);
  assert.ok(document.querySelector('.skeleton'));
  assert.equal(document.querySelector("main")?.getAttribute("aria-busy"), "true");
  assert.match(text(), /Learn\. Grow\. Level Up\./); assert.equal(document.querySelector("form"), null);
  release(); await settle(); assert.ok(document.querySelector('a[href="/login"]'));
  assert.match(ownText(), /Sign in with the invited email to see this invitation\. Nothing connects until you accept it\./);
  assert.equal(normalize(document.querySelector("h1")?.textContent), "Connect to a parent"); assertPage();
});

for (const [status, message] of [[404, "This connect link could not be found. Ask your parent to send a new one."], [410, "This link has expired."]] as const) {
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
  assert.equal(accepts().length, 0); assert.ok(document.querySelector('a[href="/login"]'));
});
test("expiry uses local date and time, and malformed expiry never renders raw data", async () => {
  assert.equal(connectExpiry(preview.expires_at), `This link lasts until ${new Date(preview.expires_at).toLocaleString()}. Links last 7 days.`);
  previewReply = { status: 200, body: { ...preview, expires_at: fixture } };
  await render(<ConnectScreen token={fixture} />);
  assert.match(text(), /This link has an end time, and the date could not be shown/);
});
// Dedicated auth validation, confirmation, errors and Google regressions now live
// in auth-recovery-ui.test.tsx; connect itself hands off through sealed intent.
for (const state of ["accepted", "ignored"]) {
  test(`signed-out ${state} preview offers login only and never accepts`, async () => {
    previewReply = { status: 200, body: { ...preview, state } };
    await render(<ConnectScreen token={fixture} />);
    assert.ok(document.querySelector('a[href="/login"]'));
    assert.equal(document.querySelector('a[href="/signup"]'), null);
    assert.equal(accepts().length, 0);
  });
}

test("existing role-less session goes to role and unlinked student stays for explicit accept", async () => {
  me = { ...student, role: null, first_name: null }; await render(<ConnectScreen token={fixture} />);
  assert.deepEqual(navigations, ["/role"]); navigations.length = 0;
  me = student; await render(<ConnectScreen token={fixture} />); button("Accept this link");
  assert.deepEqual(navigations, []); assert.equal(accepts().length, 0);
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
  assert.deepEqual(navigations, ["/login"]); assert.doesNotMatch(text(), /lin@gmail|Ada sent/);
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
test("parent home lists returned first names in order, including duplicates, each with their own guide cards, at both widths", async () => {
  me = parent;
  const zoe = officialCards(`${privateValue}-zoe`);
  const firstLin = officialCards(`${privateValue}-lin1`).slice(0, 3);
  homeReply = { status: 200, body: { role: "parent", first_name: "HomeName", needs_parent: false,
    children: [child("zoe", "Zoe", zoe), child("lin1", "Lin", firstLin), child("lin2", "Lin", [])] } };
  for (const width of [320, 1280]) {
    setViewport(width); await render(<HomeScreen />);
    assert.match(normalize(document.querySelector("h1")?.textContent), /^(Hello|Good (morning|afternoon|evening)), HomeName!$/);
    assert.match(ownText(), /Here's your family in Lumio\./); assert.match(ownText(), /Your children/);
    assert.deepEqual(Array.from(document.querySelectorAll(".linked-children .child-name")).map((name) => name.textContent), ["Zoe", "Lin", "Lin"]);
    const items = Array.from(document.querySelectorAll(".linked-children > li"));
    assert.equal(items.length, 3);
    assert.deepEqual(items.map((item) => guideTexts(item)), [zoe.map(guideText), firstLin.map(guideText), []]);
    assert.deepEqual(items.map((item) => item.querySelectorAll(".course-group").length), [courseRuns(zoe), courseRuns(firstLin), 0]);
    assert.match(normalize(items[2]?.textContent), /No guides are listed for Lin yet\./);
    for (const item of items) assert.match(normalize(item.textContent), /Connected/);
    assertNoFocusStops(".linked-children"); noCardInternals([...zoe, ...firstLin]);
    assert.doesNotMatch(ownText(), /No child is linked yet/); assertPage();
    button("Send connect email");
  }
});
test("parent home greets without a name when first_name is blank", async () => {
  me = parent; homeReply = { status: 200, body: { role: "parent", first_name: "  ", needs_parent: false, children: [] } };
  await render(<HomeScreen />);
  assert.match(normalize(document.querySelector("h1")?.textContent), /^(Hello|Good (morning|afternoon|evening))!$/);
});
test("empty parent list remains empty after invite success", async () => {
  me = parent; homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [] } };
  await render(<HomeScreen />); await input("child-gmail", "child@gmail.com"); await submit();
  assert.match(text(), /No child is linked yet/); assert.match(text(), /Connect email sent to child@gmail.com/);
  assert.ok(!document.querySelector(".linked-children"));
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
  // No details.field: the code alone puts the fixed sentence on the field, never the server's message.
  me = parent; homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [] } };
  inviteReply = { status: 400, body: { error: { code: "INVALID_EMAIL", message: fixture } } };
  await render(<HomeScreen />); await input("child-gmail", "child@gmail.com"); await submit();
  assert.equal(document.activeElement?.id, "child-gmail");
  assert.equal(normalize(document.getElementById("child-gmail-error")?.textContent),
    "Enter a Gmail address ending in @gmail.com or @googlemail.com.");
  assert.equal(normalize(document.querySelector(".invite .status")?.textContent), "");
});
test("parent invite 401 removes greeting, child list, and form before navigation", async () => {
  me = parent; homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [child("zoe", "Zoe")] } };
  inviteReply = { status: 401 };
  await render(<HomeScreen />); assert.match(text(), /Zoe/);
  await input("child-gmail", "child@gmail.com"); await submit();
  assert.deepEqual(navigations, ["/login"]); assert.doesNotMatch(text(), /Zoe|Connect a child|Geography 6/);
  assert.doesNotMatch(text(), greeting("Ada"));
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
    assert.equal(document.querySelector("form"), null); assert.doesNotMatch(text(), greeting("Ada"));
  });
}
test("linked student home reads me then home and shows children[0]'s 8 guide cards in API order, none a focus stop", async () => {
  me = linkedStudent; homeReply = linkedHome(); const cards = officialCards(`${privateValue}-lin`);
  await render(<HomeScreen />);
  assert.deepEqual(calls.map((c) => c.url).filter((url) => url === "/api/me" || url === "/api/home"), ["/api/me", "/api/home"]);
  assert.deepEqual(guideTexts(), cards.map(guideText));
  assert.deepEqual(guideTexts()[0], "Geography 6, Quarter 1");
  assert.equal(document.querySelectorAll(".course-group").length, 4);
  assert.deepEqual(Array.from(document.querySelectorAll(".course-group .course-name")).map((name) => name.textContent),
    ["Geography 6", "History 6", "Language 6", "Mathematics 6"]);
  assert.deepEqual(Array.from(document.querySelectorAll(".course-group")).map((group) => group.getAttribute("data-course")),
    ["geography_6", "history_6", "language_6", "mathematics_6"]);
  assert.equal(normalize(document.getElementById("guides-title")?.textContent), "Your guides");
  assertNoFocusStops(".course-groups"); noCardInternals(cards);
  assert.ok(Array.from(document.querySelectorAll("a")).every((a) => ["/home", "#main"].includes(a.getAttribute("href") ?? "")));
  assert.doesNotMatch(ownText(), /No guides here yet/);
});
const unordered = officialCards(`${privateValue}-x`);
const guideCases: [string, OfficialCard[]][] = [
  ["three cards out of rank order, regrouped only by consecutive course", [unordered[7]!, unordered[0]!, unordered[6]!]],
  ["one card whose course and labels the client has never seen",
    [{ ...officialCards(`${privateValue}-y`)[0]!, course: "science_6", course_label: "Science 6", quarter_label: "Term 1" }]],
];
for (const [name, cards] of guideCases) {
  test(`student guide cards show the API's own labels in the API's order for ${name}`, async () => {
    me = linkedStudent; homeReply = linkedHome(cards);
    await render(<HomeScreen />);
    assert.deepEqual(guideTexts(), cards.map(guideText));
    assert.equal(document.querySelectorAll(".course-group").length, courseRuns(cards));
    assert.deepEqual(Array.from(document.querySelectorAll(".course-group")).map((group) => group.getAttribute("data-course")), runCourses(cards));
    assertNoFocusStops(".course-groups"); noCardInternals(cards);
  });
}
test("a linked student with no guide cards sees a calm empty state, not a padded list", async () => {
  me = linkedStudent; homeReply = linkedHome([]);
  await render(<HomeScreen />);
  assert.equal(document.querySelectorAll(".guide-card").length, 0);
  assert.match(ownText(), /No guides here yet/); assert.match(ownText(), /Your guides will show up here when they're ready\./);
  const art = Array.from(document.querySelectorAll("img")).find((image) => /lumi-calm/.test(image.getAttribute("src") ?? ""));
  assert.equal(art?.getAttribute("alt"), "Lumi the owl standing calmly.");
});
for (const [name, body] of [
  ["needs_parent is true", { role: "student", first_name: "Lin", needs_parent: true, children: [] }],
  ["no child library is returned", { role: "student", first_name: "Lin", needs_parent: false, children: [] }],
  ["two child libraries are returned", { role: "student", first_name: "Lin", needs_parent: false, children: [child("a", "Lin"), child("b", "Lin")] }],
] as const) {
  test(`a student home read where ${name} keeps the /wait gate and paints no guides`, async () => {
    me = linkedStudent; homeReply = { status: 200, body };
    await render(<HomeScreen />);
    assert.deepEqual(navigations, ["/wait"]);
    assert.ok(!document.querySelector(".guide-card, .course-groups")); assert.doesNotMatch(ownText(), /Your guides/);
  });
}
for (const [status, code, next] of [[401, "UNAUTHENTICATED", "/"], [403, "ROLE_REQUIRED", "/role"]] as const) {
  test(`a student home read ${code} follows the existing redirect to ${next}`, async () => {
    me = linkedStudent; homeReply = { status, body: { error: { code, message: fixture } } };
    await render(<HomeScreen />);
    assert.deepEqual(navigations, [next]); assert.ok(!document.querySelector(".guide-card"));
  });
}
test("a failed student home read offers a focused Try again that repeats both reads", async () => {
  me = linkedStudent; homeReply = { status: 503 };
  await render(<HomeScreen />);
  assert.match(text(), /We could not open your home\. Try again\./);
  assert.ok(document.activeElement === button("Try again"), "Try again has focus"); assert.ok(!document.querySelector(".guide-card"));
  homeReply = linkedHome(); await click("Try again");
  assert.equal(calls.filter((c) => c.url === "/api/me").length, 2);
  assert.equal(calls.filter((c) => c.url === "/api/home").length, 2);
  assert.equal(document.querySelectorAll(".guide-card").length, 8); assert.deepEqual(navigations, []);
});
test("the student home shows the shell skeleton while guides load", async () => {
  let release!: () => void; holdHome = new Promise((r) => { release = r; });
  me = linkedStudent; homeReply = linkedHome();
  await render(<HomeScreen />);
  assert.ok(document.querySelector(".skeleton")); assert.equal(document.querySelector("main")?.getAttribute("aria-busy"), "true");
  assert.ok(!document.querySelector(".guide-card")); assert.match(text(), /Learn\. Grow\. Level Up\./);
  release(); await settle();
  assert.equal(document.querySelectorAll(".guide-card").length, 8);
  assert.notEqual(document.querySelector("main")?.getAttribute("aria-busy"), "true");
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
  // Accept has no adapter: ConnectScreen's accept tests cover accepted, ignored and malformed states.
  assert.deepEqual(await getConnectPreview(fixture), { ok: true, data: preview });
  homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [{ first_name: "Lin", email: privateValue, id: privateValue, official_cards: [] }] } };
  assert.deepEqual(await getHome(), { ok: true, data: { role: "parent", first_name: "Ada", needs_parent: false, children: [{ id: privateValue, first_name: "Lin", official_cards: [] }] } });
  homeReply = { status: 200, body: { children: [] } }; assert.equal((await getHome()).ok, false);
  previewReply = { status: 200, body: { state: "sent" } }; assert.equal((await getConnectPreview(fixture)).ok, false);
});

test("getHome keeps each child's id, first_name and official_cards in API order, dropping kind, email and study_sets", async () => {
  const cards = officialCards("adapter");
  const sent = [cards[5]!, cards[1]!, cards[3]!].map((card) => ({ ...card, extra: privateValue }));
  homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, study_sets_next_cursor: privateValue,
    children: [{ ...child("one", "Zoe", []), official_cards: sent }, child("two", "Lin", [])] } };
  const keep = ({ id, slug, course, course_label, quarter, quarter_label, header }: OfficialCard): HomeCard =>
    ({ id, slug, course, course_label, quarter, quarter_label, header });
  const children: HomeChild[] = [
    { id: `${privateValue}-one`, first_name: "Zoe", official_cards: [cards[5]!, cards[1]!, cards[3]!].map(keep) },
    { id: `${privateValue}-two`, first_name: "Lin", official_cards: [] },
  ];
  assert.deepEqual(await getHome(), { ok: true, data: { role: "parent", first_name: "Ada", needs_parent: false, children } });
});

const goodChild = () => ({ id: "child-good", first_name: "Lin", official_cards: officialCards("valid").slice(0, 2) });
const malformedChildren: [string, (value: ReturnType<typeof goodChild>) => unknown][] = [
  ["a child without an id", ({ id: _id, ...rest }) => rest],
  ["a child without first_name", ({ first_name: _name, ...rest }) => rest],
  ["official_cards that is not an array", (value) => ({ ...value, official_cards: { length: 0 } })],
  ["a card that is not an object", (value) => ({ ...value, official_cards: [privateValue] })],
  ["a card with quarter 3", (value) => ({ ...value, official_cards: [{ ...value.official_cards[0]!, quarter: 3 }] })],
  ["a card with quarter \"1\" as text", (value) => ({ ...value, official_cards: [{ ...value.official_cards[0]!, quarter: "1" }] })],
  ...(["id", "slug", "course", "course_label", "quarter_label", "header"] as const).map((field): [string, (value: ReturnType<typeof goodChild>) => unknown] =>
    [`a card whose ${field} is not a string`, (value) => ({ ...value, official_cards: [{ ...value.official_cards[0]!, [field]: 42 }] })]),
];
for (const [name, mutate] of malformedChildren) {
  test(`getHome rejects the whole household read for ${name}`, async () => {
    homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [goodChild(), mutate(goodChild())] } };
    assert.equal((await getHome()).ok, false);
  });
}

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

// Duplicate/stale auth submissions are covered on the shared AuthScreen. The
// connect handoff regressions below ensure continuation, not manual reopening.

for (const needs_parent of [true, false]) {
  test(`parent household read that now identifies a student redirects with needs_parent=${needs_parent} before rendering private parent UI`, async () => {
    me = parent;
    homeReply = { status: 200, body: { role: "student", first_name: "Lin", needs_parent, children: [] } };
    await render(<HomeScreen />);
    assert.deepEqual(navigations, [needs_parent ? "/wait" : "/home"]);
    assert.equal(document.querySelector("form"), null);
    assert.doesNotMatch(text(), /Connect a child|No child is linked/); assert.doesNotMatch(text(), greeting("Ada"));
  });
}

test("malformed child data fails the whole household read, focuses retry, and never paints a partial list", async () => {
  me = parent;
  homeReply = { status: 200, body: { role: "parent", first_name: "Ada", needs_parent: false, children: [child("zoe", "Zoe"), { email: privateValue }] } };
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
