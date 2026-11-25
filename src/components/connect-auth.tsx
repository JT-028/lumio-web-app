"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { authPost, authMessage } from "@/lib/auth-client";

export function ConnectAuth({ token, allowCreate, switchAccount = false }: {
  token: string;
  allowCreate: boolean;
  switchAccount?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const lock = useRef(false);
  const generation = useRef(0);
  const statusRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => () => { generation.current += 1; }, []);
  useEffect(() => { if (status) statusRef.current?.focus(); }, [status]);

  async function enter(event: MouseEvent, destination: "/login" | "/signup") {
    event.preventDefault();
    if (lock.current) return;
    const current = generation.current;
    lock.current = true; setPending(true); setStatus("");
    try {
      const continuation = `/connect/${token}`;
      await authPost("/api/auth/intent", { continuation });
      if (current !== generation.current) return;
      if (switchAccount) {
        await authPost("/api/sign-out", {});
        if (current !== generation.current) return;
        await authPost("/api/auth/intent", { continuation });
        if (current !== generation.current) return;
      }
      window.location.assign(destination);
    } catch (error) {
      if (current === generation.current) setStatus(authMessage(error));
    } finally {
      if (current === generation.current) { lock.current = false; setPending(false); }
    }
  }

  return <div className="stack" aria-busy={pending}>
    {switchAccount ? <a href="/login" aria-disabled={pending} onClick={event => void enter(event, "/login")}>Sign out and switch account</a> : <>
      <p>Sign in with the invited email to review this invitation. Connecting still requires your acceptance.</p>
      <a className="button-primary recovery-link" href="/login" aria-disabled={pending} onClick={event => void enter(event, "/login")}>Sign in</a>
      {allowCreate ? <a className="button-quiet recovery-link" href="/signup" aria-disabled={pending} onClick={event => void enter(event, "/signup")}>Create account</a> : null}
    </>}
    <p ref={statusRef} className={status ? "status is-error" : "status"} role={status ? "alert" : "status"} tabIndex={-1}>{pending ? "Opening sign-in…" : status}</p>
  </div>;
}
