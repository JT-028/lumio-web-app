"use client";

import { useEffect, useRef, useState } from "react";
import { childGmailError } from "@/lib/form-checks";
import { AuthFailure, authPost } from "@/lib/auth-client";
import { Field } from "@/components/field";
import { MailIcon } from "@/components/icons";
import { StatusLine } from "@/components/ui";

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL: "Enter a Gmail address ending in @gmail.com or @googlemail.com.",
  ROLE_FORBIDDEN: "Only a parent can send a connect email.",
  RATE_LIMITED: "You have sent too many connect emails this hour. Wait and try again.",
  EMAIL_FAILED: "The connect email could not be sent. Nothing was saved. Try again.",
  EMAIL_NOT_CONFIGURED: "Connect email is not set up yet. Nothing was sent, and no link is shown.",
};

/** The parent's "Connect a child" card. A send never adds a child to the list. */
export function InviteCard({ onSignedOut }: { onSignedOut: () => void }) {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const sendLock = useRef(false);
  const generation = useRef(0);
  const [focus, setFocus] = useState({ id: "", n: 0 });
  useEffect(() => () => { generation.current += 1; }, []);
  useEffect(() => { if (focus.id) document.getElementById(focus.id)?.focus(); }, [focus]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendLock.current) return;
    const current = generation.current;
    const problem = childGmailError(email);
    if (problem) {
      setFieldError(problem); setStatus("");
      setFocus((value) => ({ id: "child-gmail", n: value.n + 1 }));
      return;
    }
    setFieldError(""); setStatus(""); setSending(true);
    sendLock.current = true;
    let result: { ok: true; invited_email: string } | { ok: false; status: number; message: string; field: string | null };
    try {
      const body = await authPost("/api/invites", { invited_email: email.trim() });
      if (typeof body.invited_email !== "string" || !body.invited_email.trim() || body.invited_email.includes("://") || /\s/.test(body.invited_email)) throw new AuthFailure("INTERNAL");
      result = { ok: true, invited_email: body.invited_email };
    } catch (error) {
      const code = error instanceof AuthFailure ? error.code : "";
      result = { ok: false, status: error instanceof AuthFailure ? error.status : 0, message: MESSAGES[code] ?? "The connect email could not be sent. Try again.", field: code === "INVALID_EMAIL" ? "invited_email" : null };
    } finally {
      if (current === generation.current) { sendLock.current = false; setSending(false); }
    }
    if (current !== generation.current) return;
    if (!result.ok) {
      if (result.status === 401) {
        setEmail(""); setStatus(""); onSignedOut();
        window.location.replace("/login");
        return;
      }
      if (result.field === "invited_email") {
        setFieldError(result.message);
        setFocus((value) => ({ id: "child-gmail", n: value.n + 1 }));
        return;
      }
      setSent(false); setStatus(result.message);
      return;
    }
    setEmail(""); setSent(true);
    setStatus(`Connect email sent to ${result.invited_email}.`);
  }

  return (
    <section className="card invite" aria-labelledby="invite-title">
      <h2 id="invite-title" className="card-title" tabIndex={-1}>Connect a child</h2>
      <p>We’ll email your child one link. They sign in or create a student account, then accept it.</p>
      <form className="stack" method="post" noValidate aria-labelledby="invite-title" aria-busy={sending} onSubmit={(event) => void onSubmit(event)}>
        <Field
          id="child-gmail"
          label="Child’s Gmail"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          placeholder="name@gmail.com"
          value={email}
          onValue={(value) => { setEmail(value); setFieldError(""); }}
          help="We send one link to that Gmail. It lasts 7 days. Your child can start studying after they accept it."
          error={fieldError}
        />
        <button type="submit" className="button-primary" disabled={sending}>
          <MailIcon />{sending ? "Sending…" : "Send connect email"}
        </button>
        <StatusLine tone={sent ? "success" : "error"}>{status}</StatusLine>
      </form>
    </section>
  );
}
