"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { ConnectPreview, Me } from "@/domain/types";
import { getMe } from "@/lib/lumio-client";
import { connectExpiry, getConnectPreview } from "@/lib/m2-client";
import { AuthFailure, authPost, readAuthContext } from "@/lib/auth-client";
import { Lines, Shell } from "@/components/shell";
import { ConnectAuth } from "@/components/connect-auth";

type Screen = { kind: "loading" | "redirecting" | "error" | "notfound" | "expired" }
  | { kind: "ready"; preview: ConnectPreview; me: Me | null };
type Outcome = "ready" | "accepted" | "ignored" | "mismatch" | "parent" | "used" | "expired" | "notfound";
const PARENT = "A parent account cannot accept this link. You are not linked.";
const EXPIRED = "This link has expired. It does not connect anyone. Ask your parent to send a new one.";

export function ConnectRoute() {
  const params = useParams<{ token: string }>();
  return <ConnectScreen key={params.token} token={params.token} />;
}

export function ConnectScreen({ token }: { token: string }) {
  const [screen, setScreen] = useState<Screen>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>("ready");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const retry = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => { document.title = "Connect — Lumio"; }, []);
  useEffect(() => { if (screen.kind === "error") retry.current?.focus(); }, [screen]);
  useEffect(() => { if (status) statusRef.current?.focus(); }, [status]);

  useEffect(() => {
    let cancelled = false;
    lock.current = false; setBusy(false);
    setScreen({ kind: "loading" }); setStatus(""); setOutcome("ready");
    void (async () => {
      await readAuthContext();
      if (cancelled) return;
      const [preview, account] = await Promise.all([getConnectPreview(token), getMe()]);
      if (cancelled) return;
      if (account.ok && (!account.me.role || !account.me.first_name?.trim())) {
        await authPost("/api/auth/intent", { continuation: `/connect/${token}` });
        if (cancelled) return;
        setScreen({ kind: "redirecting" }); window.location.replace("/role"); return;
      }
      if (!preview.ok) {
        setScreen({ kind: preview.status === 404 ? "notfound" : preview.status === 410 ? "expired" : "error" });
        return;
      }
      if (!account.ok && account.status !== 401) { setScreen({ kind: "error" }); return; }
      setScreen({ kind: "ready", preview: preview.data, me: account.ok ? account.me : null });
    })().catch(() => { if (!cancelled) setScreen({ kind: "error" }); });
    return () => { cancelled = true; generation.current += 1; };
  }, [token, attempt]);

  function openWait() {
    try {
      window.location.replace("/wait");
    } catch {
      setStatus("You are connected, but the waiting page did not open. Try again.");
    }
  }
  async function accept() {
    if (lock.current || screen.kind !== "ready" || screen.me?.role !== "student") return;
    const current = generation.current;
    lock.current = true; setBusy(true); setStatus("");
    let result: { ok: true; data: "accepted" | "ignored" } | { ok: false; code: string; status: number };
    try {
      const body = await authPost(`/api/connect/${encodeURIComponent(token)}/accept`, {});
      if (body.state !== "accepted" && body.state !== "ignored") throw new AuthFailure("INTERNAL");
      result = { ok: true, data: body.state };
    } catch (error) {
      const code = error instanceof AuthFailure ? error.code : "";
      result = { ok: false, code, status: error instanceof AuthFailure ? error.status : 0 };
    } finally {
      if (current === generation.current) { lock.current = false; setBusy(false); }
    }
    if (current !== generation.current) return;
    lock.current = false; setBusy(false);
    if (result.ok) {
      setOutcome(result.data);
      if (result.data === "ignored") {
        setStatus("You stay with the first parent. This link does not connect you.");
      } else {
        setStatus("You are connected. You can leave the waiting page."); openWait();
      }
      return;
    }
    if (result.status === 401 || (result.status === 403 && result.code === "ROLE_REQUIRED")) {
      setScreen({ kind: "redirecting" });
      try {
        await authPost("/api/auth/intent", { continuation: `/connect/${token}` });
        if (current === generation.current) window.location.replace(result.status === 401 ? "/login" : "/role");
      } catch { if (current === generation.current) { setScreen({ kind: "error" }); setStatus("We couldn’t continue. Try again."); } }
      return;
    }
    if (result.code === "EMAIL_MISMATCH") {
      setOutcome("mismatch"); setStatus("You are signed in as the wrong address. You are not linked. Sign out, then sign in with the Gmail on this page.");
    } else if (result.code === "ROLE_NOT_STUDENT") {
      setOutcome("parent"); setStatus(PARENT);
    } else if (result.status === 409 && result.code === "ALREADY_USED") {
      setOutcome("used"); setStatus("Someone else already used this link. You are not linked.");
    } else if (result.status === 410) {
      setOutcome("expired"); setStatus(EXPIRED);
    } else if (result.status === 404) {
      setOutcome("notfound"); setStatus("This connect link could not be found. You are not linked.");
    } else {
      setStatus("This link could not be accepted. Try again.");
    }
  }

  const ready = screen.kind === "ready" ? screen : null;
  const loading = screen.kind === "loading" || screen.kind === "redirecting";
  return (
    <Shell signedIn={!!ready?.me} busy={loading || busy}>
      {loading ? <><p className="visually-hidden">Loading</p><Lines count={3} /></> :
        <div className="stack connect-screen">
          <h1 className="page-title display-text">Connect to a parent</h1>
          {screen.kind === "notfound" ? <p className="body-copy">This connect link could not be found.</p> : null}
          {screen.kind === "expired" ? <p className="body-copy">{EXPIRED}</p> : null}
          {screen.kind === "error" ? <>
            <p className="status is-error" aria-live="polite">This page could not be loaded. Try again.</p>
            <button ref={retry} className="button-primary" type="button" onClick={() => setAttempt((v) => v + 1)}>Try again</button>
          </> : null}
          {ready ? <>
            <p className="body-copy">{ready.preview.parent_first_name} sent this link to {ready.preview.invited_email}.</p>
            <p className="body-copy">{connectExpiry(ready.preview.expires_at)}</p>
            {!ready.me ? <>
              {ready.preview.state === "accepted" ? <p className="body-copy">This link was already used. Sign in with that Gmail if it is yours. This page does not connect anyone new.</p> : null}
              {ready.preview.state === "ignored" ? <p className="body-copy">This link does not connect anyone. The student stays with the first parent.</p> : null}
              <ConnectAuth token={token} allowCreate={ready.preview.state === "sent"} />
            </> : <>
              {ready.me.role === "parent" ? <p className="body-copy">{PARENT}</p> : null}
              {ready.me.role === "parent" || outcome === "mismatch" || outcome === "parent" ? <ConnectAuth token={token} allowCreate={false} switchAccount /> : null}
              {ready.me.role === "student" && outcome === "ready" ? <button className="button-primary" type="button" disabled={busy} onClick={() => void accept()}>{busy ? "Accepting…" : "Accept this link"}</button> : null}
              <p ref={statusRef} className="status" aria-live="polite" tabIndex={-1}>{status}</p>
              {outcome === "accepted" ? <button className="button-primary" type="button" onClick={openWait}>Try again</button> : null}
              {ready.me.role === "parent" || outcome === "parent" || outcome === "ignored" ? <button className="button-quiet" type="button" onClick={() => window.location.replace("/home")}>Go to home</button> : null}
            </>}
          </> : null}
        </div>}
    </Shell>
  );
}
