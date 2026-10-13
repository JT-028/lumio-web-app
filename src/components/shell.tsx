"use client";

import { useEffect, useRef, useState } from "react";
import { browserSupabase } from "@/lib/supabase/browser";
import { postSignOut } from "@/lib/lumio-client";

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

  async function onSignOut() {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setSigningOut(true);
    setSignOutError("");
    const result = await postSignOut();
    if (result === "error") {
      busy.current = false;
      setSigningOut(false);
      setSignOutError("Sign-out did not finish. Try again.");
      return;
    }
    const supabase = browserSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // The server already cleared the session cookies.
      }
    }
    window.location.replace("/");
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
