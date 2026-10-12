"use client";

import { useEffect, useState } from "react";
import type { Me } from "@/domain/types";
import { getMe, pathForAccount } from "@/lib/lumio-client";
import { Lines, Shell } from "@/components/shell";

type GateState =
  | { kind: "loading" }
  | { kind: "redirecting" }
  | { kind: "error" }
  | { kind: "ready"; me: Me };

const skeletonCount = {
  role: 3,
  wait: 2,
  home: 4,
} as const;

export function AccountGate({
  page,
  children,
}: {
  page: "role" | "wait" | "home";
  children: (me: Me) => React.ReactNode;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<GateState>({ kind: "loading" });

  const here = page === "role" ? "/role" : page === "wait" ? "/wait" : "/home";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setState({ kind: "loading" });
      const result = await getMe();
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        if (result.status === 401) {
          window.location.replace("/");
          setState({ kind: "redirecting" });
          return;
        }
        setState({ kind: "error" });
        return;
      }
      const next = pathForAccount(result.me);
      if (next !== here) {
        window.location.replace(next);
        setState({ kind: "redirecting" });
        return;
      }
      setState({ kind: "ready", me: result.me });
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, here]);

  if (state.kind === "loading" || state.kind === "redirecting") {
    return (
      <Shell signedIn busy>
        <p className="visually-hidden">Loading</p>
        <Lines count={skeletonCount[page]} />
      </Shell>
    );
  }

  if (state.kind === "error") {
    return (
      <Shell signedIn>
        <div className="stack">
          <p className="status is-error" aria-live="polite">
            We could not check your account. Check again.
          </p>
          <button
            type="button"
            className="button-primary"
            onClick={() => setAttempt((current) => current + 1)}
          >
            Check again
          </button>
        </div>
      </Shell>
    );
  }

  return <>{children(state.me)}</>;
}
