"use client";

import { useEffect, useState } from "react";
import { childGmailError } from "@/lib/form-checks";
import { postInvite } from "@/lib/lumio-client";
import { AccountGate } from "@/components/account-gate";
import { Shell } from "@/components/shell";
import { StudentHome } from "@/components/student-home";

export function HomeScreen() {
  return (
    <AccountGate page="home">
      {(me) =>
        me.role === "student" ? (
          me.has_main_parent && me.first_name?.trim() ? (
            <StudentHome firstName={me.first_name} />
          ) : null
        ) : (
          <HomeForm firstName={me.first_name} />
        )
      }
    </AccountGate>
  );
}

function HomeForm({ firstName }: { firstName: string | null }) {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [focus, setFocus] = useState({ id: "", n: 0 });
  const greeting =
    firstName && firstName.trim() ? `Hello, ${firstName.trim()}.` : "Hello.";

  useEffect(() => {
    if (!focus.id) {
      return;
    }
    document.getElementById(focus.id)?.focus();
  }, [focus]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = childGmailError(email);
    if (problem) {
      setFieldError(problem);
      setStatus("");
      setFocus((current) => ({ id: "child-gmail", n: current.n + 1 }));
      return;
    }
    setFieldError("");
    setStatus("");
    setSending(true);
    const result = await postInvite(email.trim());
    if (!result.ok) {
      if (result.status === 401) {
        setEmail("");
        setStatus("");
        window.location.replace("/");
        return;
      }
      setSending(false);
      setStatus(result.message);
      return;
    }
    setSending(false);
    setEmail("");
    setStatus(`Connect email sent to ${result.invited_email}.`);
  }

  return (
    <Shell signedIn>
      <div className="stack">
        <h1 className="page-title display-text">Home</h1>
        <p className="greeting">{greeting}</p>
        <p className="body-copy">No child is linked yet.</p>
        <form className="stack" method="post" noValidate aria-busy={sending} onSubmit={(event) => void onSubmit(event)}>
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
            <button type="submit" className="button-primary" disabled={sending}>
              {sending ? "Sending\u2026" : "Send connect email"}
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
