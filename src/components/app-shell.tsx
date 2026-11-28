"use client";

import type { ReactNode } from "react";
import { HomeIcon, ParentIcon, StudentIcon } from "@/components/icons";
import { SignOut, useSignOut } from "@/components/shell";
import { BrandBlock, Loading, Skeleton, SkipLink } from "@/components/ui";

export type Account = { name: string; role: "parent" | "student" };

/**
 * Signed-in /home chrome. Phone: top bar, one column. Tablet: top bar and a
 * 96px icon sidebar. Desktop: sidebar, main column and right rail. One nav.
 */
export function AppShell({ account, busy = false, rail, children }: {
  account?: Account;
  busy?: boolean;
  rail?: ReactNode;
  children: ReactNode;
}) {
  const signOut = useSignOut();
  const roleLabel = account?.role === "parent" ? "Parent" : "Student";
  const Avatar = account?.role === "parent" ? ParentIcon : StudentIcon;
  return (
    <div className="app-shell">
      <SkipLink />
      <header className="topbar">
        <BrandBlock />
        <p className="account-chip">{account ? `${account.name} · ${roleLabel}` : null}</p>
        <SignOut state={signOut} className="topbar-sign-out" statusClassName="topbar-status" />
      </header>
      <aside className="sidebar" aria-label="Account and navigation">
        <div className="sidebar-brand"><BrandBlock /></div>
        <nav aria-label="Main" className="sidebar-nav">
          <a className="nav-link" href="/home" aria-current="page"><HomeIcon size={24} />Home</a>
        </nav>
        <div className="sidebar-account">
          <div className="account-id">
            <span className="avatar">{account ? <Avatar /> : null}</span>
            {account ? <>
              <p className="account-name">{account.name}</p>
              <p className="account-role">{roleLabel}</p>
            </> : <Skeleton lines={2} />}
          </div>
          <SignOut state={signOut} className="sidebar-sign-out" statusClassName="sidebar-status" />
        </div>
      </aside>
      <main id="main" tabIndex={-1} className="app-main" aria-busy={busy}>
        <div className="main-column">{children}</div>
        {rail ? <div className="rail">{rail}</div> : null}
      </main>
    </div>
  );
}

/** Same box sizes as the loaded home: hero with Lumi, four tiles, two rail cards. */
export function HomeSkeleton({ account }: { account?: Account }) {
  return (
    <AppShell account={account} busy rail={<Skeleton className="rail-skeleton" blocks={2} />}>
      <Loading />
      <Skeleton circle className="skeleton-hero" />
      <Skeleton className="tile-skeleton" blocks={4} />
    </AppShell>
  );
}
