import "./support/dom.ts";
import React, { act, type ReactNode } from "react";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, mock, test } from "node:test";
import { createRoot, type Root } from "react-dom/client";
import type { Me } from "../src/domain/types.ts";
import { dom, navigations, setViewport, typeInto } from "./support/dom.ts";
import { officialCards } from "./support/cards.ts";
import {
  assertArt, assertCalm, assertPage, assertSkipLink, guideTexts, isShown, normalize, pageText as text,
} from "./support/ui.ts";

// Auth regressions migrated to auth-recovery-ui.test.tsx and real-handler tests.
mock.module("@/lib/supabase/browser", { exports: { browserSupabase() { throw new Error("browser auth retired"); } } });

dom.matchMedia = ((query: string) => ({
  matches: query.includes("prefers-reduced-motion"),
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {
    return false;
  },
})) as typeof dom.matchMedia;

const fetches: { url: string; method: string }[] = [];
const profilePosts: unknown[] = [];
const invitePosts: unknown[] = [];
let meStatus = 401;
let meBody: Me | null = null;
let profileBody: Me | null = null;
let inviteStatus = 201;
let inviteCode = "";

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = init?.method ?? "GET";
  fetches.push({ url, method });
  if (url === "/api/auth/context") return Response.json({ authenticated: meStatus === 200 && !!meBody,
    next: !meBody?.role ? "/role" : meBody.role === "student" && !meBody.has_main_parent ? "/wait" : "/home",
    onboarding: null, has_continuation: false, link: "none" }, { headers: { "X-CSRF-Token": "c".repeat(43) } });
  if (url.endsWith("/api/home")) {
    if (meStatus !== 200 || !meBody) return new Response(null, { status: 401 });
    if (!meBody.role) return new Response(JSON.stringify({ error: { code: "ROLE_REQUIRED" } }), { status: 403 });
    const linked = meBody.role === "student" && meBody.has_main_parent;
    return new Response(JSON.stringify({
      role: meBody.role, first_name: meBody.first_name,
      needs_parent: meBody.role === "student" && !meBody.has_main_parent,
      // src/services/home.ts: a linked student gets their own library as children[0].
      children: linked ? [{ id: meBody.id, first_name: meBody.first_name, email: meBody.email,
        official_cards: officialCards(meBody.id), study_sets: [] }] : [],
    }));
  }
  if (url.endsWith("/api/me")) {
    if (meStatus !== 200 || !meBody) {
      return new Response(
        JSON.stringify({
          error: { code: "UNAUTHENTICATED", message: "Sign in is required.", details: null },
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      );
    }
    return new Response(JSON.stringify(meBody), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  if (url.endsWith("/api/sign-out") && method === "POST") {
    return new Response(null, { status: 204 });
  }
  if (url.endsWith("/api/profile") && method === "POST") {
    profilePosts.push(init?.body ? JSON.parse(String(init.body)) : null);
    if (!profileBody) {
      return new Response(
        JSON.stringify({
          error: {
            code: "ROLE_ALREADY_SET",
            message: "A role is already set for this account.",
            details: null,
          },
        }),
        { status: 409, headers: { "content-type": "application/json" } },
      );
    }
    return new Response(JSON.stringify(profileBody), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  }
  if (url.endsWith("/api/invites") && method === "POST") {
    invitePosts.push(init?.body ? JSON.parse(String(init.body)) : null);
    if (inviteStatus === 201) {
      return new Response(
        JSON.stringify({
          id: "00000000-0000-4000-8000-0000000000d1",
          invited_email: "child@gmail.com",
          expires_at: "2026-10-20T00:00:00.000Z",
          state: "sent",
          token: "raw-token-should-not-render",
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({
        error: {
          code: inviteCode,
          message: "https://secret.example/connect/raw-token-should-not-render",
          details: null,
        },
      }),
      { status: inviteStatus, headers: { "content-type": "application/json" } },
    );
  }
  throw new Error(`unexpected fetch ${method} ${url}`);
}) as typeof fetch;

const parent: Me = {
  id: "00000000-0000-4000-8000-0000000000a1",
  role: "parent",
  first_name: "Ada",
  email: "ada@example.com",
  has_main_parent: false,
};

const student: Me = {
  id: "00000000-0000-4000-8000-0000000000b1",
  role: "student",
  first_name: "Lin",
  email: "lin@example.com",
  has_main_parent: false,
};

const noRole: Me = {
  id: "00000000-0000-4000-8000-0000000000c1",
  role: null,
  first_name: null,
  email: "new@example.com",
  has_main_parent: false,
};

const LANDING_ALT = "Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books.";
const STUDENT_ALT = "Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello.";

let root: Root | null = null;

function stylesheet(): string {
  return readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Every block (header through its matching brace) whose at-rule header starts with `header`. */
function cssBlocks(css: string, header: string): string[] {
  const blocks: string[] = [];
  for (let at = css.indexOf(header); at !== -1; at = css.indexOf(header, at + 1)) {
    const open = css.indexOf("{", at);
    if (open === -1 || css.slice(at + header.length, open).trim() !== "") continue;
    let close = open;
    for (let depth = 0; close < css.length; close += 1) {
      if (css[close] === "{") depth += 1;
      else if (css[close] === "}" && (depth -= 1) === 0) break;
    }
    blocks.push(css.slice(at, close + 1));
  }
  return blocks;
}

function assertTagline(): void {
  assert.equal(document.querySelector(".wordmark")?.textContent, "Lumio");
  assert.equal(normalize(document.querySelector(".tagline")?.textContent), "Learn. Grow. Level Up.");
}

function signOutButtons(): HTMLButtonElement[] {
  return [...document.querySelectorAll("button")].filter((button) => button.textContent === "Sign out");
}

function height(element: Element | null): string {
  assert.ok(element);
  const style = getComputedStyle(element);
  return style.height || style.getPropertyValue("block-size");
}

async function render(node: ReactNode): Promise<void> {
  root?.unmount();
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(node);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

beforeEach(() => {
  navigations.length = 0;
  fetches.length = 0;
  profilePosts.length = 0;
  invitePosts.length = 0;
  meStatus = 401;
  meBody = null;
  profileBody = null;
  inviteStatus = 201;
  inviteCode = "";
  document.documentElement.classList.remove("fonts-ready");
  document.title = "Lumio";
  setViewport(320);
});

// Every screen a test leaves behind is calm and uses only Lux's sized art.
afterEach(async () => {
  try {
    assertCalm();
    assertArt();
  } finally {
    await act(async () => root?.unmount());
    root = null;
    document.body.replaceChildren();
  }
});

test("the tagline and wordmark are never hidden, and reduced motion settles .fade-in first", () => {
  const css = stylesheet();
  assert.doesNotMatch(css, /\.tagline[^{]*\{[^}]*display\s*:\s*none/);
  assert.doesNotMatch(css, /\.wordmark[^{]*\{[^}]*display\s*:\s*none/);
  const desktop = cssBlocks(css, "@media (min-width: 1280px)");
  assert.ok(desktop.length > 0);
  assert.ok(desktop.some((block) => /\.wordmark/.test(block)));
  const reduced = cssBlocks(css, "@media (prefers-reduced-motion: reduce)")[0];
  assert.ok(reduced, "a prefers-reduced-motion: reduce block exists");
  const body = reduced.slice(reduced.indexOf("{") + 1);
  const firstRule = body.slice(0, body.indexOf("}") + 1).trim();
  assert.match(firstRule, /^\.fade-in\s*[{,]/);
  assert.match(firstRule, /opacity:\s*1/);
  assert.match(firstRule, /transition:\s*none/);
  assert.match(firstRule, /animation:\s*none/);
});

test("every colour is a named token in @layer tokens and no cream surface remains", () => {
  const css = stylesheet();
  const tokens = cssBlocks(css, "@layer tokens")[0];
  assert.ok(tokens, "colours live in @layer tokens");
  assert.match(tokens, /--color-page:\s*#EFF6FF/i);
  assert.match(tokens, /--color-text:\s*#172B4D/i);
  assert.match(tokens, /--color-primary:\s*#2B4FB8/i);
  assert.match(tokens, /--color-accent:\s*#EFB94E/i);
  assert.doesNotMatch(css, /#fff9ef/i);
  const values = [...css.replace(tokens, "").matchAll(/:\s*([^;{}]+)[;}]/g)].map((match) => match[1]!);
  const raw = values.filter((value) =>
    /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|\b(?:white|black)\b/i.test(value));
  assert.deepEqual(raw, []);
});

test("spatial motion is opt-in, colour transitions always run, and nothing loops", () => {
  const css = stylesheet();
  let outside = css;
  for (const block of cssBlocks(css, "@media (prefers-reduced-motion: no-preference)")) {
    outside = outside.replace(block, "");
  }
  const colour = new Set(["none", "color", "background", "background-color", "border", "border-color",
    "outline", "outline-color", "text-decoration-color", "fill", "stroke", "box-shadow"]);
  for (const [, list] of outside.matchAll(/(?:^|[;{\s])transition(?:-property)?\s*:\s*([^;}]+)/g)) {
    for (const item of list!.split(/,(?![^(]*\))/)) {
      assert.ok(colour.has(item.trim().split(/\s+/)[0]!), `motion outside no-preference: transition ${list}`);
    }
  }
  for (const [, value] of outside.matchAll(/(?:^|[;{\s])animation(?:-name)?\s*:\s*([^;}]+)/g)) {
    assert.equal(value!.trim(), "none", `animation outside no-preference: ${value}`);
  }
  assert.doesNotMatch(css, /\binfinite\b/);
  assert.doesNotMatch(css, /(?:animation|transition)-duration\s*:\s*0?\.01ms/);
});

test("public landing and signed-in shell retain Lumio branding at both widths", async () => {
  const { Landing } = await import("../src/components/landing.tsx");
  const { Shell } = await import("../src/components/shell.tsx");
  for (const width of [320, 1280]) {
    setViewport(width); await render(<Landing />); assertTagline(); assertPage();
    assert.ok(document.querySelector('a[href="/login"]'));
    assert.ok(document.querySelector('a[href="/signup"]'));
    assert.equal(document.querySelector("form"), null);
    const hero = document.querySelector("img");
    assert.match(hero?.getAttribute("src") ?? "", /lumi-hero/);
    assert.equal(hero?.getAttribute("alt"), LANDING_ALT);
    assert.match(text(), /Grade 6 starts with family\./);
    assert.match(text(), /Lumio is a calm study space for a Grade 6 student and their parent\./);
    await render(<Shell signedIn><p>Home</p></Shell>); assertTagline(); assertSkipLink();
    assert.ok(document.querySelector("main#main"));
    // The focus pages have no sidebar, so their top bar keeps the brand and Sign out on desktop.
    assert.ok([...document.querySelectorAll(".wordmark")].some(isShown));
    assert.equal(signOutButtons().filter(isShown).length, 1);
  }
});

test("role shows Lumi on each choice card, wait shows thinking Lumi, and the parent home shows welcome Lumi", async () => {
  const { RoleScreen } = await import("../src/components/role-screen.tsx");
  const { WaitScreen } = await import("../src/components/wait-screen.tsx");
  const { HomeScreen } = await import("../src/components/home-screen.tsx");

  meStatus = 200;
  meBody = noRole;
  await render(<RoleScreen />);
  assert.match(text(), /Who is this account for/);
  assertPage();
  for (const [role, pose] of [["parent", /lumi-welcome/], ["student", /lumi-wand/]] as const) {
    const card = document.querySelector(`label[for="role-${role}"]`);
    assert.ok(card);
    assert.ok(card.contains(document.getElementById(`role-${role}`)), `the ${role} card is the radio's label`);
    const art = card.querySelector("img");
    assert.match(art?.getAttribute("src") ?? "", pose);
    assert.equal(art?.getAttribute("alt"), "");
  }
  assert.equal(normalize(document.getElementById("parent-desc")?.textContent), "I'll connect my child's account.");
  assert.equal(normalize(document.getElementById("student-desc")?.textContent), "I'm the Grade 6 student.");
  assert.equal(normalize(document.getElementById("role-help")?.textContent), "You choose once. Lumio can't change this later.");
  assert.doesNotMatch(document.body.innerHTML, /sprite/i);

  meBody = student;
  await render(<WaitScreen />);
  assert.match(text(), /Waiting for a parent/);
  assert.match(text(), /You can use Lumio after a parent connects you/);
  assert.match(text(), /What happens next/);
  assert.match(text(), /Ask your parent to send a connect email to your Gmail\./);
  assert.match(text(), /Open that email and press Accept this link\./);
  assert.match(text(), /Come back here and press Check again\./);
  assert.doesNotMatch(text(), /Continue learning|Study sections|No study time yet|Flashcards|Your guides/);
  const waitImage = document.querySelector("img");
  assert.ok(waitImage);
  assert.match(waitImage.getAttribute("src") ?? "", /lumi-think/);
  assert.equal(waitImage.getAttribute("alt"), "Lumi the owl thinking, with a wing on his chin.");
  assert.doesNotMatch(document.body.innerHTML, /sprite/i);
  assert.ok(!document.querySelector('a[href="/home"]'));
  assert.ok(!document.querySelector("a .wordmark, a.wordmark"));
  assertPage();

  meBody = parent;
  await render(<HomeScreen />);
  assert.match(text(), /No child is linked yet/);
  const hero = document.querySelector(".hero-lumi img");
  assert.match(hero?.getAttribute("src") ?? "", /lumi-welcome/);
  assert.equal(hero?.getAttribute("alt"), "Lumi the owl with wings open in welcome.");
  const empty = [...document.querySelectorAll("img")].find((image) => /lumi-hello/.test(image.getAttribute("src") ?? ""));
  assert.equal(empty?.getAttribute("alt"), "Lumi the owl with wings open, saying hello.");
  assertPage();
});

// Password mismatch/errors, signup confirmation on/off, Google and working reset
// are verified against the dedicated routes in auth-recovery-ui.test.tsx.

test("the role form offers parent and student and never offers teacher", async () => {
  meStatus = 200;
  meBody = noRole;
  const { RoleScreen } = await import("../src/components/role-screen.tsx");
  await render(<RoleScreen />);
  const values = [...document.querySelectorAll('input[name="role"]')].map((input) =>
    input.getAttribute("value"),
  );
  assert.deepEqual(values, ["parent", "student"]);
  assert.doesNotMatch(text(), /\bteacher\b/i);
  assertTagline();
});

test("a student with no parent is sent to /wait from /home", async () => {
  meStatus = 200;
  meBody = student;
  const { HomeScreen } = await import("../src/components/home-screen.tsx");
  const { pathForAccount } = await import("../src/lib/lumio-client.ts");
  await render(<HomeScreen />);
  assert.deepEqual(navigations, ["/wait"]);
  assert.equal(pathForAccount(student), "/wait");
  assert.doesNotMatch(text(), /No child is linked yet|Connect a child|Your guides/);
});

test("a signed-out visitor is not shown the waiting page", async () => {
  const { WaitScreen } = await import("../src/components/wait-screen.tsx");
  await render(<WaitScreen />);
  assert.deepEqual(navigations, ["/"]);
  assert.doesNotMatch(text(), /Waiting for a parent/);
  assert.doesNotMatch(text(), /You can use Lumio after a parent connects you/);
});

test("check again on /wait stays there and says the student is still waiting", async () => {
  meStatus = 200;
  meBody = student;
  const { WaitScreen } = await import("../src/components/wait-screen.tsx");
  await render(<WaitScreen />);
  assert.match(text(), /Waiting for a parent/);
  const form = document.querySelector("form");
  assert.ok(form);
  await act(async () => {
    form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.match(text(), /Still waiting for a parent\./);
  assert.deepEqual(navigations, []);
  assert.equal(
    fetches.some((call) => call.url.includes("/api/invites") || call.url.includes("/api/me")),
    false,
  );
  assert.equal(fetches.filter((call) => call.url === "/api/home").length, 2);
});

test("check again leaves /wait when a parent is linked", async () => {
  meStatus = 200;
  meBody = { ...student };
  const { WaitScreen } = await import("../src/components/wait-screen.tsx");
  const { pathForAccount } = await import("../src/lib/lumio-client.ts");
  await render(<WaitScreen />);
  assert.match(text(), /Waiting for a parent/);
  meBody = { ...student, has_main_parent: true };
  const form = document.querySelector("form");
  assert.ok(form);
  await act(async () => {
    form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.equal(pathForAccount({ ...student, has_main_parent: true }), "/home");
  assert.deepEqual(navigations, ["/home"]);
  assert.doesNotMatch(text(), /Continue learning|No study time yet/);
});

test("a linked student home keeps the sidebar, top bar and hero contract at 320, 768 and 1280", async () => {
  meStatus = 200;
  meBody = { ...student, has_main_parent: true };
  const { HomeScreen } = await import("../src/components/home-screen.tsx");
  const { pathForAccount } = await import("../src/lib/lumio-client.ts");
  assert.equal(pathForAccount(meBody), "/home");
  for (const width of [320, 768, 1280]) {
    setViewport(width);
    fetches.length = 0;
    await render(<HomeScreen />);
    assertPage();
    const greeting = document.querySelector("h1");
    assert.ok(greeting);
    assert.ok(greeting.classList.contains("hero-greeting"), ".hero-greeting is the only h1");
    assert.match(normalize(greeting.textContent), /^(Hello|Good (morning|afternoon|evening)), Lin!$/);
    assert.match(text(), /Hi, I'm Lumi\. Ready to discover something new\?/);
    assert.match(text(), /Your guides/);
    assert.match(text(), /These are your guides for this school year\. You can't open them yet\. Lumi is getting them ready\./);
    assert.match(text(), /Inside each guide: Flashcards, Concepts, Step-by-Step Solver, Tutor, Cheat Sheet and Practice Sets\./);
    assert.match(text(), /Your family/);
    assert.match(text(), /You're connected to a parent\./);
    assert.match(text(), /Lumi's tip/);
    assert.match(text(), /Study a little at a time, then take a short break\./);
    assert.match(text(), /Learn\. Grow\. Level Up\./);
    assert.doesNotMatch(text(), /Continue learning|Your next guide is not on this page yet|A guide is one course and one quarter|Today's study|No study time yet|Study sections/);
    assert.doesNotMatch(text(), /Connect a child|No child is linked yet|lin@example\.com/);
    assert.equal(guideTexts().length, 8);
    // Navigation shows only real pages: the skip link and Home.
    const anchors = [...document.querySelectorAll("a")];
    assert.ok(anchors.some((anchor) => anchor.getAttribute("href") === "/home"));
    for (const anchor of anchors) {
      if (anchor.getAttribute("href") === "#main") {
        assert.equal(normalize(anchor.textContent), "Skip to main content");
        continue;
      }
      assert.equal(normalize(anchor.textContent), "Home");
      assert.equal(anchor.getAttribute("href"), "/home");
      assert.equal(anchor.getAttribute("aria-current"), "page");
    }
    for (const control of document.querySelectorAll("a, button")) assert.notEqual(normalize(control.textContent), "");
    assert.equal(document.querySelectorAll('nav[aria-label="Main"]').length, 1);
    const main = document.querySelector("main");
    assert.ok(main);
    for (const nav of document.querySelectorAll("nav")) {
      assert.ok(main.compareDocumentPosition(nav) & dom.Node.DOCUMENT_POSITION_PRECEDING, "no nav inside or after main");
    }
    const sidebar = document.querySelector(".sidebar");
    assert.ok(sidebar);
    assert.ok(sidebar.contains(document.querySelector('nav[aria-label="Main"]')));
    assert.match(normalize(sidebar.textContent), /Lin/);
    assert.match(normalize(sidebar.textContent), /Student/);
    // Layout contract (Iris §4, §9).
    const topbar = document.querySelector(".topbar");
    assert.ok(topbar);
    assert.equal(getComputedStyle(topbar).display, width < 1280 ? "flex" : "none");
    assert.equal(getComputedStyle(sidebar).display === "none", width < 768);
    assert.equal(isShown(document.querySelector(".sidebar-sign-out")), width >= 768);
    assert.equal(isShown(document.querySelector(".topbar-sign-out")), width < 768);
    assert.equal(signOutButtons().filter(isShown).length, 1);
    assert.ok([...document.querySelectorAll(".wordmark")].some(isShown));
    assert.ok([...document.querySelectorAll(".tagline")].some(isShown));
    assert.ok(!document.querySelector("a .wordmark, a.wordmark"));
    const lumi = document.querySelector(".hero-lumi img");
    assert.ok(lumi);
    assert.match(lumi.getAttribute("src") ?? "", /lumi-wave/);
    assert.equal(lumi.getAttribute("alt"), STUDENT_ALT);
    if (width !== 768) {
      assert.equal(height(document.querySelector(".hero-lumi")), width === 1280 ? "220px" : "112px");
      assert.equal(getComputedStyle(greeting).fontSize, width === 1280 ? "44px" : "32px");
    }
    assert.deepEqual(
      fetches.map((call) => call.url).filter((url) => url.endsWith("/api/me") || url.endsWith("/api/home")),
      ["/api/me", "/api/home"],
    );
    assert.equal(fetches.some((call) => call.url.includes("/api/invites")), false);
  }
});

test("the time-of-day greeting switches at 05:00, 12:00 and 18:00 local time", async () => {
  const { timeGreeting } = await import("../src/components/hero-card.tsx");
  for (const [hour, minute, expected] of [
    [0, 0, "Good evening"], [4, 59, "Good evening"], [5, 0, "Good morning"], [11, 59, "Good morning"],
    [12, 0, "Good afternoon"], [17, 59, "Good afternoon"], [18, 0, "Good evening"], [23, 59, "Good evening"],
  ] as const) {
    assert.equal(timeGreeting(new Date(2026, 10, 26, hour, minute)), expected, `${hour}:${minute}`);
  }
});

test("Sign out on the signed-in home posts once and returns to login", async () => {
  meStatus = 200;
  meBody = { ...student, has_main_parent: true };
  const { HomeScreen } = await import("../src/components/home-screen.tsx");
  setViewport(1280);
  await render(<HomeScreen />);
  const visible = signOutButtons().filter(isShown);
  assert.equal(visible.length, 1);
  assert.ok(visible[0]!.classList.contains("sidebar-sign-out"));
  await act(async () => {
    visible[0]!.dispatchEvent(new dom.MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.equal(fetches.filter((call) => call.url.endsWith("/api/sign-out") && call.method === "POST").length, 1);
  assert.deepEqual(navigations, ["/login"]);
});

test("a parent with no child sees no child list, and a connect send shows one line", async () => {
  meStatus = 200;
  meBody = parent;
  const { HomeScreen } = await import("../src/components/home-screen.tsx");
  await render(<HomeScreen />);
  const page = text();
  assert.match(page, /No child is linked yet\./);
  assert.match(page, /Let's connect your child's account\./);
  assert.match(page, /Connect a child/);
  assert.match(page, /Send connect email/);
  assert.match(page, /How Lumio works/);
  assert.ok(!document.querySelector(".linked-children"));
  assert.doesNotMatch(page, /official_cards|study_sets|@example\.com/);
  const jump = [...document.querySelectorAll("a")].find((anchor) => normalize(anchor.textContent) === "Connect your child");
  assert.equal(jump?.getAttribute("href"), "#invite-title");
  const inviteTitle = document.getElementById("invite-title");
  assert.equal(normalize(inviteTitle?.textContent), "Connect a child");
  assert.equal(inviteTitle?.getAttribute("tabindex"), "-1");
  const before = fetches.length;
  await typeInto(document.getElementById("child-gmail") as HTMLInputElement, "child@gmail.com");
  const form = document.querySelector("form");
  assert.ok(form);
  assert.equal(form.getAttribute("aria-labelledby"), "invite-title");
  await act(async () => {
    form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  const status = form.querySelector(".status")?.textContent ?? "";
  assert.equal(status, "Connect email sent to child@gmail.com.");
  assert.equal((document.getElementById("child-gmail") as HTMLInputElement).value, "");
  assert.deepEqual(invitePosts, [{ invited_email: "child@gmail.com" }]);
  assert.equal(
    fetches.slice(before).some((call) => call.url.endsWith("/api/invites") && call.method === "POST"),
    true,
  );
  assert.doesNotMatch(text(), /raw-token-should-not-render|expires_at|https?:\/\//i);
  assert.doesNotMatch(text(), /00000000-0000-4000-8000-0000000000d1/);
});

test("a connect failure does not show a link", async () => {
  meStatus = 200;
  meBody = parent;
  inviteStatus = 503;
  inviteCode = "EMAIL_NOT_CONFIGURED";
  const { HomeScreen } = await import("../src/components/home-screen.tsx");
  await render(<HomeScreen />);
  await typeInto(document.getElementById("child-gmail") as HTMLInputElement, "child@gmail.com");
  const form = document.querySelector("form");
  assert.ok(form);
  await act(async () => {
    form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  const status = form.querySelector(".status")?.textContent ?? "";
  assert.equal(status, "Connect email is not set up yet. Nothing was sent, and no link is shown.");
  assert.doesNotMatch(text(), /raw-token-should-not-render|https?:\/\//i);
});

test("sign out returns to the dedicated login route", async () => {
  const { Shell } = await import("../src/components/shell.tsx");
  await render(
    <Shell signedIn>
      <h1>Home</h1>
    </Shell>,
  );
  const button = signOutButtons()[0];
  assert.ok(button);
  await act(async () => {
    button.dispatchEvent(new dom.MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.equal(fetches.some((call) => call.url.endsWith("/api/sign-out") && call.method === "POST"), true);
  // Shared server sign-out is authoritative; no browser SDK sign-out remains.
  assert.deepEqual(navigations, ["/login"]);
});

test("/resting stays static, sleeps Lumi and offers a way back without sign-out or data calls", async () => {
  const module = await import("../src/app/resting/page.tsx");
  assert.equal(module.metadata.title, "Taking a short rest — Lumio");
  const source = readFileSync(new URL("../src/app/resting/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /["']use client["']|useEffect|useState|fetch\(|\/api\/|@\/lib\//);
  const Resting = module.default;
  await render(<Resting />);
  assert.equal(normalize(document.querySelector("h1")?.textContent), "Taking a short rest");
  assert.match(text(), /Lumio is taking a short rest\. Please try again in a moment\./);
  const back = document.querySelector('a[href="/home"]');
  assert.equal(normalize(back?.textContent), "Try again");
  const art = document.querySelector("img");
  assert.match(art?.getAttribute("src") ?? "", /lumi-sleep/);
  assert.equal(art?.getAttribute("alt"), "Lumi the owl taking a nap.");
  assertTagline();
  assert.ok(!document.querySelector("a .wordmark, a.wordmark"));
  assert.ok(!document.querySelector("button"));
  assert.ok(document.querySelector("main#main"));
  assert.equal(document.querySelectorAll("h1").length, 1);
  assert.deepEqual(fetches, []);
});

test("an unknown page shows a friendly not-found page with a way home and no code or path", async () => {
  const { default: NotFound } = await import("../src/app/not-found.tsx");
  window.history.replaceState(null, "", "/synthetic-missing-path");
  try {
    await render(<NotFound />);
  } finally {
    window.history.replaceState(null, "", "/");
  }
  assert.equal(normalize(document.querySelector("h1")?.textContent), "We can't find that page");
  assert.match(text(), /The link may be old or mistyped\./);
  const home = document.querySelector('a[href="/home"]');
  assert.equal(normalize(home?.textContent), "Go to home");
  const art = document.querySelector("img");
  assert.match(art?.getAttribute("src") ?? "", /lumi-question/);
  assert.equal(art?.getAttribute("alt"), "Lumi the owl looking puzzled, with a question mark.");
  assert.doesNotMatch(text(), /\b404\b|synthetic-missing-path|not_found|stack/i);
  assert.ok(document.querySelector("main#main"));
  assert.equal(document.querySelectorAll("h1").length, 1);
  assert.deepEqual(fetches, []);
});

test("a render error shows Try again and Home, focuses the heading and never prints the error", async () => {
  const { default: ErrorPage } = await import("../src/app/error.tsx");
  let resets = 0;
  const failure = Object.assign(new Error("synthetic-private-stack at secret.ts:1"), { digest: "synthetic-digest-42" });
  await render(<ErrorPage error={failure} reset={() => { resets += 1; }} />);
  const heading = document.querySelector("h1");
  assert.equal(normalize(heading?.textContent), "Something went wrong");
  assert.ok(document.activeElement === heading, "the h1 has focus");
  assert.equal(document.title, "Something went wrong — Lumio");
  assert.match(text(), /This page didn't load properly\. Please try again\./);
  assert.equal(normalize(document.querySelector('a[href="/home"]')?.textContent), "Go to home");
  const art = document.querySelector("img");
  assert.match(art?.getAttribute("src") ?? "", /lumi-calm/);
  assert.equal(art?.getAttribute("alt"), "Lumi the owl standing calmly.");
  assert.doesNotMatch(document.body.innerHTML, /synthetic|digest|secret\.ts|Error:/);
  const retry = [...document.querySelectorAll("button")].find((button) => normalize(button.textContent) === "Try again");
  assert.ok(retry);
  await act(async () => retry.click());
  assert.equal(resets, 1);
  assert.ok(document.querySelector("main#main"));
  assert.deepEqual(fetches, []);
});
