"use client";

import { useEffect, useState } from "react";
import { AuthBrand, LumiArt } from "@/components/auth-frame";
import { readAuthContext } from "@/lib/auth-client";

export function Landing() {
  const [next, setNext] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void readAuthContext().then(({ context }) => {
      if (active && context.authenticated) setNext(context.next);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  return <div className="recovery-page">
    <header className="recovery-header"><AuthBrand /><nav aria-label="Account"><a href={next ?? "/login"}>{next ? "Continue to Lumio" : "Sign in"}</a></nav></header>
    <main className="public-landing">
      <section className="stack" aria-labelledby="landing-title">
        <p className="recovery-eyebrow">A little support. A bright beginning.</p>
        <h1 id="landing-title">Grade 6 starts with family.</h1>
        <p className="landing-intro">Lumio is a space for Grade 6 students and their parents.</p>
        <p>Create your own account as a parent or student. A parent sends an invitation, and the student reviews it before connecting.</p>
        <p>Students need a parent connection before entering the study area.</p>
        <div className="recovery-actions">{next ? <a className="button-primary" href={next}>Continue to Lumio</a> : <><a className="button-primary" href="/signup">Create account</a><a className="button-quiet" href="/login">Sign in</a></>}</div>
      </section>
      <LumiArt />
    </main>
  </div>;
}
