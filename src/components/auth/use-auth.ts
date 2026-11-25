"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/domain/auth-contract";
import { emailError } from "@/lib/form-checks";
import { AuthFailure, authMessage, authPost } from "@/lib/auth-client";
import { useMailFlow } from "@/components/auth-flow";
import { authRequests, fieldErrors, googleTarget } from "@/components/auth/auth-requests";
import { useAuthCheck, useCooldown } from "@/components/auth/use-auth-check";

export type Mode = "login" | "signup" | "forgot-password" | "reset-password" | "confirm-email" | "check-email";
export type Field = "first_name" | "role" | "email" | "password" | "confirm";
export type TextField = Exclude<Field, "role">;
export type Auth = ReturnType<typeof useAuth>;

/** All auth state, locks and requests. The mode pieces only render. */
export function useAuth(mode: Mode) {
  const router = useRouter();
  const { mail, setMail } = useMailFlow();
  const [values, setValues] = useState<Record<TextField, string>>({ email: "", first_name: "", password: "", confirm: "" });
  const [role, setRole] = useState<Role | "">("");
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [pending, setPending] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [focus, setFocus] = useState({ id: "", count: 0 });
  const lock = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(false);
  const uncertain = useRef(false);
  const check = useAuthCheck(mode, setStatus, setIsError);
  const secondsLeft = useCooldown(mode, mail, retryAt, () => {
    setIsError(false);
    setStatus(mode === "check-email" || mode === "forgot-password" ? "You can request another email now." : "You can try again now.");
  });
  const cooldown = secondsLeft > 0;

  function focusOn(id: string) { setFocus(v => ({ id, count: v.count + 1 })); }
  function failure(message: string) { setStatus(message); setIsError(true); focusOn("auth-status"); }
  function clearSecrets() { setValues(v => ({ ...v, password: "", confirm: "" })); }
  useEffect(() => { document.getElementById(focus.id)?.focus(); }, [focus]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current += 1; };
  }, []);

  const signup = mode === "signup";
  const login = mode === "login";
  const reset = mode === "reset-password";
  const confirmation = mode === "confirm-email";
  const mailPage = mode === "check-email";
  const recovery = mode === "forgot-password" || (mailPage && mail?.purpose === "recovery");
  const invalidLink = (reset && check.context?.link !== "recovery") || (confirmation && check.context?.link !== "confirmation");
  const requests = authRequests({
    mode, recovery, values, role, mail, uncertain, setMail, setRetryAt, setContext: check.setContext, failure, clearSecrets,
    notify: (message, error) => { setStatus(message); setIsError(error); },
    toCheckEmail: () => router.replace("/check-email"),
  });

  async function run(label: string, operation: (current: () => boolean) => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setPending(label); setStatus(""); setIsError(false);
    const version = generation.current;
    const current = () => mounted.current && generation.current === version;
    try { await operation(current); }
    catch (error) {
      if (!current()) return;
      const code = error instanceof AuthFailure ? error.code : "";
      if (code === "INVALID_CREDENTIALS") setValues(v => ({ ...v, password: "" }));
      if (code === "EMAIL_UNCONFIRMED") { setUnconfirmed(true); setValues(v => ({ ...v, password: "" })); }
      if (error instanceof AuthFailure && code === "RATE_LIMITED") setRetryAt(Date.now() + error.retryAfter * 1000);
      if (code === "PROVIDER_UNAVAILABLE" && label === "Opening Google…") setUnavailable(true);
      if (error instanceof AuthFailure && code === "VALIDATION" && ["email", "password", "first_name", "role"].includes(error.field ?? "")) {
        const field = error.field as Field;
        setErrors(v => ({ ...v, [field]: authMessage(error) }));
        if (field === "role") setStep(1); // the role lives on register step 1
        focusOn(field === "role" ? "role-parent" : field);
      } else failure(authMessage(error));
    } finally {
      if (current()) { lock.current = false; setPending(""); }
    }
  }

  function validate(): boolean {
    const next = fieldErrors(mode, values, mail);
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) focusOn(first);
    return !first;
  }

  /** Register step 1 sends nothing; a missing role keeps step 1. */
  function continueToDetails() {
    if (!role) { setErrors(v => ({ ...v, role: "Choose Parent or Student." })); focusOn("role-parent"); return; }
    setStep(2); focusOn("signup-step-2-title");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (signup && step === 1) { if (!lock.current) continueToDetails(); return; }
    if (lock.current || cooldown || retryAt > Date.now() || (mailPage && mail && mail.retryAt > Date.now()) || invalidLink || !validate()) return;
    void run(confirmation ? "Confirming your email…" : reset ? "Saving password…" : signup ? "Creating account…" : login ? "Signing in…" : "Sending link…",
      current => reset || confirmation ? requests.redeemLink(current) : !signup && !login ? requests.send(current, mailPage) : requests.account(current));
  }

  function google() {
    void run("Opening Google…", async current => {
      const result = await authPost("/api/auth/google", {});
      if (!current()) return;
      const href = googleTarget(result);
      clearSecrets();
      window.location.assign(href);
    });
  }

  /** Resend a confirmation email: the confirm-link mini form (with an event) or the unconfirmed sign-in button. */
  function resendEmail(event?: FormEvent) {
    event?.preventDefault();
    if (lock.current || cooldown) return;
    const issue = emailError(values.email);
    if (issue) { if (event) { setErrors({ email: issue }); focusOn("email"); } return; }
    void run("Sending email…", current => requests.send(current));
  }

  return {
    ...check, mail, setMail, values, role, step, errors, status, isError, unconfirmed, unavailable, pending, cooldown, secondsLeft,
    signup, login, reset, confirmation, mailPage, recovery, invalidLink, submit, google, resendEmail, continueToDetails,
    change(field: TextField, value: string) { setValues(v => ({ ...v, [field]: value })); setErrors(v => ({ ...v, [field]: undefined })); },
    pickRole(value: Role) { setRole(value); setErrors(v => ({ ...v, role: undefined })); },
    back() { setStep(1); setErrors(v => ({ role: v.role })); focusOn("signup-step-1-title"); },
  };
}
