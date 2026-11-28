"use client";

import { useEffect, useRef, useState } from "react";
import { authPost } from "@/lib/auth-client";
import { FocusFrame } from "@/components/frame";
import { SignOutIcon } from "@/components/icons";
import { StatusLine } from "@/components/ui";

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

/** Sign out control plus its status line, shared by every signed-in frame. */
export function SignOut({ state, className, statusClassName }: {
  state: ReturnType<typeof useSignOut>;
  className: string;
  statusClassName: string;
}) {
  const { signOutError, signingOut, onSignOut } = state;
  return (
    <>
      <button type="button" className={`button-secondary ${className}`} disabled={signingOut} onClick={() => { void onSignOut(); }}>
        <SignOutIcon />Sign out
      </button>
      <StatusLine tone="error" className={statusClassName}>{signOutError}</StatusLine>
    </>
  );
}

/** FocusShell: /role, /wait, /connect and their gate states. */
export function Shell({
  signedIn,
  busy = false,
  center = false,
  children,
}: {
  signedIn: boolean;
  busy?: boolean;
  center?: boolean;
  children: React.ReactNode;
}) {
  const signOut = useSignOut();
  return (
    <FocusFrame busy={busy} center={center} actions={signedIn ? <SignOut state={signOut} className="focus-sign-out" statusClassName="topbar-status" /> : null}>
      {children}
    </FocusFrame>
  );
}
