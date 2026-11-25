"use client";

import { ChoiceCard } from "@/components/choice-card";
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { Divider, EmailInput, GoogleButton, Submit, TextInput } from "@/components/auth/parts";
import type { Auth } from "@/components/auth/use-auth";

/**
 * Register in two steps held in component state; one form holds both and the
 * inactive step is `hidden`. Only step 2 sends the same sign-up request as before.
 */
export function SignupBody({ a }: { a: Auth }) {
  const first = a.step === 1;
  const invalid = Boolean(a.errors.role);
  return (
    <form className="stack" method="post" noValidate aria-busy={Boolean(a.pending)} onSubmit={a.submit}>
      <p id="signup-step-label" className="step-label">
        Step {a.step} of 2
        <span className="step-dots" aria-hidden="true">
          <span className={first ? "step-dot is-current" : "step-dot"} />
          <span className={first ? "step-dot" : "step-dot is-current"} />
        </span>
      </p>
      <div className="signup-step fade-in" hidden={!first}>
        <fieldset className="choice-group" aria-describedby="role-help" disabled={Boolean(a.pending)}>
          <legend><h2 id="signup-step-1-title" className="step-title" tabIndex={-1}>Who is this account for?</h2></legend>
          <p id="role-help" className="helper">Choose carefully. Your saved role can’t be changed later.</p>
          <div className="choices">
            <ChoiceCard role="parent" title="I'm a parent" description="I'll connect my child's account." checked={a.role === "parent"} invalid={invalid} onPick={() => a.pickRole("parent")} />
            <ChoiceCard role="student" title="I'm a student" description="I'm the Grade 6 student." checked={a.role === "student"} invalid={invalid} onPick={() => a.pickRole("student")} />
          </div>
          <p id="role-error" className="field-error">{a.errors.role ? <><AlertIcon size={16} />{a.errors.role}</> : null}</p>
        </fieldset>
        <button type="submit" className="button-primary">Continue<ArrowRightIcon /></button>
      </div>
      <div className="signup-step fade-in" hidden={first}>
        <button type="button" className="button-quiet button-back" onClick={a.back}><ArrowLeftIcon />Back</button>
        <h2 id="signup-step-2-title" className="step-title" tabIndex={-1}>Your details</h2>
        <p className="muted">Signing up as a {a.role === "parent" ? "Parent" : "Student"}.</p>
        <GoogleButton a={a} note="google-role-note" />
        <p id="google-role-note" className="helper">With Google, you’ll choose Parent or Student again on the next screen.</p>
        <Divider />
        <TextInput a={a} id="first_name" label="First name" autoComplete="given-name" autoCapitalize="words" enterKeyHint="next" help="Up to 40 characters. Letters, spaces, hyphens, or apostrophes." />
        <EmailInput a={a} autoComplete="username" enterKeyHint="next" />
        <TextInput a={a} id="password" label="Password" autoComplete="new-password" enterKeyHint="next" help="Choose a password you can remember." />
        <TextInput a={a} id="confirm" label="Confirm password" autoComplete="new-password" enterKeyHint="done" />
        <Submit a={a} label="Create account" />
      </div>
    </form>
  );
}
