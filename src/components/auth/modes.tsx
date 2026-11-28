"use client";

import { MailIcon } from "@/components/icons";
import { Divider, EmailInput, GoogleButton, Submit, TextInput } from "@/components/auth/parts";
import type { Auth } from "@/components/auth/use-auth";

/** /login: Google first, then "or", then the email form. */
export function LoginBody({ a }: { a: Auth }) {
  return (
    <>
      <GoogleButton a={a} />
      <Divider />
      <form className="stack" method="post" noValidate aria-busy={Boolean(a.pending)} onSubmit={a.submit}>
        <EmailInput a={a} autoComplete="username" enterKeyHint="next" placeholder="name@example.com" />
        <TextInput a={a} id="password" label="Password" autoComplete="current-password" enterKeyHint="go" />
        <a className="forgot-link" href="/forgot-password">Forgot password?</a>
        <Submit a={a} label="Sign in" />
      </form>
    </>
  );
}

export function ForgotBody({ a }: { a: Auth }) {
  return (
    <form className="stack" method="post" noValidate aria-busy={Boolean(a.pending)} onSubmit={a.submit}>
      <EmailInput a={a} autoComplete="email" enterKeyHint="send" />
      <Submit a={a} label="Send reset link" />
    </form>
  );
}

/** /check-email: what was sent, and a resend that waits out the existing cooldown as plain text. */
export function CheckEmailBody({ a }: { a: Auth }) {
  if (!a.mail) {
    return (
      <div className="stack">
        <h2 className="step-title">Need an email link?</h2>
        <a href="/signup">Create account</a>
        <a href="/forgot-password">Request a reset link</a>
      </div>
    );
  }
  const seconds = a.secondsLeft;
  return (
    <>
      <p>{a.recovery ? "If an account uses this email, you’ll receive a link to reset its password." : "If confirmation is needed for this address, you’ll receive an email with a link to continue."}</p>
      <p className="info-panel recovery-address"><MailIcon className="info-panel-icon" />{a.mail.email}</p>
      <p>Check your spam folder too.</p>
      <form className="stack" method="post" noValidate aria-busy={Boolean(a.pending)} onSubmit={a.submit}>
        <Submit a={a} label={a.recovery ? "Send another reset link" : "Resend confirmation email"} describedBy={a.cooldown ? "resend-timer" : undefined} />
      </form>
      {a.cooldown ? <p id="resend-timer" className="helper" aria-live="off">You can send another email in {seconds} {seconds === 1 ? "second" : "seconds"}.</p> : null}
    </>
  );
}

export function ResetBody({ a }: { a: Auth }) {
  if (a.invalidLink) {
    return (
      <div className="stack">
        <p>This reset link can’t be used. Request a new link.</p>
        <a className="button-primary" href="/forgot-password">Request a new link</a>
      </div>
    );
  }
  return (
    <>
      <p className="auth-helper">Pick a new password you’ll remember.</p>
      <form className="stack" method="post" noValidate aria-busy={Boolean(a.pending)} onSubmit={a.submit}>
        <TextInput a={a} id="password" label="New password" autoComplete="new-password" enterKeyHint="next" />
        <TextInput a={a} id="confirm" label="Confirm new password" autoComplete="new-password" enterKeyHint="done" />
        <Submit a={a} label="Save new password" />
      </form>
    </>
  );
}

/** /confirm-email: never verifies on mount; the button does. */
export function ConfirmBody({ a }: { a: Auth }) {
  if (a.invalidLink) {
    return (
      <div className="stack">
        <p>This confirmation link can’t be used. Request another email.</p>
        <a className="button-primary" href="/signup">Request a new link</a>
        <form className="stack" noValidate onSubmit={a.resendEmail}>
          <EmailInput a={a} autoComplete="email" enterKeyHint="send" />
          <button type="submit" className="button-secondary" disabled={Boolean(a.pending) || a.cooldown}>Resend confirmation email</button>
        </form>
      </div>
    );
  }
  return (
    <>
      <p className="auth-helper">Press the button to finish confirming your email.</p>
      <form className="stack" method="post" noValidate aria-busy={Boolean(a.pending)} onSubmit={a.submit}>
        <Submit a={a} label="Confirm email" />
      </form>
    </>
  );
}
