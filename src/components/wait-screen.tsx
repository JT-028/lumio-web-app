"use client";

import { useEffect, useRef, useState } from "react";
import { getHome, homeRedirect } from "@/lib/m2-client";
import { Lines, Shell } from "@/components/shell";

const heroSrc = new URL("../assets/lumi-hero.png", import.meta.url).href;
const HERO_ALT =
  "Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books.";

export function WaitScreen() {
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState<"error" | "success" | "neutral">("neutral");
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
    setTone("success");
    setStatus(initial ? "" : "Still waiting for a parent.");
  }

  const statusClass =
    tone === "success" ? "status is-success" : tone === "error" ? "status is-error" : "status";

  if (phase !== "ready") return <Shell signedIn busy><p className="visually-hidden">Loading</p><Lines count={2} /></Shell>;
  return (
    <Shell signedIn busy={busy}>
      <form
        className="stack"
        method="post"
        aria-busy={busy}
        onSubmit={(event) => {
          event.preventDefault();
          void checkAgain();
        }}
      >
        <figure className="wait-lumi">
          <img src={heroSrc} alt={HERO_ALT} />
        </figure>
        <h1 className="page-title display-text">Waiting for a parent</h1>
        <p className="body-copy">
          You can use Lumio after a parent connects you. Until then, this is the only page you can
          open.
        </p>
        <button type="submit" className="button-primary" disabled={busy}>
          Check again
        </button>
        <p className={statusClass} aria-live="polite">
          {status}
        </p>
      </form>
    </Shell>
  );
}
