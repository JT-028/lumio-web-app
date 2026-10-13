"use client";

import { useEffect, useState } from "react";
import type { Role } from "@/domain/types";
import { normalizeFirstName } from "@/domain/name";
import { mapSignInError, mapSignUpError } from "@/lib/auth-errors";
import { emailError, firstNameError } from "@/lib/form-checks";
import { getMe, pathForAccount, postProfile } from "@/lib/lumio-client";
import { browserSupabase } from "@/lib/supabase/browser";

type Mode = "sign-in" | "create";
type Tone = "error" | "success" | "neutral";

const OTHER = "Sign-in did not finish. Try again.";
const GOOGLE = "Google sign-in did not finish. Try again.";
const CHECK_EMAIL =
  "Check your email to confirm this address. Then come back and sign in.";
const RESET = "Password reset is not available yet.";
const ROLE_SAVED_STUCK =
  "Your role was saved, but the next page did not open. Try again.";
const ROLE_GENERIC = "Your role could not be saved. Try again.";
const HERO_ALT =
  "Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books.";

const heroSrc = new URL("../assets/lumi-hero.png", import.meta.url).href;

export function Landing() {
  const [phase, setPhase] = useState<"checking" | "ready">("checking");
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accountRole, setAccountRole] = useState<Role | "">("");
  const [firstName, setFirstName] = useState("");
  const [shown, setShown] = useState(false);
  // Visual only. Not sent to Supabase and not stored.
  const [remember, setRemember] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [roleMessage, setRoleMessage] = useState("");
  const [nameMessage, setNameMessage] = useState("");
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState<Tone>("neutral");
  const [registered, setRegistered] = useState(false);
  const [googleWaiting, setGoogleWaiting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focus, setFocus] = useState({ id: "", n: 0 });

  useEffect(() => {
    document.title = mode === "create" ? "Create account \u2014 Lumio" : "Sign in \u2014 Lumio";
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
    setRoleMessage("");
    setNameMessage("");
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

  function onForgot() {
    setRegistered(false);
    setTone("neutral");
    setStatus(RESET);
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
    const nextRole = accountRole === "" ? "Choose Parent or Student." : "";
    const nextName = firstNameError(firstName) ?? "";
    setEmailMessage(nextEmail ?? "");
    setPasswordMessage(nextPassword);
    setConfirmMessage(nextConfirm);
    setRoleMessage(nextRole);
    setNameMessage(nextName);
    setStatus("");
    if (nextEmail || nextPassword || nextConfirm || nextRole || nextName) {
      moveFocus(
        nextEmail
          ? "email"
          : nextPassword
            ? "password"
            : nextConfirm
              ? "confirm"
              : nextRole
                ? "account-parent"
                : "account-first-name",
      );
      return;
    }
    if (accountRole !== "parent" && accountRole !== "student") {
      setRoleMessage("Choose Parent or Student.");
      moveFocus("account-parent");
      return;
    }
    const role = accountRole;
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
      const existing = await getMe();
      if (!existing.ok) {
        setSubmitting(false);
        setTone("error");
        setStatus(OTHER);
        moveFocus("auth-status");
        return;
      }
      if (existing.me.role === "parent" || existing.me.role === "student") {
        window.location.replace(pathForAccount(existing.me));
        return;
      }
      const saved = await postProfile({
        first_name: normalizeFirstName(firstName),
        role,
      });
      if (!saved.ok) {
        if (saved.error.status === 401) {
          window.location.replace("/");
          return;
        }
        if (saved.error.status === 409) {
          const again = await getMe();
          if (again.ok && (again.me.role === "parent" || again.me.role === "student")) {
            window.location.replace(pathForAccount(again.me));
            return;
          }
        }
        setSubmitting(false);
        setTone("error");
        setStatus(saved.error.message.trim() || ROLE_GENERIC);
        moveFocus("auth-status");
        return;
      }
      const next = pathForAccount(saved.me);
      if (next === "/role") {
        setSubmitting(false);
        setTone("error");
        setStatus(ROLE_SAVED_STUCK);
        moveFocus("auth-status");
        return;
      }
      window.location.replace(next);
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

  const emailDescribedBy = emailMessage ? "email-error" : undefined;
  const passwordDescribedBy = [
    mode === "create" ? "password-help" : "",
    passwordMessage ? "password-error" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const confirmDescribedBy = confirmMessage ? "confirm-error" : undefined;
  const statusClass =
    tone === "success" ? "status is-success" : tone === "error" ? "status is-error" : "status";

  return (
    <div className="login">
      <header className="login-bar">
        <div className="login-brand">
          <div className="login-brand-row">
            <span className="login-star" aria-hidden="true">
              ✦
            </span>
            <p className="wordmark">Lumio</p>
          </div>
          <p className="tagline">
            Learn. Grow. <span className="level-up">Level Up.</span>
          </p>
        </div>
        <div className="login-bar-actions">
          <span className="login-new">{mode === "create" ? "Already joined?" : "New to Lumio?"}</span>
          <button
            type="button"
            className="login-header-button"
            onClick={() => switchMode(mode === "create" ? "sign-in" : "create")}
          >
            {mode === "create" ? "Sign in" : "Create account"}
          </button>
        </div>
      </header>
      <main className="login-main">
        <section className="login-hero-pane" aria-labelledby="welcome-title">
          <p className="login-kicker">
            <span className="login-star" aria-hidden="true">
              ✦
            </span>
            Your learning adventure
          </p>
          <h1 id="welcome-title" className="login-hero">
            Welcome back, little explorer!
          </h1>
          <p className="login-lead">Your next big idea is just around the corner.</p>
          <div className="login-art">
            <p className="login-bubble">Ready to learn something wonderful?</p>
            <img src={heroSrc} alt={HERO_ALT} />
          </div>
          <p className="login-caption">
            <span className="login-star" aria-hidden="true">
              ✦
            </span>
            Every great learner starts somewhere.
          </p>
        </section>
        <section
          className="login-card"
          aria-labelledby={phase === "ready" ? "login-title" : undefined}
          aria-busy={phase === "checking" || submitting ? true : undefined}
        >
          {phase === "checking" ? (
            <p className="visually-hidden">Loading</p>
          ) : (
            <div className="stack">
              <div>
                <span className="login-star" aria-hidden="true">
                  ✦
                </span>
                <h2 id="login-title" className="login-card-title">
                  {mode === "create" ? "Create account" : "Let\u2019s get learning"}
                </h2>
                <p className="login-card-lead">
                  {mode === "create"
                    ? "Choose who this account is for."
                    : "Sign in to continue your adventure."}
                </p>
              </div>
              <div className="login-modes" role="group" aria-label="Account action">
                <button
                  type="button"
                  className="login-mode"
                  aria-pressed={mode === "sign-in"}
                  onClick={() => switchMode("sign-in")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className="login-mode"
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
                    placeholder="Enter your password"
                    value={password}
                    aria-invalid={passwordMessage ? true : undefined}
                    aria-describedby={passwordDescribedBy || undefined}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordMessage("");
                    }}
                  />
                  {mode === "create" ? (
                    <p id="password-help" className="helper">
                      Choose a password you can remember.
                    </p>
                  ) : null}
                  <p id="password-error" className="field-error">
                    {passwordMessage}
                  </p>
                </div>
                <button
                  type="button"
                  className="login-text"
                  aria-pressed={shown}
                  onClick={() => setShown((current) => !current)}
                >
                  {shown ? "Hide password" : "Show password"}
                </button>
                {mode === "create" ? (
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
                ) : null}
                {mode === "create" ? (
                  <fieldset aria-describedby={roleMessage ? "account-role-help account-role-error" : "account-role-help"}>
                    <legend className="label">Who is this account for?</legend>
                    <p id="account-role-help" className="helper">
                      You choose once. Lumio cannot change this later.
                    </p>
                    <div className="choices">
                      <div className="choice-block">
                        <label className="choice" htmlFor="account-parent">
                          <input
                            id="account-parent"
                            type="radio"
                            name="account-role"
                            value="parent"
                            checked={accountRole === "parent"}
                            aria-invalid={roleMessage ? true : undefined}
                            aria-describedby={
                              roleMessage ? "account-parent-desc account-role-error" : "account-parent-desc"
                            }
                            onChange={() => {
                              setAccountRole("parent");
                              setRoleMessage("");
                            }}
                          />
                          <span className="choice-name">Parent</span>
                        </label>
                        <p id="account-parent-desc" className="helper">
                          I will connect my child{"\u2019"}s account.
                        </p>
                      </div>
                      <div className="choice-block">
                        <label className="choice" htmlFor="account-student">
                          <input
                            id="account-student"
                            type="radio"
                            name="account-role"
                            value="student"
                            checked={accountRole === "student"}
                            aria-invalid={roleMessage ? true : undefined}
                            aria-describedby={
                              roleMessage ? "account-student-desc account-role-error" : "account-student-desc"
                            }
                            onChange={() => {
                              setAccountRole("student");
                              setRoleMessage("");
                            }}
                          />
                          <span className="choice-name">Student</span>
                        </label>
                        <p id="account-student-desc" className="helper">
                          I am the Grade 6 student.
                        </p>
                      </div>
                    </div>
                    <p id="account-role-error" className="field-error">
                      {roleMessage}
                    </p>
                  </fieldset>
                ) : null}
                {mode === "create" ? (
                  <div className="field">
                    <label className="label" htmlFor="account-first-name">
                      First name
                    </label>
                    <input
                      id="account-first-name"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      aria-invalid={nameMessage ? true : undefined}
                      aria-describedby={nameMessage ? "account-name-help account-name-error" : "account-name-help"}
                      onChange={(event) => {
                        setFirstName(event.target.value);
                        setNameMessage("");
                      }}
                    />
                    <p id="account-name-help" className="helper">
                      Up to 40 characters. Letters, spaces, hyphens, or apostrophes.
                    </p>
                    <p id="account-name-error" className="field-error">
                      {nameMessage}
                    </p>
                  </div>
                ) : null}
                {mode === "sign-in" ? (
                  <div className="login-row">
                    <label className="remember" htmlFor="remember">
                      <input
                        id="remember"
                        type="checkbox"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                      />
                      <span>Remember me</span>
                    </label>
                    <button id="forgot-password" type="button" className="login-text" onClick={onForgot}>
                      Forgot password?
                    </button>
                  </div>
                ) : null}
                <button type="submit" className="login-primary" disabled={submitting || googleWaiting}>
                  {submitting
                    ? mode === "create"
                      ? "Creating account\u2026"
                      : "Signing in\u2026"
                    : mode === "create"
                      ? "Create account"
                      : "Sign in"}
                </button>
                {mode === "sign-in" ? (
                  <p className="switch-line">
                    New here?
                    <button type="button" className="login-text" onClick={() => switchMode("create")}>
                      Create an account.
                    </button>
                  </p>
                ) : (
                  <p className="switch-line">
                    Already have an account?
                    <button type="button" className="login-text" onClick={() => switchMode("sign-in")}>
                      Sign in.
                    </button>
                  </p>
                )}
                <div id="auth-status" tabIndex={-1} className={statusClass} aria-live="polite">
                  {registered ? (
                    <>
                      That email is already registered.{" "}
                      <button
                        id="sign-in-instead"
                        type="button"
                        className="login-text"
                        onClick={onRegisteredSwitch}
                      >
                        Sign in instead
                      </button>
                      .
                    </>
                  ) : (
                    status
                  )}
                </div>
              </form>
              <p className="divider">or continue with</p>
              <button
                type="button"
                className="login-google"
                onClick={() => {
                  void onGoogle();
                }}
                disabled={googleWaiting || submitting}
              >
                {googleWaiting ? "Waiting for Google\u2026" : "Continue with Google"}
              </button>
              <p className="login-safe">Your learning journey is safe with us.</p>
            </div>
          )}
        </section>
      </main>
      <footer className="login-foot">
        Made for curious minds{" "}
        <span className="login-star" aria-hidden="true">
          ✦
        </span>{" "}
        Learn at your own pace with Lumi.
      </footer>
    </div>
  );
}
