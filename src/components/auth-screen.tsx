"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AuthContext, Role } from "@/domain/auth-contract";
import { parseFirstName } from "@/domain/name";
import { emailError } from "@/lib/form-checks";
import { AuthFailure, authMessage, authPost, openAccount, readAuthContext } from "@/lib/auth-client";
import { AuthFrame } from "@/components/auth-frame";
import { useMailFlow } from "@/components/auth-flow";

type Mode = "login" | "signup" | "forgot-password" | "reset-password" | "confirm-email" | "check-email";
const titles: Record<Mode, string> = { login: "Welcome back", signup: "Create your Lumio account", "forgot-password": "Forgot your password?", "reset-password": "Choose a new password", "confirm-email": "Confirm your email", "check-email": "Check your email" };
const helpers: Partial<Record<Mode, string>> = { login: "Sign in to your Lumio account.", signup: "Choose who this account is for.", "forgot-password": "Enter your email to request a reset link." };
type Field = "first_name" | "role" | "email" | "password" | "confirm";

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { mail, setMail } = useMailFlow();
  const [context, setContext] = useState<AuthContext | null>(null);
  const [checking, setChecking] = useState(true);
  const [checkFailed, setCheckFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [shown, setShown] = useState(false);
  const [confirmShown, setConfirmShown] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [pending, setPending] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [focus, setFocus] = useState({ id: "", count: 0 });
  const lock = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(false);
  const uncertain = useRef(false);

  function focusOn(id: string) { setFocus(v => ({ id, count: v.count + 1 })); }
  function failure(message: string) { setStatus(message); setIsError(true); focusOn("auth-status"); }
  useEffect(() => { document.getElementById(focus.id)?.focus(); }, [focus]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current += 1; };
  }, []);
  useEffect(() => {
    let active = true;
    setChecking(true); setCheckFailed(false);
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const notice = params.get("notice");
    const unsupported = Boolean(window.location.hash);
    if (window.location.search || window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    if (unsupported && (mode === "reset-password" || mode === "confirm-email")) {
      setStatus("This link can’t be used. Request a new email."); setIsError(true);
    } else if (error === "auth" || error === "cancelled") {
      setStatus("Google sign-in didn’t finish. Try again or use email."); setIsError(true);
    } else if (error === "unavailable") {
      setStatus("We couldn’t finish. Try again."); setIsError(true);
    } else if (notice === "password_updated" && mode === "login") {
      setStatus("Your password has been updated."); setIsError(false);
    }
    void readAuthContext().then(({ context: next }) => {
      if (!active) return;
      if ((mode === "login" || mode === "signup") && next.authenticated && next.next) { window.location.replace(next.next); return; }
      setContext(unsupported || error === "invalid_link" ? { ...next, link: "invalid" } : next);
      setChecking(false);
    }).catch(() => { if (active) { setChecking(false); setCheckFailed(true); } });
    return () => { active = false; };
  }, [mode, attempt]);
  useEffect(() => {
    const until = mode === "check-email" && mail ? Math.max(retryAt, mail.retryAt) : retryAt;
    const remaining = until - Date.now();
    setCooldown(remaining > 0);
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => {
      setCooldown(false); setIsError(false);
      setStatus(mode === "check-email" || mode === "forgot-password" ? "You can request another email now." : "You can try again now.");
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [retryAt, mail, mode]);

  const signup = mode === "signup";
  const login = mode === "login";
  const reset = mode === "reset-password";
  const confirmation = mode === "confirm-email";
  const mailPage = mode === "check-email";
  const recovery = mode === "forgot-password" || (mailPage && mail?.purpose === "recovery");
  const invalidLink = (reset && context?.link !== "recovery") || (confirmation && context?.link !== "confirmation");

  async function run(label: string, operation: (current: () => boolean) => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setPending(label); setStatus(""); setIsError(false);
    const version = generation.current;
    const current = () => mounted.current && generation.current === version;
    try { await operation(current); }
    catch (error) {
      if (!current()) return;
      if (error instanceof AuthFailure && error.code === "INVALID_CREDENTIALS") setPassword("");
      if (error instanceof AuthFailure && error.code === "EMAIL_UNCONFIRMED") { setUnconfirmed(true); setPassword(""); }
      if (error instanceof AuthFailure && error.code === "RATE_LIMITED") setRetryAt(Date.now() + error.retryAfter * 1000);
      if (error instanceof AuthFailure && error.code === "PROVIDER_UNAVAILABLE" && label === "Opening Google…") setUnavailable(true);
      if (error instanceof AuthFailure && error.code === "VALIDATION" && ["email", "password", "first_name", "role"].includes(error.field ?? "")) {
        const field = error.field as Field;
        setErrors(v => ({ ...v, [field]: authMessage(error) })); focusOn(field === "role" ? "role-parent" : field);
      } else failure(authMessage(error));
    } finally {
      if (current()) { lock.current = false; setPending(""); }
    }
  }

  function validate(): boolean {
    const next: Partial<Record<Field, string>> = {};
    if (signup) {
      if (!parseFirstName(firstName).ok) next.first_name = firstName.trim() ? "Use a first name of up to 40 characters with letters, spaces, hyphens, or apostrophes." : "Enter your first name.";
      if (!role) next.role = "Choose Parent or Student.";
    }
    if (!reset && !confirmation) {
      const address = mailPage && mail ? mail.email : email;
      const issue = emailError(address);
      if (issue || address.trim().length > 254) next.email = issue || "Enter a valid email address.";
    }
    if (signup || login || reset) {
      if (!password) next.password = reset ? "Enter a new password." : "Enter your password.";
      else if (password.length > 1024) next.password = "That password was not accepted. Try a different one.";
    }
    if (signup || reset) {
      if (!confirm) next.confirm = reset ? "Confirm your new password." : "Confirm your password.";
      else if (password !== confirm) next.confirm = "Those passwords do not match.";
    }
    setErrors(next);
    const first = Object.keys(next)[0] as Field | undefined;
    if (first) focusOn(first === "role" ? "role-parent" : first);
    return !first;
  }

  async function send(current: () => boolean, resend = false) {
    const address = (mailPage && mail ? mail.email : email).trim();
    const result = await authPost(recovery ? "/api/auth/forgot-password" : "/api/auth/resend", { email: address });
    if (!current()) return;
    if (result.status !== "check_email") throw new AuthFailure("INTERNAL");
    const until = Date.now() + 60000;
    setRetryAt(until);
    setMail({ purpose: recovery ? "recovery" : "confirmation", email: address, retryAt: until });
    if (resend) { setStatus("If eligible, another email is on its way."); setIsError(false); }
    else { setPassword(""); setConfirm(""); router.replace("/check-email"); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || cooldown || retryAt > Date.now() || (mailPage && mail && mail.retryAt > Date.now()) || invalidLink || !validate()) return;
    void run(confirmation ? "Confirming your email…" : reset ? "Saving password…" : signup ? "Creating account…" : login ? "Signing in…" : "Sending link…", async current => {
      if (reset || confirmation) {
        if (uncertain.current) {
          const { context: checked } = await readAuthContext();
          if (!current()) return;
          setContext(checked); uncertain.current = false;
          if (checked.link !== (reset ? "recovery" : "confirmation")) { failure("This link can’t be used. Request a new email."); return; }
        }
        try {
          const result = await authPost(reset ? "/api/auth/reset-password" : "/api/auth/confirm", reset ? { password } : {});
          if (!current()) return;
          setPassword(""); setConfirm("");
          if (reset) {
            if (result.status !== "password_updated" || result.next !== "/login?notice=password_updated") throw new AuthFailure("INTERNAL");
            window.location.replace(result.next);
          } else openAccount(result);
        } catch (error) {
          uncertain.current = true;
          if (current() && error instanceof AuthFailure && (error.code === "LINK_INVALID" || error.code === "LINK_EXPIRED")) {
            setContext(v => v ? { ...v, link: "invalid" } : v);
            setPassword(""); setConfirm("");
          } else {
            try {
              const { context: checked } = await readAuthContext();
              if (current()) {
                setContext(checked);
                if (checked.link !== (reset ? "recovery" : "confirmation")) { setPassword(""); setConfirm(""); }
              }
            } catch { /* Keep the retry path; it rechecks before another mutation. */ }
          }
          throw error;
        }
        return;
      }
      if (!signup && !login) { await send(current, mailPage); return; }
      if (signup && uncertain.current) {
        const { context: checked } = await readAuthContext();
        if (!current()) return;
        uncertain.current = false;
        if (checked.authenticated && checked.next) { window.location.replace(checked.next); return; }
      }
      try {
        const result = await authPost(signup ? "/api/auth/sign-up" : "/api/auth/sign-in", signup ? { email: email.trim(), password, first_name: firstName.trim().normalize("NFC"), role } : { email: email.trim(), password });
        if (!current()) return;
        if (signup && result.status === "check_email") {
          setPassword(""); setConfirm("");
          setMail({ purpose: "confirmation", email: email.trim(), retryAt: Date.now() + 60000 });
          router.replace("/check-email");
        } else { setPassword(""); setConfirm(""); openAccount(result); }
      } catch (error) { if (signup) uncertain.current = true; throw error; }
    });
  }

  function google() {
    void run("Opening Google…", async current => {
      const result = await authPost("/api/auth/google", {});
      if (!current()) return;
      if (result.status !== "redirect" || typeof result.url !== "string") throw new AuthFailure("INTERNAL");
      const target = new URL(result.url);
      // Server verifies the configured authorize origin; also reject non-web URLs here.
      if (target.protocol !== "https:" && !(target.protocol === "http:" && ["localhost", "127.0.0.1"].includes(target.hostname))) throw new AuthFailure("INTERNAL");
      if (target.username || target.password || target.pathname !== "/auth/v1/authorize") throw new AuthFailure("INTERNAL");
      setPassword(""); setConfirm("");
      window.location.assign(target.href);
    });
  }

  function field(id: "email" | "first_name" | "password" | "confirm", label: string, value: string, change: (value: string) => void) {
    const secret = id === "password" || id === "confirm";
    const reveal = id === "confirm" ? confirmShown : shown;
    return <div className="field" key={id}>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} type={secret ? reveal ? "text" : "password" : id === "email" ? "email" : "text"} value={value} autoComplete={id === "email" ? login || signup ? "username" : "email" : id === "first_name" ? "given-name" : login ? "current-password" : "new-password"} inputMode={id === "email" ? "email" : undefined} autoCapitalize={id === "email" ? "none" : undefined} spellCheck={id === "email" ? false : undefined} maxLength={id === "email" ? 254 : id === "first_name" ? 40 : 1024} disabled={Boolean(pending)} aria-invalid={Boolean(errors[id])} aria-describedby={errors[id] ? `${id}-error` : undefined} onChange={event => { change(event.target.value); setErrors(v => ({ ...v, [id]: undefined })); }} />
      {errors[id] ? <p className="field-error" id={`${id}-error`}>{errors[id]}</p> : null}
      {secret ? <button className="recovery-text-button" type="button" aria-controls={id} aria-pressed={reveal} onClick={() => id === "confirm" ? setConfirmShown(v => !v) : setShown(v => !v)}>{reveal ? "Hide" : "Show"} {id === "confirm" ? "confirmation password" : "password"}</button> : null}
    </div>;
  }

  return <AuthFrame title={titles[mode]} helper={helpers[mode]} signup={signup}>
    {checking ? <p role="status">{reset ? "Checking your reset link…" : "Checking your account…"}</p> : checkFailed ? <><p role="alert">We couldn’t check your account. Try again.</p><button type="button" className="button-primary" onClick={() => setAttempt(v => v + 1)}>Try again</button></> : <>
      {mailPage && !mail ? <div className="stack"><h2>Need an email link?</h2><a href="/signup">Create account</a><a href="/forgot-password">Request a reset link</a><a href="/login">Back to sign in</a></div> : invalidLink ? <div className="stack"><p>{reset ? "This reset link can’t be used. Request a new link." : "This confirmation link can’t be used. Request another email."}</p><a className="button-primary" href={reset ? "/forgot-password" : "/signup"}>Request a new link</a>{confirmation ? <form className="stack" noValidate onSubmit={event => { event.preventDefault(); if (lock.current || cooldown) return; const issue = emailError(email); if (issue) { setErrors({ email: issue }); focusOn("email"); return; } void run("Sending email…", current => send(current)); }}>{field("email", "Email", email, setEmail)}<button className="button-quiet" disabled={Boolean(pending) || cooldown}>Resend confirmation email</button></form> : null}<a href="/login">Back to sign in</a></div> : <>
        {mailPage && mail ? <><p>{recovery ? "If an account uses this email, you’ll receive a link to reset its password." : "If confirmation is needed for this address, you’ll receive an email with a link to continue."}</p><p className="recovery-address">{mail.email}</p><p>Check your spam folder too.</p></> : null}
        <form className="stack" method="post" noValidate aria-busy={Boolean(pending)} onSubmit={submit}>
          {signup ? <>{field("first_name", "First name", firstName, setFirstName)}<fieldset aria-describedby="role-help role-error" disabled={Boolean(pending)}><legend>This account is for</legend><div className="recovery-role-options">{(["parent", "student"] as const).map(value => <label key={value} className="recovery-role"><input id={`role-${value}`} type="radio" name="role" value={value} checked={role === value} aria-invalid={Boolean(errors.role)} aria-describedby="role-help role-error" onChange={() => { setRole(value); setErrors(v => ({ ...v, role: undefined })); }} />{value === "parent" ? "Parent" : "Student"}</label>)}</div><p className="helper" id="role-help">Your saved role cannot be changed.</p><p className="field-error" id="role-error">{errors.role}</p></fieldset></> : null}
          {!reset && !confirmation && !mailPage ? field("email", "Email", email, setEmail) : null}
          {login || signup || reset ? field("password", reset ? "New password" : "Password", password, setPassword) : null}
          {signup || reset ? field("confirm", reset ? "Confirm new password" : "Confirm password", confirm, setConfirm) : null}
          {login ? <a href="/forgot-password">Forgot password?</a> : null}
          <button className="button-primary" type="submit" disabled={Boolean(pending) || cooldown}>{pending || (login ? "Sign in" : signup ? "Create account" : reset ? "Save new password" : confirmation ? "Confirm email" : mailPage ? recovery ? "Send another reset link" : "Resend confirmation email" : "Send reset link")}</button>
        </form>
        {mailPage ? <a href={recovery ? "/forgot-password" : "/signup"} onClick={() => setMail(null)}>Use a different email</a> : null}
      </>}
      <p id="auth-status" tabIndex={-1} className={isError ? "status is-error" : "status"} role={isError ? "alert" : "status"}>{pending || status}</p>
      {cooldown ? <p className="helper">Please wait before requesting another email or trying again.</p> : null}
      {unconfirmed ? <button type="button" className="button-quiet" disabled={Boolean(pending) || cooldown} onClick={() => { if (!emailError(email)) void run("Sending email…", current => send(current)); }}>Resend confirmation email</button> : null}
      {login || signup ? <><p className="divider">or</p><button className="button-quiet" type="button" aria-describedby={unavailable ? "google-help" : undefined} disabled={Boolean(pending) || unavailable || cooldown} onClick={google}>Continue with Google</button>{unavailable ? <><p id="google-help">Google sign-in isn’t available right now. Use email to continue.</p><a href="#auth-title" onClick={() => document.getElementById("auth-title")?.focus()}>Use email instead</a></> : null}<p>{signup ? "Already joined?" : "New to Lumio?"} <a href={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create account"}</a></p></> : null}
      {!login && !signup ? <a href="/login">Back to sign in</a> : null}
    </>}
  </AuthFrame>;
}
