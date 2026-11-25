"use client";

import { useEffect, useRef, useState } from "react";
import { authPost } from "@/lib/auth-client";

function useDisplayFont() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("fonts-ready");
      return;
    }
    let finished = false;
    const show = () => {
      if (finished) {
        return;
      }
      finished = true;
      root.classList.add("fonts-ready");
    };
    const timer = window.setTimeout(show, 2500);
    const fonts = document.fonts;
    if (!fonts) {
      show();
      return () => window.clearTimeout(timer);
    }
    void fonts.ready.then(() => {
      window.requestAnimationFrame(() => {
        void fonts.ready.then(show);
      });
    });
    return () => window.clearTimeout(timer);
  }, []);
}

export function Lines({ count }: { count: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={index === count - 1 ? "skeleton-line short" : "skeleton-line"}
        />
      ))}
    </div>
  );
}

export function useSignOut() {
  const [signOutError, setSignOutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const busy = useRef(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);

  async function onSignOut() {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setSigningOut(true);
    setSignOutError("");
    const current = generation.current;
    try {
      await authPost("/api/sign-out", {});
      if (current === generation.current) window.location.replace("/login");
    } catch {
      if (current === generation.current) setSignOutError("Sign-out did not finish. Try again.");
    } finally {
      if (current === generation.current) { busy.current = false; setSigningOut(false); }
    }
  }

  return { signOutError, signingOut, onSignOut };
}

export function Shell({
  signedIn,
  busy = false,
  children,
}: {
  signedIn: boolean;
  busy?: boolean;
  children: React.ReactNode;
}) {
  useDisplayFont();
  const { signOutError, signingOut, onSignOut } = useSignOut();

  return (
    <div className="shell">
      <header className="chrome">
        <p className="wordmark display-text">Lumio</p>
        <p className="tagline">
          Learn. Grow. <span className="level-up">Level Up.</span>
        </p>
        {signedIn ? (
          <button
            type="button"
            className="button-quiet"
            onClick={() => {
              void onSignOut();
            }}
            disabled={signingOut}
          >
            Sign out
          </button>
        ) : null}
        {signedIn ? (
          <p className="status is-error" aria-live="polite">
            {signOutError}
          </p>
        ) : null}
      </header>
      <main className="action" aria-busy={busy}>
        {children}
      </main>
    </div>
  );
}
