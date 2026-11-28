"use client";

import { useEffect, useState } from "react";
import type { AuthContext } from "@/domain/auth-contract";
import { readAuthContext } from "@/lib/auth-client";
import type { MailFlow } from "@/components/auth-flow";
import type { Mode } from "@/components/auth/use-auth";

/** Reads one-time URL notices, then checks the session. Signed-in login/signup visits redirect. */
export function useAuthCheck(mode: Mode, setStatus: (value: string) => void, setIsError: (value: boolean) => void) {
  const [context, setContext] = useState<AuthContext | null>(null);
  const [checking, setChecking] = useState(true);
  const [checkFailed, setCheckFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setChecking(true); setCheckFailed(false);
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const notice = params.get("notice");
    const unsupported = Boolean(window.location.hash);
    if (window.location.search || window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    if (unsupported && (mode === "reset-password" || mode === "confirm-email")) {
      setStatus("This link can’t be used. Request a new email."); setIsError(true);
    } else if (error === "auth" || error === "cancelled") {
      setStatus("Google sign-in didn’t finish. Try again or use email."); setIsError(true);
    } else if (error === "unavailable") {
      setStatus("We couldn’t finish. Try again."); setIsError(true);
    } else if (notice === "password_updated" && mode === "login") {
      setStatus("Your password has been updated."); setIsError(false);
    }
    void readAuthContext().then(({ context: next }) => {
      if (!active) return;
      if ((mode === "login" || mode === "signup") && next.authenticated && next.next) { window.location.replace(next.next); return; }
      setContext(unsupported || error === "invalid_link" ? { ...next, link: "invalid" } : next);
      setChecking(false);
    }).catch(() => { if (active) { setChecking(false); setCheckFailed(true); } });
    return () => { active = false; };
  }, [mode, attempt, setStatus, setIsError]);
  return { context, setContext, checking, checkFailed, retry: () => setAttempt((value) => value + 1) };
}

/**
 * Seconds left on the existing resend/retry cooldown (60s, or the server's
 * Retry-After). The same timer re-arms on each second boundary so the
 * check-email text can count down; `onEnd` runs once when it reaches zero.
 */
export function useCooldown(mode: Mode, mail: MailFlow | null, retryAt: number, onEnd: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    const until = mode === "check-email" && mail ? Math.max(retryAt, mail.retryAt) : retryAt;
    let timer = 0;
    const tick = (): boolean => {
      const remaining = until - Date.now();
      setSecondsLeft(remaining > 0 ? Math.ceil(remaining / 1000) : 0);
      if (remaining <= 0) return false;
      timer = window.setTimeout(() => { if (!tick()) onEnd(); }, remaining % 1000 || 1000);
      return true;
    };
    tick();
    return () => window.clearTimeout(timer);
    // onEnd only uses state setters and `mode`, which is already a dependency.
  }, [retryAt, mail, mode]);
  return secondsLeft;
}
