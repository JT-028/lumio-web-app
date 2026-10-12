import "./support/dom.ts";
import React, { act, type ReactNode } from "react";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beforeEach, mock, test } from "node:test";
import { createRoot, type Root } from "react-dom/client";
import type { Me } from "../src/domain/types.ts";
import { dom, navigations, setViewport, typeInto } from "./support/dom.ts";

type AuthCall = { name: string; args: Record<string, unknown> };

const authCalls: AuthCall[] = [];

mock.module("@/lib/supabase/browser", {
  exports: {
    browserSupabase() {
      return {
        auth: {
          async signInWithPassword(args: Record<string, unknown>) {
            authCalls.push({ name: "signInWithPassword", args });
            return {
              data: { user: null, session: null },
              error: { code: "invalid_credentials", message: "Invalid login credentials" },
            };
          },
          async signUp(args: Record<string, unknown>) {
            authCalls.push({ name: "signUp", args });
            return { data: { user: { identities: [{}] }, session: null }, error: null };
          },
          async signInWithOAuth(args: Record<string, unknown>) {
            authCalls.push({ name: "signInWithOAuth", args });
            return { data: { url: "https://accounts.google.com/o/oauth2/mock" }, error: null };
          },
          async signOut() {
            authCalls.push({ name: "signOut", args: {} });
            return { error: null };
          },
        },
      };
    },
  },
});

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
let meStatus = 401;
let meBody: Me | null = null;

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = init?.method ?? "GET";
  fetches.push({ url, method });
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
  if (url.includes("/api/invites")) {
    return new Response("POST /api/invites is not part of this milestone", { status: 500 });
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
  authCalls.length = 0;
  fetches.length = 0;
  meStatus = 401;
  meBody = null;
  document.documentElement.classList.remove("fonts-ready");
  setViewport(320);
});

