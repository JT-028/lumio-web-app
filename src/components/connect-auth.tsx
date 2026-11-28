"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { authPost, authMessage } from "@/lib/auth-client";
import { StatusLine } from "@/components/ui";

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
    {switchAccount ? <a className="button-quiet" href="/login" aria-disabled={pending} onClick={event => void enter(event, "/login")}>Sign out and switch account</a> : <>
      <p>Sign in with the invited email to see this invitation. Nothing connects until you accept it.</p>
      <div className="actions">
        <a className="button-primary" href="/login" aria-disabled={pending} onClick={event => void enter(event, "/login")}>Sign in</a>
        {allowCreate ? <a className="button-secondary" href="/signup" aria-disabled={pending} onClick={event => void enter(event, "/signup")}>Create account</a> : null}
      </div>
    </>}
    <StatusLine ref={statusRef} tone={status ? "error" : "info"} role={status ? "alert" : "status"} focusable>{pending ? "Opening sign-in…" : status}</StatusLine>
  </div>;
}
