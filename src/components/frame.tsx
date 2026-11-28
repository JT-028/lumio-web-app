import type { ReactNode } from "react";
import { BrandBlock, SkipLink } from "@/components/ui";

/**
 * Focus pages (/role, /wait, /connect, /resting, not-found, error): a top bar
 * that stays visible at every width, then one centred card. No nav.
 */
export function FocusFrame({ actions, busy = false, center = false, children }: {
  actions?: ReactNode;
  busy?: boolean;
  center?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="focus-shell">
      <SkipLink />
      <header className="topbar">
        <BrandBlock />
        {actions}
      </header>
      <main id="main" tabIndex={-1} className="focus-main" aria-busy={busy}>
        <div className={center ? "card focus-card is-centered" : "card focus-card"}>{children}</div>
      </main>
    </div>
  );
}
