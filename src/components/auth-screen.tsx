"use client";

import { AuthLayout } from "@/components/auth-frame";
import { CheckEmailBody, ConfirmBody, ForgotBody, LoginBody, ResetBody } from "@/components/auth/modes";
import { AuthStatus } from "@/components/auth/parts";
import { SignupBody } from "@/components/auth/signup";
import { useAuth, type Auth, type Mode } from "@/components/auth/use-auth";
import { Skeleton, StatusLine } from "@/components/ui";

const titles: Record<Mode, string> = { login: "Welcome back", signup: "Create your Lumio account", "forgot-password": "Forgot your password?", "reset-password": "Choose a new password", "confirm-email": "Confirm your email", "check-email": "Check your email" };
const helpers: Partial<Record<Mode, string>> = { login: "Sign in to your Lumio account.", "forgot-password": "No worries. Enter your email and we’ll send you a reset link." };
const BODIES: Record<Mode, (props: { a: Auth }) => React.ReactNode> = {
  login: LoginBody, signup: SignupBody, "forgot-password": ForgotBody,
  "check-email": CheckEmailBody, "reset-password": ResetBody, "confirm-email": ConfirmBody,
};

export function AuthScreen({ mode }: { mode: Mode }) {
  const a = useAuth(mode);
  const Body = BODIES[mode];
  return (
    <AuthLayout mode={mode} title={titles[mode]} helper={helpers[mode]}>
      {a.checking ? <>
        <StatusLine>{mode === "reset-password" ? "Checking your reset link…" : "Checking your account…"}</StatusLine>
        <Skeleton className="form-skeleton" blocks={3} />
      </> : a.checkFailed ? <>
        <StatusLine role="alert" tone="error">We couldn’t check your account. Try again.</StatusLine>
        <button type="button" className="button-primary" onClick={a.retry}>Try again</button>
      </> : <>
        <Body a={a} />
        <AuthStatus a={a} />
        {a.cooldown && !a.mailPage ? <p className="helper">Please wait before requesting another email or trying again.</p> : null}
        {a.unconfirmed ? <button type="button" className="button-quiet" disabled={Boolean(a.pending) || a.cooldown} onClick={() => a.resendEmail()}>Resend confirmation email</button> : null}
        <AuthFooter a={a} />
      </>}
    </AuthLayout>
  );
}

function AuthFooter({ a }: { a: Auth }) {
  if (a.login) return <p className="auth-footer">New to Lumio? <a href="/signup">Create account</a></p>;
  if (a.signup) return <p className="auth-footer">Already joined? <a href="/login">Sign in</a></p>;
  return (
    <div className="auth-links">
      {a.mailPage && a.mail ? <a className="button-quiet" href={a.recovery ? "/forgot-password" : "/signup"} onClick={() => a.setMail(null)}>Use a different email</a> : null}
      <a className="button-quiet" href="/login">Back to sign in</a>
    </div>
  );
}
