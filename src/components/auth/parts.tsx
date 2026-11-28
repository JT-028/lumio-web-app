"use client";

import type { InputHTMLAttributes } from "react";
import { Field, PasswordField } from "@/components/field";
import { GoogleIcon } from "@/components/icons";
import { StatusLine } from "@/components/ui";
import type { Auth, TextField } from "@/components/auth/use-auth";

type Extra = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">;
const MAX: Record<TextField, number> = { email: 254, first_name: 40, password: 1024, confirm: 1024 };
const SUCCESS = new Set(["Your password has been updated.", "If eligible, another email is on its way."]);

function bind(a: Auth, id: TextField) {
  return { id, value: a.values[id], onValue: (value: string) => a.change(id, value), error: a.errors[id], disabled: Boolean(a.pending), maxLength: MAX[id] };
}

export function TextInput({ a, id, label, help, ...extra }: Extra & { a: Auth; id: TextField; label: string; help?: string }) {
  const Input = id === "password" || id === "confirm" ? PasswordField : Field;
  return <Input {...bind(a, id)} label={label} help={help} {...extra} />;
}

export function EmailInput({ a, ...extra }: Extra & { a: Auth }) {
  return <TextInput a={a} id="email" label="Email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} {...extra} />;
}

/** Primary submit; shows the shared pending words while a request runs (as before). */
export function Submit({ a, label, describedBy }: { a: Auth; label: React.ReactNode; describedBy?: string }) {
  return (
    <button className="button-primary" type="submit" disabled={Boolean(a.pending) || a.cooldown} aria-describedby={describedBy}>
      {a.pending || label}
    </button>
  );
}

export function GoogleButton({ a, note }: { a: Auth; note?: string }) {
  const describedBy = [note ?? "", a.unavailable ? "google-help" : ""].filter(Boolean).join(" ") || undefined;
  return (
    <>
      <button className="button-secondary button-google" type="button" aria-describedby={describedBy} disabled={Boolean(a.pending) || a.unavailable || a.cooldown} onClick={a.google}>
        <GoogleIcon />Continue with Google
      </button>
      {a.unavailable ? <>
        <p id="google-help" className="helper">Google sign-in isn’t available right now. Use email to continue.</p>
        <a href="#auth-title" onClick={() => document.getElementById("auth-title")?.focus()}>Use email instead</a>
      </> : null}
    </>
  );
}

export function Divider() {
  return <p className="divider">or</p>;
}

/** The one #auth-status: polite progress and success, or a focused alert for a blocking failure. */
export function AuthStatus({ a }: { a: Auth }) {
  const text = a.pending || a.status;
  const tone = a.isError ? "error" : !a.pending && SUCCESS.has(a.status) ? "success" : "info";
  return <StatusLine id="auth-status" tone={tone} role={a.isError ? "alert" : "status"} focusable>{text}</StatusLine>;
}
