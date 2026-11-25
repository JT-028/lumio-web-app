"use client";

import type { AuthContext, Role } from "@/domain/auth-contract";
import { parseFirstName } from "@/domain/name";
import { emailError } from "@/lib/form-checks";
import { AuthFailure, authPost, openAccount, readAuthContext } from "@/lib/auth-client";
import type { MailFlow } from "@/components/auth-flow";
import type { Field, Mode, TextField } from "@/components/auth/use-auth";

type Errors = Partial<Record<Field, string>>;

/** Submit-time checks for every mode (register step 2 for sign-up). Same rules and words as before. */
export function fieldErrors(mode: Mode, values: Record<TextField, string>, mail: MailFlow | null): Errors {
  const signup = mode === "signup";
  const reset = mode === "reset-password";
  const next: Errors = {};
  if (signup && !parseFirstName(values.first_name).ok) next.first_name = values.first_name.trim() ? "Use a first name of up to 40 characters with letters, spaces, hyphens, or apostrophes." : "Enter your first name.";
  if (!reset && mode !== "confirm-email") {
    const address = mode === "check-email" && mail ? mail.email : values.email;
    const issue = emailError(address);
    if (issue || address.trim().length > 254) next.email = issue || "Enter a valid email address.";
  }
  if (signup || mode === "login" || reset) {
    if (!values.password) next.password = reset ? "Enter a new password." : "Enter your password.";
    else if (values.password.length > 1024) next.password = "That password was not accepted. Try a different one.";
  }
  if (signup || reset) {
    if (!values.confirm) next.confirm = reset ? "Confirm your new password." : "Confirm your password.";
    else if (values.password !== values.confirm) next.confirm = "Those passwords do not match.";
  }
  return next;
}

/** The Google authorize URL, or a throw. The server verifies the origin; this also rejects non-web URLs. */
export function googleTarget(result: Record<string, unknown>): string {
  if (result.status !== "redirect" || typeof result.url !== "string") throw new AuthFailure("INTERNAL");
  const target = new URL(result.url);
  if (target.protocol !== "https:" && !(target.protocol === "http:" && ["localhost", "127.0.0.1"].includes(target.hostname))) throw new AuthFailure("INTERNAL");
  if (target.username || target.password || target.pathname !== "/auth/v1/authorize") throw new AuthFailure("INTERNAL");
  return target.href;
}

export type RequestDeps = {
  mode: Mode;
  recovery: boolean;
  values: Record<TextField, string>;
  role: Role | "";
  mail: MailFlow | null;
  uncertain: { current: boolean };
  setMail: (value: MailFlow | null) => void;
  setRetryAt: (value: number) => void;
  setContext: (update: (value: AuthContext | null) => AuthContext | null) => void;
  notify: (message: string, error: boolean) => void;
  failure: (message: string) => void;
  clearSecrets: () => void;
  toCheckEmail: () => void;
};

/** The three request flows behind submit. `current()` is false once the screen or attempt is gone. */
export function authRequests(d: RequestDeps) {
  const reset = d.mode === "reset-password";
  const signup = d.mode === "signup";

  async function send(current: () => boolean, resend = false) {
    const address = (d.mode === "check-email" && d.mail ? d.mail.email : d.values.email).trim();
    const result = await authPost(d.recovery ? "/api/auth/forgot-password" : "/api/auth/resend", { email: address });
    if (!current()) return;
    if (result.status !== "check_email") throw new AuthFailure("INTERNAL");
    const until = Date.now() + 60000;
    d.setRetryAt(until);
    d.setMail({ purpose: d.recovery ? "recovery" : "confirmation", email: address, retryAt: until });
    if (resend) d.notify("If eligible, another email is on its way.", false);
    else { d.clearSecrets(); d.toCheckEmail(); }
  }

  async function redeemLink(current: () => boolean) {
    const wanted = reset ? "recovery" : "confirmation";
    if (d.uncertain.current) {
      const { context: checked } = await readAuthContext();
      if (!current()) return;
      d.setContext(() => checked); d.uncertain.current = false;
      if (checked.link !== wanted) { d.failure("This link can’t be used. Request a new email."); return; }
    }
    try {
      const result = await authPost(reset ? "/api/auth/reset-password" : "/api/auth/confirm", reset ? { password: d.values.password } : {});
      if (!current()) return;
      d.clearSecrets();
      if (reset) {
        if (result.status !== "password_updated" || result.next !== "/login?notice=password_updated") throw new AuthFailure("INTERNAL");
        window.location.replace(result.next);
      } else openAccount(result);
    } catch (error) {
      d.uncertain.current = true;
      if (current() && error instanceof AuthFailure && (error.code === "LINK_INVALID" || error.code === "LINK_EXPIRED")) {
        d.setContext(v => v ? { ...v, link: "invalid" } : v);
        d.clearSecrets();
      } else {
        try {
          const { context: checked } = await readAuthContext();
          if (current()) {
            d.setContext(() => checked);
            if (checked.link !== wanted) d.clearSecrets();
          }
        } catch { /* Keep the retry path; it rechecks before another mutation. */ }
      }
      throw error;
    }
  }

  async function account(current: () => boolean) {
    if (signup && d.uncertain.current) {
      const { context: checked } = await readAuthContext();
      if (!current()) return;
      d.uncertain.current = false;
      if (checked.authenticated && checked.next) { window.location.replace(checked.next); return; }
    }
    try {
      const email = d.values.email.trim();
      const result = await authPost(signup ? "/api/auth/sign-up" : "/api/auth/sign-in", signup ? { email, password: d.values.password, first_name: d.values.first_name.trim().normalize("NFC"), role: d.role } : { email, password: d.values.password });
      if (!current()) return;
      d.clearSecrets();
      if (signup && result.status === "check_email") {
        d.setMail({ purpose: "confirmation", email, retryAt: Date.now() + 60000 });
        d.toCheckEmail();
      } else openAccount(result);
    } catch (error) { if (signup) d.uncertain.current = true; throw error; }
  }

  return { send, redeemLink, account };
}
