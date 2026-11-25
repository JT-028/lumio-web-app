"use client";

import { useEffect, useState } from "react";
import type { Me } from "@/domain/types";
import { getMe } from "@/lib/lumio-client";
import { readAuthContext } from "@/lib/auth-client";
import { AppShell, HomeSkeleton } from "@/components/app-shell";
import { Shell } from "@/components/shell";
import { Loading, Skeleton, StatusLine } from "@/components/ui";

type GateState =
  | { kind: "loading" }
  | { kind: "redirecting" }
  | { kind: "error" }
  | { kind: "ready"; me: Me };

export function AccountGate({
  page,
  children,
}: {
  page: "role" | "wait" | "home";
  children: (me: Me, retry: () => void) => React.ReactNode;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<GateState>({ kind: "loading" });

  const here = page === "role" ? "/role" : page === "wait" ? "/wait" : "/home";
  const retry = () => setAttempt((current) => current + 1);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setState({ kind: "loading" });
      const { context } = await readAuthContext();
      if (cancelled) return;
      if (!context.authenticated) {
        window.location.replace("/login"); setState({ kind: "redirecting" }); return;
      }
      if (context.next !== here && context.next) {
        window.location.replace(context.next); setState({ kind: "redirecting" }); return;
      }
      const result = await getMe();
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        if (result.status === 401) {
          window.location.replace("/login");
          setState({ kind: "redirecting" });
          return;
        }
        setState({ kind: "error" });
        return;
      }
      setState({ kind: "ready", me: result.me });
    })().catch(() => { if (!cancelled) setState({ kind: "error" }); });
    return () => {
      cancelled = true;
    };
  }, [attempt, here]);

  if (state.kind === "loading" || state.kind === "redirecting") {
    if (page === "home") return <HomeSkeleton />;
    return (
      <Shell signedIn busy>
        <Loading />
        {page === "role" ? <Skeleton lines={1} blocks={3} /> : <Skeleton circle lines={2} />}
      </Shell>
    );
  }

  if (state.kind === "error") {
    const button = (
      <button type="button" className="button-primary" autoFocus onClick={retry}>
        {page === "home" ? "Try again" : "Check again"}
      </button>
    );
    return page === "home" ? (
      <AppShell>
        <section className="card stack">
          <StatusLine tone="error">We could not open your home. Try again.</StatusLine>
          {button}
        </section>
      </AppShell>
    ) : (
      <Shell signedIn>
        <StatusLine tone="error">We could not check your account. Check again.</StatusLine>
        {button}
      </Shell>
    );
  }

  return <>{children(state.me, retry)}</>;
}
