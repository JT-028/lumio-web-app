"use client";

import { useEffect, useState } from "react";
import { AppShell, HomeSkeleton } from "@/components/app-shell";
import { CourseGroups } from "@/components/guides";
import { Greeting, HeroCard } from "@/components/hero-card";
import { CheckIcon } from "@/components/icons";
import { LUMI_ALT, LumiImage } from "@/components/lumi-image";
import { Card, EmptyState, StatusLine } from "@/components/ui";
import { getHome, homeRedirect, type HomeCard } from "@/lib/m2-client";

type Phase = { kind: "loading" | "redirecting" | "error" } | { kind: "ready"; cards: HomeCard[] };

const TIPS = [
  "Study a little at a time, then take a short break.",
  "Read each question twice before you answer.",
  "Mistakes help you learn. Take a breath and try again.",
] as const;

/** Linked student home: reads /api/home after /api/me and shows children[0]'s guides. */
export function StudentHome({ firstName, retry }: { firstName: string; retry: () => void }) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const account = { name: firstName.trim(), role: "student" } as const;

  useEffect(() => {
    let cancelled = false;
    void getHome().then((result) => {
      if (cancelled) return;
      const next = homeRedirect(result);
      if (next) { setPhase({ kind: "redirecting" }); window.location.replace(next); return; }
      if (!result.ok) { setPhase({ kind: "error" }); return; }
      const { role, needs_parent, children } = result.data;
      // Anything but one linked library keeps today's gate (Aria amendment).
      if (role !== "student" || needs_parent || children.length !== 1) {
        setPhase({ kind: "redirecting" }); window.location.replace("/wait"); return;
      }
      setPhase({ kind: "ready", cards: children[0]!.official_cards });
    });
    return () => { cancelled = true; };
  }, []);

  if (phase.kind === "error") {
    return (
      <AppShell account={account}>
        <section className="card stack">
          <StatusLine tone="error">We could not open your home. Try again.</StatusLine>
          <button type="button" className="button-primary" autoFocus onClick={retry}>Try again</button>
        </section>
      </AppShell>
    );
  }
  if (phase.kind !== "ready") return <HomeSkeleton account={account} />;

  const rail = (
    <>
      <Card id="family-title" title="Your family">
        <div className="family-line">
          <span className="family-badge"><CheckIcon /></span>
          <div>
            <p>You’re connected to a parent.</p>
            <p className="muted">Your parent can see your guides too.</p>
          </div>
        </div>
      </Card>
      <Card id="tip-title" title="Lumi’s tip" tone="tip">
        <div className="tip-body">
          <LumiImage pose="lumi-idea" alt="" size="sm" />
          <ul className="tips">{TIPS.map((tip) => <li key={tip}>{tip}</li>)}</ul>
        </div>
      </Card>
    </>
  );

  return (
    <AppShell account={account} rail={rail}>
      <HeroCard
        title={<Greeting name={firstName} />}
        sub="Hi, I'm Lumi. Ready to discover something new?"
        pose="lumi-wave"
        alt={LUMI_ALT["lumi-wave"]}
      />
      <section className="card guides" aria-labelledby="guides-title">
        <h2 id="guides-title" className="card-title">Your guides</h2>
        <p>These are your guides for this school year. You can’t open them yet. Lumi is getting them ready.</p>
        <p className="muted">Inside each guide: Flashcards, Concepts, Step-by-Step Solver, Tutor, Cheat Sheet and Practice Sets.</p>
        {phase.cards.length ? <CourseGroups cards={phase.cards} /> : (
          <EmptyState pose="lumi-calm" alt={LUMI_ALT["lumi-calm"]} title="No guides here yet">
            <p>Your guides will show up here when they’re ready.</p>
          </EmptyState>
        )}
      </section>
    </AppShell>
  );
}
