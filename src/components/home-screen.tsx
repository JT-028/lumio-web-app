"use client";

import { useEffect, useState } from "react";
import { AccountGate } from "@/components/account-gate";
import { AppShell, HomeSkeleton, type Account } from "@/components/app-shell";
import { CourseGroups } from "@/components/guides";
import { Greeting, HeroCard } from "@/components/hero-card";
import { ArrowRightIcon, CheckIcon, StudentIcon } from "@/components/icons";
import { InviteCard } from "@/components/invite-card";
import { LUMI_ALT, LumiImage } from "@/components/lumi-image";
import { StudentHome } from "@/components/student-home";
import { Card, EmptyState, StatusLine, Steps } from "@/components/ui";
import { getHome, homeRedirect, type HouseholdHome } from "@/lib/m2-client";

const HOW_IT_WORKS = [
  ["Send a connect email", "Enter your child’s Gmail. The link lasts 7 days."],
  ["Your child accepts", "They sign in or create a student account, then accept the link."],
  ["Learn together", "Their guides show up on your home and on theirs."],
] as const;

export function HomeScreen() {
  return (
    <AccountGate page="home">
      {(me, retry) =>
        me.role === "student" ? (
          me.has_main_parent && me.first_name?.trim() ? (
            <StudentHome firstName={me.first_name} retry={retry} />
          ) : null
        ) : (
          <ParentHome account={{ name: me.first_name?.trim() ?? "", role: "parent" }} />
        )
      }
    </AccountGate>
  );
}

function ParentHome({ account }: { account: Account }) {
  const [home, setHome] = useState<HouseholdHome | null>(null);
  const [phase, setPhase] = useState<"loading" | "error" | "ready" | "redirecting">("loading");
  const [attempt, setAttempt] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setPhase("loading"); setHome(null);
    void (async () => {
      const result = await getHome();
      if (cancelled) return;
      const next = homeRedirect(result);
      if (next) { setPhase("redirecting"); window.location.replace(next); return; }
      if (!result.ok) { setPhase("error"); return; }
      if (result.data.role !== "parent") {
        setPhase("redirecting");
        window.location.replace(result.data.needs_parent ? "/wait" : "/home"); return;
      }
      setHome(result.data); setPhase("ready");
    })();
    return () => { cancelled = true; };
  }, [attempt]);

  // Invite 401: no private copy is left on screen before /login opens.
  if (leaving) return <HomeSkeleton />;
  if (phase === "error") {
    return (
      <AppShell account={account}>
        <section className="card stack">
          <StatusLine tone="error">We could not open your home. Try again.</StatusLine>
          <button type="button" className="button-primary" autoFocus onClick={() => setAttempt((v) => v + 1)}>Try again</button>
        </section>
      </AppShell>
    );
  }
  if (phase !== "ready" || !home) return <HomeSkeleton account={account} />;

  const linked = home.children.length > 0;
  const rail = (
    <Card id="how-title" title="How Lumio works">
      <LumiImage pose="lumi-star" alt="" size="sm" className="card-art" />
      <Steps items={HOW_IT_WORKS} />
    </Card>
  );
  return (
    <AppShell account={account} rail={rail}>
      <HeroCard
        title={<Greeting name={home.first_name} />}
        sub={linked ? "Here’s your family in Lumio." : "Let’s connect your child’s account."}
        actions={linked ? null : <a className="button-primary" href="#invite-title">Connect your child<ArrowRightIcon /></a>}
        pose="lumi-welcome"
        alt={LUMI_ALT["lumi-welcome"]}
      />
      {linked ? (
        <section className="children" aria-labelledby="children-title">
          <h2 id="children-title" className="section-title">Your children</h2>
          <ul className="linked-children">
            {home.children.map((child) => (
              <li key={child.id} className="card child-card">
                <div className="child-head">
                  <span className="avatar"><StudentIcon /></span>
                  <h3 className="child-name">{child.first_name}</h3>
                  <span className="status-tag"><CheckIcon size={16} />Connected</span>
                </div>
                <p className="muted">Guides</p>
                {child.official_cards.length ? <CourseGroups compact cards={child.official_cards} /> : (
                  <p className="muted">No guides are listed for {child.first_name} yet.</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card">
          <EmptyState pose="lumi-hello" alt={LUMI_ALT["lumi-hello"]} title="No child is linked yet." level={2}>
            <p>Send a connect email below. When your child accepts it, they’ll show up here with their guides.</p>
          </EmptyState>
        </section>
      )}
      <InviteCard onSignedOut={() => setLeaving(true)} />
    </AppShell>
  );
}
