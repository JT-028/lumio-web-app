"use client";

import { useState } from "react";
import { getMe, pathForAccount } from "@/lib/lumio-client";
import { AccountGate } from "@/components/account-gate";
import { Shell } from "@/components/shell";

export function WaitScreen() {
  return (
    <AccountGate page="wait">
      {() => <WaitForm />}
    </AccountGate>
  );
}

function WaitForm() {
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState<"error" | "success" | "neutral">("neutral");
  const [busy, setBusy] = useState(false);

  async function checkAgain() {
    setBusy(true);
    const result = await getMe();
    if (!result.ok) {
      if (result.status === 401) {
        window.location.replace("/");
        return;
      }
      setBusy(false);
      setTone("error");
      setStatus("We could not check your account. Check again.");
      return;
    }
    const next = pathForAccount(result.me);
    if (next !== "/wait") {
      window.location.replace(next);
      return;
    }
    setBusy(false);
    setTone("success");
    setStatus("Still waiting for a parent.");
  }

  const statusClass =
    tone === "success" ? "status is-success" : tone === "error" ? "status is-error" : "status";

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
