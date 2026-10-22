"use client";

import { useEffect, useRef, useState } from "react";
import type { Me } from "@/domain/types";
import { mapSignInError, mapSignUpError } from "@/lib/auth-errors";
import { emailError } from "@/lib/form-checks";
import { getMe } from "@/lib/lumio-client";
import { browserSupabase } from "@/lib/supabase/browser";

const OTHER = "Sign-in did not finish. Try again.";
const GOOGLE = "Google sign-in did not finish. Try again.";

export function ConnectAuth({ invitedEmail, allowCreate, onSession }: {
  invitedEmail: string;
  allowCreate: boolean;
  onSession: (me: Me) => void;
}) {
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "", confirm: "" });
  const [status, setStatus] = useState("");
  const [registered, setRegistered] = useState(false);
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);
  const [focus, setFocus] = useState({ id: "", n: 0 });
  useEffect(() => { document.getElementById(focus.id)?.focus(); }, [focus]);
  function moveFocus(id: string) { setFocus((v) => ({ id, n: v.n + 1 })); }
  function switchMode(next: "sign-in" | "create") {
    if (lock.current) return;
    setMode(next); setPassword(""); setConfirm("");
    setErrors({ email: "", password: "", confirm: "" }); setStatus(""); setRegistered(false);
  }
  function finish(message: string, field = "connect-auth-status") {
    lock.current = false; setPending(null); setStatus(message); moveFocus(field);
  }
  async function google() {
    if (lock.current) return;
    lock.current = true; setPending("google"); setStatus(""); setRegistered(false);
    try {
      const client = browserSupabase();
      if (!client) { finish(GOOGLE); return; }
      const { data, error } = await client.auth.signInWithOAuth({
        provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error || !data.url) finish(GOOGLE);
    } catch { finish(GOOGLE); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const current = generation.current;
    const next = {
      email: emailError(email) ?? "",
      password: password ? "" : "Enter your password.",
      confirm: mode !== "create" ? "" : !confirm ? "Confirm your password."
        : confirm !== password ? "Those passwords do not match." : "",
    };
    setErrors(next); setStatus(""); setRegistered(false);
    const field = next.email ? "email" : next.password ? "password" : next.confirm ? "confirm" : null;
    if (field) { moveFocus(`connect-${field}`); return; }
    lock.current = true; setPending("email");
    try {
      const client = browserSupabase();
      if (!client) { finish(OTHER); return; }
      if (mode === "create") {
        const { data, error } = await client.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (current !== generation.current) return;
        const kind = error ? mapSignUpError(error) : null;
        if (kind === "registered" || (data.user && data.user.identities?.length === 0)) {
          setRegistered(true); finish("", "connect-sign-in-instead"); return;
        }
        if (error) {
          finish(kind === "password" ? "That password was not accepted. Try a different one." : OTHER);
          return;
        }
        setPassword(""); setConfirm("");
        if (!data.session) {
          finish("Check your email to confirm this address. Then come back to this page and sign in.");
          return;
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (current !== generation.current) return;
        if (error) {
          const kind = mapSignInError(error);
          setPassword("");
          finish(kind === "mismatch" ? "That email and password do not match. Try again."
            : kind === "unconfirmed" ? "Confirm your email first, then sign in." : OTHER,
          kind === "mismatch" ? "connect-password" : "connect-auth-status");
          return;
        }
      }
      const result = await getMe();
      if (current !== generation.current) return;
      if (!result.ok) { finish(OTHER); return; }
      setPassword(""); setConfirm(""); onSession(result.me);
    } catch { if (current === generation.current) finish(OTHER); }
  }
  return (
    <div className="stack connect-auth" aria-busy={pending !== null}>
      <button className="login-google" type="button" disabled={pending !== null} onClick={() => void google()}>
        {pending === "google" ? "Waiting for Google…" : "Continue with Google"}
      </button>
      <p className="divider">or</p>
      <div className="login-modes" role="group" aria-label="Account action">
        <button className="login-mode" type="button" disabled={pending !== null} aria-pressed={mode === "sign-in"} onClick={() => switchMode("sign-in")}>Sign in</button>
        {allowCreate ? <button className="login-mode" type="button" disabled={pending !== null} aria-pressed={mode === "create"} onClick={() => switchMode("create")}>Create account</button> : null}
      </div>
      <form className="stack" method="post" noValidate aria-busy={pending !== null} onSubmit={(event) => void submit(event)}>
        <div className="field">
          <label className="label" htmlFor="connect-email">Email</label>
          <input id="connect-email" type="email" autoComplete="username" value={email} disabled={pending !== null}
            aria-invalid={!!errors.email} aria-describedby="connect-email-help connect-email-error"
            onChange={(event) => { setEmail(event.target.value); setErrors((v) => ({ ...v, email: "" })); }} />
          <p id="connect-email-help" className="helper">Use this Gmail. A different address is not linked.</p>
          <p id="connect-email-error" className="field-error">{errors.email}</p>
        </div>
        <div className="field">
          <label className="label" htmlFor="connect-password">Password</label>
          <input id="connect-password" type="password" autoComplete={mode === "create" ? "new-password" : "current-password"}
            value={password} disabled={pending !== null} aria-invalid={!!errors.password} aria-describedby="connect-password-error"
            onChange={(event) => { setPassword(event.target.value); setErrors((v) => ({ ...v, password: "" })); }} />
          <p id="connect-password-error" className="field-error">{errors.password}</p>
        </div>
        {mode === "create" ? <div className="field">
          <label className="label" htmlFor="connect-confirm">Confirm password</label>
          <input id="connect-confirm" type="password" autoComplete="new-password" value={confirm} disabled={pending !== null}
            aria-invalid={!!errors.confirm} aria-describedby="connect-confirm-error"
            onChange={(event) => { setConfirm(event.target.value); setErrors((v) => ({ ...v, confirm: "" })); }} />
          <p id="connect-confirm-error" className="field-error">{errors.confirm}</p>
        </div> : null}
        <button className="login-primary" type="submit" disabled={pending !== null}>
          {pending === "email" ? mode === "create" ? "Creating account…" : "Signing in…" : mode === "create" ? "Create account" : "Sign in"}
        </button>
        <div id="connect-auth-status" className="status" aria-live="polite" tabIndex={-1}>
          {registered ? <>That email is already registered. <button id="connect-sign-in-instead" className="button-quiet" type="button" onClick={() => { switchMode("sign-in"); moveFocus("connect-password"); }}>Sign in instead</button>.</> : status}
        </div>
      </form>
    </div>
  );
}
