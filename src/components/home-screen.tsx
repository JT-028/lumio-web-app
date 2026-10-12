"use client";

import { useEffect, useState } from "react";
import { childGmailError } from "@/lib/form-checks";
import { AccountGate } from "@/components/account-gate";
import { Shell } from "@/components/shell";

export function HomeScreen() {
  return (
    <AccountGate page="home">
      {(me) => <HomeForm firstName={me.first_name} />}
    </AccountGate>
  );
}

function HomeForm({ firstName }: { firstName: string | null }) {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [status, setStatus] = useState("");
  const [focus, setFocus] = useState({ id: "", n: 0 });
  const greeting =
    firstName && firstName.trim() ? `Hello, ${firstName.trim()}.` : "Hello.";

  useEffect(() => {
    if (!focus.id) {
      return;
    }
    document.getElementById(focus.id)?.focus();
  }, [focus]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = childGmailError(email);
    if (problem) {
      setFieldError(problem);
      setStatus("");
      setFocus((current) => ({ id: "child-gmail", n: current.n + 1 }));
      return;
    }
    setFieldError("");
    // POST /api/invites is not built. Do not call it or claim a send.
    setStatus("Connect email is not available in this milestone. Nothing was sent.");
  }

  return (
    <Shell signedIn>
      <div className="stack">
        <h1 className="page-title display-text">Home</h1>
        <p className="greeting">{greeting}</p>
        <p className="body-copy">No child is linked yet.</p>
        <form className="stack" method="post" noValidate onSubmit={onSubmit}>
          <fieldset className="stack">
            <legend className="form-legend display-text">Connect a child</legend>
            <div className="field">
              <label className="label" htmlFor="child-gmail">
                Child{"\u2019"}s Gmail
              </label>
              <input
                id="child-gmail"
                type="email"
                autoComplete="off"
                placeholder="name@gmail.com"
                value={email}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={
                  fieldError ? "child-gmail-help child-gmail-error" : "child-gmail-help"
                }
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldError("");
                }}
              />
              <p id="child-gmail-help" className="helper">
                We send one link to that Gmail. It lasts 7 days. Your child still cannot study
                until they accept.
              </p>
              <p id="child-gmail-error" className="field-error">
                {fieldError}
              </p>
            </div>
            <button type="submit" className="button-primary">
              Send connect email
            </button>
            <p className="status" aria-live="polite">
              {status}
            </p>
          </fieldset>
        </form>
      </div>
    </Shell>
  );
}