test("the tagline is not hidden at 320px or 1280px, and reduced motion shows the wordmark", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\.tagline[^{]*\{[^}]*display\s*:\s*none/);
  assert.doesNotMatch(css, /\.wordmark[^{]*\{[^}]*display\s*:\s*none/);
  assert.doesNotMatch(css, /@media[^{]*max-width[^}]*\}/);
  const desktop = css.slice(css.indexOf("@media (min-width: 1280px)"));
  assert.notEqual(desktop, "");
  assert.match(desktop, /\.wordmark/);
  assert.doesNotMatch(desktop, /\.tagline[^{]*\{[^}]*display\s*:\s*none/);
  assert.doesNotMatch(desktop, /\.wordmark[^{]*\{[^}]*display\s*:\s*none/);
  const reduced = css.slice(
    css.indexOf("@media (prefers-reduced-motion: reduce)"),
    css.indexOf(".wordmark"),
  );
  assert.match(reduced, /opacity:\s*1/);
  assert.match(reduced, /transition:\s*none/);
});

test("the signed-out page and the signed-in shell show Lumio and the tagline at both widths", async () => {
  const { Landing } = await import("../src/components/landing.tsx");
  const { Shell } = await import("../src/components/shell.tsx");
  for (const width of [320, 1280]) {
    setViewport(width);
    await render(<Landing />);
    assertTagline();
    assert.match(pageText(), /Continue with Google/);
    const tagline = document.querySelector(".tagline");
    assert.ok(tagline);
    assert.notEqual(getComputedStyle(tagline).display, "none");
    assert.notEqual(getComputedStyle(tagline).visibility, "hidden");

    await render(
      <Shell signedIn>
        <p>Home</p>
      </Shell>,
    );
    assertTagline();
    assert.match(pageText(), /Sign out/);
    assert.ok(document.documentElement.classList.contains("fonts-ready"));
    const wordmark = document.querySelector(".wordmark");
    assert.ok(wordmark);
    assert.equal(getComputedStyle(wordmark).opacity, "1");
  }
});

test("M1 pages do not render an owl image or a sprite frame", async () => {
  const { Landing } = await import("../src/components/landing.tsx");
  const { RoleScreen } = await import("../src/components/role-screen.tsx");
  const { WaitScreen } = await import("../src/components/wait-screen.tsx");
  const { HomeScreen } = await import("../src/components/home-screen.tsx");

  await render(<Landing />);
  assertNoMascot();

  meStatus = 200;
  meBody = noRole;
  await render(<RoleScreen />);
  assert.match(pageText(), /Who is this account for/);
  assertNoMascot();

  meBody = student;
  await render(<WaitScreen />);
  assert.match(pageText(), /Waiting for a parent/);
  assertNoMascot();

  meBody = parent;
  await render(<HomeScreen />);
  assert.match(pageText(), /No child is linked yet/);
  assertNoMascot();
});

test("email sign-in goes through the Supabase browser client and a wrong password is refused", async () => {
  const { Landing } = await import("../src/components/landing.tsx");
  await render(<Landing />);
  await typeInto(document.getElementById("email") as HTMLInputElement, "ada@example.com");
  await typeInto(document.getElementById("password") as HTMLInputElement, "wrong-password");
  const form = document.querySelector("form");
  assert.ok(form);
  await act(async () => {
    form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.equal(authCalls.length, 1);
  assert.equal(authCalls[0]?.name, "signInWithPassword");
  assert.deepEqual(authCalls[0]?.args, { email: "ada@example.com", password: "wrong-password" });
  assert.match(pageText(), /That email and password do not match\. Try again\./);
  assert.equal((document.getElementById("password") as HTMLInputElement).value, "");
  assert.equal((document.getElementById("email") as HTMLInputElement).value, "ada@example.com");
  assert.deepEqual(navigations, []);
});

test("email sign-up goes through the Supabase browser client and stays on the page", async () => {
  const { Landing } = await import("../src/components/landing.tsx");
  await render(<Landing />);
  const create = [...document.querySelectorAll("button")].find(
    (button) => button.textContent === "Create account" && button.getAttribute("aria-pressed") !== null,
  );
  assert.ok(create);
  await act(async () => {
    create.dispatchEvent(new dom.MouseEvent("click", { bubbles: true }));
  });
  await typeInto(document.getElementById("email") as HTMLInputElement, "ada@example.com");
  await typeInto(document.getElementById("password") as HTMLInputElement, "correct-horse");
  await typeInto(document.getElementById("confirm") as HTMLInputElement, "correct-horse");
  const form = document.querySelector("form");
  assert.ok(form);
  await act(async () => {
    form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.equal(authCalls.filter((call) => call.name === "signInWithPassword").length, 0);
  assert.equal(authCalls.length, 1);
  assert.equal(authCalls[0]?.name, "signUp");
  assert.equal(authCalls[0]?.args.email, "ada@example.com");
  assert.equal(authCalls[0]?.args.password, "correct-horse");
  const options = authCalls[0]?.args.options as { emailRedirectTo?: string };
  assert.equal(options.emailRedirectTo, "http://localhost:3010/auth/callback");
  assert.match(pageText(), /Check your email to confirm this address/);
  assert.deepEqual(navigations, []);
});

test("passwords that differ do not call the Supabase client", async () => {
  const { Landing } = await import("../src/components/landing.tsx");
  await render(<Landing />);
  const create = [...document.querySelectorAll("button")].find(
    (button) => button.textContent === "Create account" && button.getAttribute("aria-pressed") !== null,
  );
  assert.ok(create);
  await act(async () => {
    create.dispatchEvent(new dom.MouseEvent("click", { bubbles: true }));
  });
  await typeInto(document.getElementById("email") as HTMLInputElement, "ada@example.com");
  await typeInto(document.getElementById("password") as HTMLInputElement, "one-password");
  await typeInto(document.getElementById("confirm") as HTMLInputElement, "other-password");
  const form = document.querySelector("form");
  assert.ok(form);
  await act(async () => {
    form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  assert.deepEqual(authCalls, []);
  assert.match(pageText(), /Those passwords do not match\./);
});

test("Google sign-in calls signInWithOAuth and does not leave for Google", async () => {
  const { Landing } = await import("../src/components/landing.tsx");
  await render(<Landing />);
  const google = [...document.querySelectorAll("button")].find(
    (button) => button.textContent === "Continue with Google",
  );
  assert.ok(google);
  await act(async () => {
    google.dispatchEvent(new dom.MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.equal(authCalls.length, 1);
  assert.equal(authCalls[0]?.name, "signInWithOAuth");
  assert.equal(authCalls[0]?.args.provider, "google");
  const options = authCalls[0]?.args.options as { redirectTo?: string };
  assert.equal(options.redirectTo, "http://localhost:3010/auth/callback");
  assert.equal(
    fetches.some((call) => call.url.includes("google") || call.url.includes("supabase")),
    false,
  );
  assert.equal(
    navigations.some((url) => url.includes("google")),
    false,
  );
});

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
    fetches.some((call) => call.url.includes("/api/invites")),
    false,
  );
});

test("a parent with no child sees no child list, and the connect form does not send email", async () => {
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
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const status = form.querySelector(".status")?.textContent ?? "";
  assert.match(status, /Nothing was sent\./);
  assert.doesNotMatch(status, /email was sent|Connect email sent/i);
  assert.equal(
    fetches.slice(before).some((call) => call.url.includes("/api/invites")),
    false,
  );
  assert.equal(fetches.slice(before).length, 0);
});

test("sign out returns to /", async () => {
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
  assert.equal(authCalls.some((call) => call.name === "signOut"), true);
  assert.deepEqual(navigations, ["/"]);
});
