"use client";

import { useEffect, useState } from "react";
import { mapSignInError, mapSignUpError } from "@/lib/auth-errors";
import { emailError } from "@/lib/form-checks";
import { getMe, pathForAccount } from "@/lib/lumio-client";
import { browserSupabase } from "@/lib/supabase/browser";
import { Shell } from "@/components/shell";

type Mode = "sign-in" | "create";
type Tone = "error" | "success" | "neutral";

const OTHER = "Sign-in did not finish. Try again.";
const GOOGLE = "Google sign-in did not finish. Try again.";
const CHECK_EMAIL =
  "Check your email to confirm this address. Then come back and sign in.";

export function Landing() {
  const [phase, setPhase] = useState<"checking" | "ready">("checking");
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [shown, setShown] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState<Tone>("neutral");
  const [registered, setRegistered] = useState(false);
  const [googleWaiting, setGoogleWaiting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focus, setFocus] = useState({ id: "", n: 0 });

  useEffect(() => {
    document.title =
      mode === "create" ? "Create account \u2014 Lumio" : "Sign in \u2014 Lumio";
  }, [mode]);

  useEffect(() => {
    if (!focus.id) {
      return;
    }
    document.getElementById(focus.id)?.focus();
  }, [focus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      window.history.replaceState(null, "", "/");
    }
    let cancelled = false;
    void (async () => {
      const result = await getMe();
      if (cancelled) {
        return;
      }
      if (result.ok) {
        window.location.replace(pathForAccount(result.me));
        return;
      }
      if (result.status !== 401) {
        setTone("error");
        setStatus(OTHER);
      } else if (error === "auth") {
        setTone("error");
        setStatus(GOOGLE);
      } else if (error) {
        setTone("error");
        setStatus(OTHER);
      }
      setPhase("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function moveFocus(id: string) {
    setFocus((current) => ({ id, n: current.n + 1 }));
  }

  function clearFieldErrors() {
    setEmailMessage("");
    setPasswordMessage("");
    setConfirmMessage("");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setPassword("");
    setConfirm("");
    setShown(false);
    clearFieldErrors();
    setStatus("");
    setRegistered(false);
    setTone("neutral");
  }

  async function leaveWhenSessionExists(): Promise<boolean> {
    const result = await getMe();
    if (!result.ok) {
      return false;
    }
    window.location.replace(pathForAccount(result.me));
    return true;
  }

  async function onGoogle() {
    setGoogleWaiting(true);
    setStatus("");
    setRegistered(false);
    const supabase = browserSupabase();
    if (!supabase) {
      setGoogleWaiting(false);
      setTone("error");
      setStatus(GOOGLE);
      return;
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error || !data.url) {
      setGoogleWaiting(false);
      setTone("error");
      setStatus(GOOGLE);
    }
  }

  async function onSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegistered(false);
    const nextEmail = emailError(email);
    const nextPassword = password.length === 0 ? "Enter your password." : "";
    setEmailMessage(nextEmail ?? "");
    setPasswordMessage(nextPassword);
    setStatus("");
    if (nextEmail || nextPassword) {
      moveFocus(nextEmail ? "email" : "password");
      return;
    }
    setSubmitting(true);
    const supabase = browserSupabase();
    if (!supabase) {
      setSubmitting(false);
      setTone("error");
      setStatus(OTHER);
      moveFocus("auth-status");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      const kind = mapSignInError(error);
      setSubmitting(false);
      setTone("error");
      if (kind === "mismatch") {
        setPassword("");
        setStatus("That email and password do not match. Try again.");
        moveFocus("password");
        return;
      }
      if (kind === "unconfirmed") {
        setStatus("Confirm your email first, then sign in.");
        moveFocus("auth-status");
        return;
      }
      setStatus(OTHER);
      moveFocus("auth-status");
      return;
    }
    const left = await leaveWhenSessionExists();
    if (!left) {
      setSubmitting(false);
      setTone("error");
      setStatus(OTHER);
      moveFocus("auth-status");
    }
  }

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegistered(false);
    const nextEmail = emailError(email);
    const nextPassword = password.length === 0 ? "Enter your password." : "";
    const nextConfirm =
      confirm.length === 0
        ? "Confirm your password."
        : password.length > 0 && confirm !== password
          ? "Those passwords do not match."
          : "";
    setEmailMessage(nextEmail ?? "");
    setPasswordMessage(nextPassword);
    setConfirmMessage(nextConfirm);
    setStatus("");
    if (nextEmail || nextPassword || nextConfirm) {
      moveFocus(nextEmail ? "email" : nextPassword ? "password" : "confirm");
      return;
    }
    setSubmitting(true);
    const supabase = browserSupabase();
    if (!supabase) {
      setSubmitting(false);
      setTone("error");
      setStatus(OTHER);
      moveFocus("auth-status");
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      const kind = mapSignUpError(error);
      setSubmitting(false);
      setTone("error");
      if (kind === "registered") {
        setRegistered(true);
        setStatus("");
        moveFocus("sign-in-instead");
        return;
      }
      if (kind === "password") {
        setStatus("That password was not accepted. Try a different one.");
        moveFocus("password");
        return;
      }
      setStatus(OTHER);
      moveFocus("auth-status");
      return;
    }
    const identities = data.user?.identities;
    if (data.user && Array.isArray(identities) && identities.length === 0) {
      setSubmitting(false);
      setTone("error");
      setRegistered(true);
      moveFocus("sign-in-instead");
      return;
    }
    if (data.session) {
      const left = await leaveWhenSessionExists();
      if (!left) {
        setSubmitting(false);
        setTone("error");
        setStatus(OTHER);
        moveFocus("auth-status");
      }
      return;
    }
    setSubmitting(false);
    setPassword("");
    setConfirm("");
    setTone("success");
    setStatus(CHECK_EMAIL);
    moveFocus("auth-status");
  }

  function onRegisteredSwitch() {
    setMode("sign-in");
    setPassword("");
    setConfirm("");
    setShown(false);
    clearFieldErrors();
    setRegistered(false);
    setStatus("");
    setTone("neutral");
    moveFocus("password");
  }

  if (phase === "checking") {
    return (
      <Shell signedIn={false} busy>
        <p className="visually-hidden">Loading</p>
      </Shell>
    );
  }

  const emailDescribedBy = emailMessage ? "email-error" : undefined;
  const passwordDescribedBy = [
    mode === "create" ? "password-help" : "",
    passwordMessage ? "password-error" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const confirmDescribedBy = confirmMessage ? "confirm-error" : undefined;

  return (
    <Shell signedIn={false} busy={submitting || googleWaiting}>
      <div className="stack">
        <p className="lede">Grade 6 study for a student and a parent.</p>
        <button
          type="button"
          className="button-primary"
          onClick={() => {
            void onGoogle();
          }}
          disabled={googleWaiting || submitting}
        >
          {googleWaiting ? "Waiting for Google\u2026" : "Continue with Google"}
        </button>
        <p className="divider">or</p>
        <div className="modes">
          <button
            type="button"
            className="button-mode"
            aria-pressed={mode === "sign-in"}
            onClick={() => switchMode("sign-in")}
          >
            Sign in
          </button>
          <button
            type="button"
            className="button-mode"
            aria-pressed={mode === "create"}
            onClick={() => switchMode("create")}
          >
            Create account
          </button>
        </div>
        <form
          className="stack"
          method="post"
          noValidate
          aria-busy={submitting}
          onSubmit={(event) => {
            if (mode === "sign-in") {
              void onSignIn(event);
              return;
            }
            void onCreate(event);
          }}
        >
          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="name@example.com"
              value={email}
              aria-invalid={emailMessage ? true : undefined}
              aria-describedby={emailDescribedBy}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailMessage("");
              }}
            />
            <p id="email-error" className="field-error">
              {emailMessage}
            </p>
          </div>
          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type={shown ? "text" : "password"}
              autoComplete={mode === "create" ? "new-password" : "current-password"}
              value={password}
              aria-invalid={passwordMessage ? true : undefined}
              aria-describedby={passwordDescribedBy || undefined}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordMessage("");
              }}
            />
            <p id="password-error" className="field-error">
              {passwordMessage}
            </p>
          </div>
          <button
            type="button"
            className="show-password"
            aria-pressed={shown}
            onClick={() => setShown((current) => !current)}
          >
            {shown ? "Hide password" : "Show password"}
          </button>
          {mode === "create" ? (
            <>
              <p id="password-help" className="helper">
                Choose a password you can remember.
              </p>
              <div className="field">
                <label className="label" htmlFor="confirm">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type={shown ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  aria-invalid={confirmMessage ? true : undefined}
                  aria-describedby={confirmDescribedBy}
                  onChange={(event) => {
                    setConfirm(event.target.value);
                    setConfirmMessage("");
                  }}
                />
                <p id="confirm-error" className="field-error">
                  {confirmMessage}
                </p>
              </div>
            </>
          ) : null}
          <button type="submit" className="button-primary" disabled={submitting || googleWaiting}>
            {mode === "create" ? "Create account" : "Sign in"}
          </button>
          {mode === "sign-in" ? (
            <p className="switch-line">
              New here?
              <button type="button" className="text-button" onClick={() => switchMode("create")}>
                Create an account
              </button>
            </p>
          ) : (
            <p className="switch-line">
              Already have an account?
              <button type="button" className="text-button" onClick={() => switchMode("sign-in")}>
                Sign in
              </button>
            </p>
          )}
          <div
            id="auth-status"
            tabIndex={-1}
            className={tone === "success" ? "status is-success" : tone === "error" ? "status is-error" : "status"}
            aria-live="polite"
          >
            {registered ? (
              <>
                That email is already registered.{" "}
                <button
                  id="sign-in-instead"
                  type="button"
                  className="text-button"
                  onClick={onRegisteredSwitch}
                >
                  Sign in instead
                </button>
              </>
            ) : (
              status
            )}
          </div>
        </form>
      </div>
    </Shell>
  );
}
