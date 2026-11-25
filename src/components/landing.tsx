"use client";

import { useEffect, useState } from "react";
import { HeroCard } from "@/components/hero-card";
import { ArrowRightIcon } from "@/components/icons";
import { LUMI_ALT } from "@/components/lumi-image";
import { BrandBlock, Card, SkipLink, Steps } from "@/components/ui";
import { readAuthContext } from "@/lib/auth-client";

const STEPS = [
  ["Make your own account", "A parent and a student each sign up, as Parent or Student."],
  ["A parent sends a connect email", "The parent sends one link to the student's Gmail."],
  ["The student accepts, then studies", "Students start studying after they accept a parent's link."],
] as const;

export function Landing() {
  const [next, setNext] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void readAuthContext().then(({ context }) => {
      if (active && context.authenticated) setNext(context.next);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <div className="public-page">
      <SkipLink />
      <header className="public-header">
        <BrandBlock linked />
        <nav aria-label="Account">
          <a className="button-secondary" href={next ?? "/login"}>{next ? "Continue to Lumio" : "Sign in"}</a>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="public-main">
        <HeroCard
          landing
          eyebrow="A little support. A bright beginning."
          title="Grade 6 starts with family."
          sub="Lumio is a calm study space for a Grade 6 student and their parent."
          actions={next ? <a className="button-primary" href={next}>Continue to Lumio</a> : <>
            <a className="button-primary" href="/signup">Create account<ArrowRightIcon /></a>
            <a className="button-secondary" href="/login">Sign in</a>
          </>}
          pose="lumi-hero"
          alt={LUMI_ALT["lumi-hero"]}
        />
        <Card id="how-title" title="How Lumio works">
          <Steps items={STEPS} />
        </Card>
      </main>
    </div>
  );
}
