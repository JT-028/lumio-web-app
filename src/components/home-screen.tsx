"use client";

import { useEffect, useRef, useState } from "react";
import { childGmailError } from "@/lib/form-checks";
import { AuthFailure, authPost } from "@/lib/auth-client";
import { AccountGate } from "@/components/account-gate";
import { Lines, Shell } from "@/components/shell";
import { StudentHome } from "@/components/student-home";
import { getHome, homeRedirect, type HouseholdHome } from "@/lib/m2-client";

export function HomeScreen() {
  return (
    <AccountGate page="home">
      {(me) =>
        me.role === "student" ? (
          me.has_main_parent && me.first_name?.trim() ? (
            <StudentHome firstName={me.first_name} />
          ) : null
        ) : (
          <ParentHome />
        )
      }
    </AccountGate>
  );
}

function ParentHome() {
  const [home, setHome] = useState<HouseholdHome | null>(null);
  const [phase, setPhase] = useState<"loading" | "error" | "ready" | "redirecting">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setPhase("loading"); setHome(null);
    void (async () => {
      const result = await getHome();
      if (cancelled) return;
      const next = homeRedirect(result);
      if (next) { setPhase("redirecting"); window.location.replace(next); return; }
      if (!result.ok) { setPhase("error"); return; }
      if (result.data.role !== "parent") {
        setPhase("redirecting");
        window.location.replace(result.data.needs_parent ? "/wait" : "/home"); return;
      }
      setHome(result.data); setPhase("ready");
    })();
    return () => { cancelled = true; };
  }, [attempt]);
  if (phase === "ready" && home) return <HomeForm home={home} />;
  return <Shell signedIn busy={phase !== "error"}>
    {phase === "error" ? <div className="stack">
      <p className="status is-error" aria-live="polite">We could not open your home. Try again.</p>
      <button type="button" className="button-primary" autoFocus onClick={() => setAttempt((v) => v + 1)}>Try again</button>
    </div> : <><p className="visually-hidden">Loading</p><Lines count={4} /></>}
  </Shell>;
}

function HomeForm({ home }: { home: HouseholdHome }) {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const sendLock = useRef(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);
  const [focus, setFocus] = useState({ id: "", n: 0 });
  const greeting =
    home.first_name.trim() ? `Hello, ${home.first_name.trim()}.` : "Hello.";

  useEffect(() => {
    if (!focus.id) {
      return;
    }
    document.getElementById(focus.id)?.focus();
  }, [focus]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendLock.current) return;
    const current = generation.current;
    const problem = childGmailError(email);
    if (problem) {
      setFieldError(problem);
      setStatus("");
      setFocus((current) => ({ id: "child-gmail", n: current.n + 1 }));
      return;
    }
    setFieldError("");
    setStatus("");
    setSending(true);
    sendLock.current = true;
    let result: { ok: true; invited_email: string } | { ok: false; status: number; message: string; field: string | null };
    try {
      const body = await authPost("/api/invites", { invited_email: email.trim() });
      if (typeof body.invited_email !== "string" || !body.invited_email.trim() || body.invited_email.includes("://") || /\s/.test(body.invited_email)) throw new AuthFailure("INTERNAL");
      result = { ok: true, invited_email: body.invited_email };
    } catch (error) {
      const code = error instanceof AuthFailure ? error.code : "";
      const messages: Record<string, string> = {
        INVALID_EMAIL: "Enter a Gmail address ending in @gmail.com or @googlemail.com.",
        ROLE_FORBIDDEN: "Only a parent can send a connect email.",
        RATE_LIMITED: "You have sent too many connect emails this hour. Wait and try again.",
        EMAIL_FAILED: "The connect email could not be sent. Nothing was saved. Try again.",
        EMAIL_NOT_CONFIGURED: "Connect email is not set up yet. Nothing was sent, and no link is shown.",
      };
      result = { ok: false, status: error instanceof AuthFailure ? error.status : 0, message: messages[code] ?? "The connect email could not be sent. Try again.", field: code === "INVALID_EMAIL" ? "invited_email" : null };
    } finally {
      if (current === generation.current) { sendLock.current = false; setSending(false); }
    }
    if (current !== generation.current) return;
    if (!result.ok) {
      if (result.status === 401) {
        setEmail("");
        setStatus("");
        setLeaving(true);
        window.location.replace("/login");
        return;
      }
      setSending(false);
      sendLock.current = false;
      if (result.field === "invited_email") {
        setFieldError(result.message);
        setFocus((current) => ({ id: "child-gmail", n: current.n + 1 }));
        return;
      }
      setStatus(result.message);
      return;
    }
    setSending(false);
    sendLock.current = false;
    setEmail("");
    setStatus(`Connect email sent to ${result.invited_email}.`);
  }

  if (leaving) return <Shell signedIn busy><Lines count={4} /></Shell>;
  return (
    <Shell signedIn>
      <div className="stack">
        <h1 className="page-title display-text">Home</h1>
        <p className="greeting">{greeting}</p>
        {home.children.length === 0 ? <p className="body-copy">No child is linked yet.</p> :
          <section aria-labelledby="linked-children-title">
            <h2 id="linked-children-title" className="form-legend display-text">Linked children</h2>
            <ul className="linked-children">{home.children.map((child, index) => <li key={index}>{child.first_name}</li>)}</ul>
          </section>}
        <form className="stack" method="post" noValidate aria-busy={sending} onSubmit={(event) => void onSubmit(event)}>
          <fieldset className="stack">
            <legend className="form-legend display-text">Connect a child</legend>
            <div className="field">
              <label className="label" htmlFor="child-gmail">
                Child{"\u2019"}s Gmail
              </label>
              <input
                id="child-gmail"
                type="email"
                autoComplete="username"
                placeholder="name@gmail.com"
                value={email}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={
                  fieldError ? "child-gmail-help child-gmail-error" : "child-gmail-help"
                }
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldError("");
                }}
              />
              <p id="child-gmail-help" className="helper">
                We send one link to that Gmail. It lasts 7 days. Your child still cannot study
                until they accept.
              </p>
              <p id="child-gmail-error" className="field-error">
                {fieldError}
              </p>
            </div>
            <button type="submit" className="button-primary" disabled={sending}>
              {sending ? "Sending\u2026" : "Send connect email"}
            </button>
            <p className="status" aria-live="polite">
              {status}
            </p>
          </fieldset>
        </form>
      </div>
    </Shell>
  );
}
