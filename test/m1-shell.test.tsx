import "./support/dom.ts";
import React, { act, type ReactNode } from "react";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beforeEach, mock, test } from "node:test";
import { createRoot, type Root } from "react-dom/client";
import type { Me } from "../src/domain/types.ts";
import { dom, navigations, setViewport, typeInto } from "./support/dom.ts";

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
    return new Response(JSON.stringify({
      role: meBody.role, first_name: meBody.first_name,
      needs_parent: meBody.role === "student" && !meBody.has_main_parent, children: [],
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

let root: Root | null = null;

function pageText(): string {
  return (document.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

function assertNoMascot(): void {
  const html = document.body.innerHTML;
  assert.doesNotMatch(html, /<img\b/i);
  assert.doesNotMatch(html, /<svg\b/i);
  assert.doesNotMatch(html, /owl|sprite/i);
}

function assertTagline(): void {
  assert.equal(document.querySelector(".wordmark")?.textContent, "Lumio");
  const tagline = (document.querySelector(".tagline")?.textContent ?? "").replace(/\s+/g, " ").trim();
  assert.equal(tagline, "Learn. Grow. Level Up.");
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
  setViewport(320);
});

test("the tagline is not hidden at 320px or 1280px, and reduced motion shows the wordmark", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\.tagline[^{]*\{[^}]*display\s*:\s*none/);
  assert.doesNotMatch(css, /\.wordmark[^{]*\{[^}]*display\s*:\s*none/);
  const desktop = css.slice(css.indexOf("@media (min-width: 1280px)"));
  assert.notEqual(desktop, "");
  assert.match(desktop, /\.wordmark/);
  assert.doesNotMatch(desktop, /\.tagline[^{]*\{[^}]*display\s*:\s*none/);
  assert.doesNotMatch(desktop, /\.wordmark[^{]*\{[^}]*display\s*:\s*none/);
  const reduced = css.slice(
    css.indexOf("@media (prefers-reduced-motion: reduce)"),
    css.indexOf("}", css.indexOf("@media (prefers-reduced-motion: reduce)")) + 1,
  );
  assert.match(reduced, /opacity:\s*1/);
  assert.match(reduced, /transition:\s*none/);
});

test("public landing and signed-in shell retain Lumio branding at both widths", async () => {
  const { Landing } = await import("../src/components/landing.tsx");
  const { Shell } = await import("../src/components/shell.tsx");
  for (const width of [320, 1280]) {
    setViewport(width); await render(<Landing />); assertTagline();
    assert.ok(document.querySelector('a[href="/login"]'));
    assert.ok(document.querySelector('a[href="/signup"]'));
    assert.equal(document.querySelector("form"), null);
    assert.match(document.querySelector("img")?.getAttribute("src") ?? "", /lumi-hero\.png/);
    await render(<Shell signedIn><p>Home</p></Shell>); assertTagline();
    assert.match(pageText(), /Sign out/);
  }
});

test("role and the parent home do not render an owl, and wait is not the dashboard", async () => {
  const { RoleScreen } = await import("../src/components/role-screen.tsx");
  const { WaitScreen } = await import("../src/components/wait-screen.tsx");
  const { HomeScreen } = await import("../src/components/home-screen.tsx");

  meStatus = 200;
  meBody = noRole;
  await render(<RoleScreen />);
  assert.match(pageText(), /Who is this account for/);
  assertNoMascot();

  meBody = student;
  await render(<WaitScreen />);
  assert.match(pageText(), /Waiting for a parent/);
  assert.match(pageText(), /You can use Lumio after a parent connects you/);
  assert.doesNotMatch(pageText(), /Continue learning|Study sections|No study time yet|Flashcards/);
  const waitImage = document.querySelector("img");
  assert.ok(waitImage);
  assert.match(waitImage.getAttribute("src") ?? "", /lumi-hero\.png/);
  assert.doesNotMatch(document.body.innerHTML, /sprite/i);

  meBody = parent;
  await render(<HomeScreen />);
  assert.match(pageText(), /No child is linked yet/);
  assertNoMascot();
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
  assert.doesNotMatch(pageText(), /\bteacher\b/i);
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
  assert.doesNotMatch(pageText(), /No child is linked yet|Connect a child/);
});

test("a signed-out visitor is not shown the waiting page", async () => {
  const { WaitScreen } = await import("../src/components/wait-screen.tsx");
  await render(<WaitScreen />);
  assert.deepEqual(navigations, ["/"]);
  assert.doesNotMatch(pageText(), /Waiting for a parent/);
  assert.doesNotMatch(pageText(), /You can use Lumio after a parent connects you/);
});

test("check again on /wait stays there and says the student is still waiting", async () => {
  meStatus = 200;
  meBody = student;
  const { WaitScreen } = await import("../src/components/wait-screen.tsx");
  await render(<WaitScreen />);
  assert.match(pageText(), /Waiting for a parent/);
  const form = document.querySelector("form");
  assert.ok(form);
  await act(async () => {
    form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.match(pageText(), /Still waiting for a parent\./);
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
  assert.match(pageText(), /Waiting for a parent/);
  meBody = { ...student, has_main_parent: true };
  const form = document.querySelector("form");
  assert.ok(form);
  await act(async () => {
    form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.equal(pathForAccount({ ...student, has_main_parent: true }), "/home");
  assert.deepEqual(navigations, ["/home"]);
  assert.doesNotMatch(pageText(), /Continue learning|No study time yet/);
});

test("a linked student sees the home regions and not the parent form", async () => {
  meStatus = 200;
  meBody = { ...student, has_main_parent: true };
  const { HomeScreen } = await import("../src/components/home-screen.tsx");
  const { pathForAccount } = await import("../src/lib/lumio-client.ts");
  assert.equal(pathForAccount(meBody), "/home");
  for (const width of [320, 1280]) {
    setViewport(width);
    await render(<HomeScreen />);
    assert.match(pageText(), /Hello, Lin\./);
    assert.match(pageText(), /Hi, I'm Lumi\. Ready to discover something new\?/);
    assert.match(pageText(), /Your next guide is not on this page yet\./);
    assert.match(pageText(), /A guide is one course and one quarter\./);
    assert.match(pageText(), /No study time yet\./);
    assert.match(pageText(), /Geography 6/);
    assert.match(pageText(), /History 6/);
    assert.match(pageText(), /Language 6/);
    assert.match(pageText(), /Mathematics 6/);
    assert.match(pageText(), /Quarter 1/);
    assert.match(pageText(), /Quarter 2/);
    assert.match(pageText(), /Flashcards/);
    assert.match(pageText(), /Concepts/);
    assert.match(pageText(), /Step-by-Step Solver/);
    assert.match(pageText(), /Tutor/);
    assert.match(pageText(), /Cheat Sheet/);
    assert.match(pageText(), /Practice Sets/);
    assert.match(pageText(), /Learn\. Grow\. Level Up\./);
    assert.doesNotMatch(pageText(), /Connect a child|No child is linked yet|lin@example\.com/);
    assert.doesNotMatch(pageText(), /\bXP\b|streak|leaderboard|Upgrade|friends/i);
    assert.equal(document.querySelector(".section-list a, .guide-list a, .student-continue a, .student-today a"), null);
    assert.equal(document.querySelector("[role='progressbar']"), null);
    const anchors = [...document.querySelectorAll("a")];
    assert.ok(anchors.length >= 1);
    for (const anchor of anchors) {
      assert.equal(anchor.textContent?.replace(/\s+/g, " ").trim(), "Home");
      assert.equal(anchor.getAttribute("href"), "/home");
      assert.equal(anchor.getAttribute("aria-current"), "page");
    }
    const img = document.querySelector(".lumi-frame img");
    assert.ok(img);
    assert.match(img.getAttribute("src") ?? "", /lumio_mascot\.png/);
    assert.equal(
      img.getAttribute("alt"),
      "Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello.",
    );
    const frame = document.querySelector(".lumi-frame");
    assert.ok(frame);
    assert.equal(getComputedStyle(frame).height, width === 1280 ? "220px" : "112px");
    const hello = document.querySelector(".student-hello");
    assert.ok(hello);
    assert.equal(getComputedStyle(hello).fontSize, width === 1280 ? "44px" : "36px");
    assert.equal(
      getComputedStyle(document.querySelector(".student-top")).display,
      width === 1280 ? "none" : "flex",
    );
    assert.equal(
      getComputedStyle(document.querySelector(".student-bottom")).display,
      width === 1280 ? "none" : "flex",
    );
    assert.equal(
      getComputedStyle(document.querySelector(".rail-sign-out")).display,
      width === 1280 ? "flex" : "none",
    );
    assert.equal(
      fetches.some((call) => call.url.includes("/api/home") || call.url.includes("/api/invites")),
      false,
    );
  }
});

test("a parent with no child sees no child list, and a connect send shows one line", async () => {
  meStatus = 200;
  meBody = parent;
  const { HomeScreen } = await import("../src/components/home-screen.tsx");
  await render(<HomeScreen />);
  const text = pageText();
  assert.match(text, /No child is linked yet\./);
  assert.match(text, /Connect a child/);
  assert.match(text, /Send connect email/);
  assert.equal(document.querySelector("ul, ol, table"), null);
  assert.doesNotMatch(text, /official_cards|study_sets|@example\.com/);
  const before = fetches.length;
  await typeInto(document.getElementById("child-gmail") as HTMLInputElement, "child@gmail.com");
  const form = document.querySelector("form");
  assert.ok(form);
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
  assert.doesNotMatch(pageText(), /raw-token-should-not-render|expires_at|https?:\/\//i);
  assert.doesNotMatch(pageText(), /00000000-0000-4000-8000-0000000000d1/);
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
  assert.doesNotMatch(pageText(), /raw-token-should-not-render|https?:\/\//i);
});

test("sign out returns to the dedicated login route", async () => {
  const { Shell } = await import("../src/components/shell.tsx");
  await render(
    <Shell signedIn>
      <h1>Home</h1>
    </Shell>,
  );
  const button = [...document.querySelectorAll("button")].find((item) => item.textContent === "Sign out");
  assert.ok(button);
  await act(async () => {
    button.dispatchEvent(new dom.MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.equal(fetches.some((call) => call.url.endsWith("/api/sign-out") && call.method === "POST"), true);
  // Shared server sign-out is authoritative; no browser SDK sign-out remains.
  assert.deepEqual(navigations, ["/login"]);
});
