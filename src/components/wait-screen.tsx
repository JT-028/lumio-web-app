"use client";

import { useEffect, useRef, useState } from "react";
import { getHome, homeRedirect } from "@/lib/m2-client";
import { InfoIcon } from "@/components/icons";
import { LUMI_ALT, LumiImage } from "@/components/lumi-image";
import { Shell } from "@/components/shell";
import { Loading, Skeleton, StatusLine } from "@/components/ui";

export function WaitScreen() {
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState<"error" | "info">("info");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"loading" | "ready" | "redirecting">("loading");
  const lock = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    void checkAgain(true);
    return () => { generation.current += 1; lock.current = false; };
  }, []);

  async function checkAgain(initial = false) {
    if (lock.current) return;
    const current = generation.current;
    lock.current = true;
    setBusy(true);
    setStatus("");
    const result = await getHome();
    if (current !== generation.current) return;
    lock.current = false;
    const destination = homeRedirect(result);
    if (destination) {
      setPhase("redirecting"); setStatus(""); window.location.replace(destination); return;
    }
    if (!result.ok) {
      setPhase("ready");
      setBusy(false);
      setTone("error");
      setStatus("We could not check your account. Check again.");
      return;
    }
    if (result.data.role === "parent" || !result.data.needs_parent) {
      setPhase("redirecting"); setStatus(""); window.location.replace("/home");
      return;
    }
    setBusy(false);
    setPhase("ready");
    setTone("info");
    setStatus(initial ? "" : "Still waiting for a parent.");
  }

  if (phase !== "ready") return <Shell signedIn busy center><Loading /><Skeleton circle lines={2} /></Shell>;
  return (
    <Shell signedIn busy={busy} center>
      <form
        className="stack is-centered"
        method="post"
        aria-busy={busy}
        onSubmit={(event) => {
          event.preventDefault();
          void checkAgain();
        }}
      >
        <LumiImage pose="lumi-think" alt={LUMI_ALT["lumi-think"]} size="md" />
        <h1 className="page-title">Waiting for a parent</h1>
        <p>
          You can use Lumio after a parent connects you. Until then, this is the only page you can
          open.
        </p>
        <section className="info-panel" aria-labelledby="next-title">
          <InfoIcon className="info-panel-icon" />
          <div>
            <h2 id="next-title" className="panel-title">What happens next</h2>
            <ol className="next-steps">
              <li>Ask your parent to send a connect email to your Gmail.</li>
              <li>Open that email and press Accept this link.</li>
              <li>Come back here and press Check again.</li>
            </ol>
          </div>
        </section>
        <button type="submit" className="button-primary" disabled={busy}>
          Check again
        </button>
        <StatusLine tone={tone}>{status}</StatusLine>
      </form>
    </Shell>
  );
}
