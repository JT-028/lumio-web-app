import type { ReactNode } from "react";

const heroSrc = new URL("../assets/lumi-hero.png", import.meta.url).href;

export function AuthBrand() {
  return <div className="recovery-brand"><a className="wordmark" href="/">Lumio</a><p className="tagline">Learn. Grow. <span className="level-up">Level Up.</span></p></div>;
}

export function LumiArt() {
  return <aside className="recovery-art"><img src={heroSrc} alt="Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books." /></aside>;
}

export function AuthFrame({ title, helper, children, signup = false }: { title: string; helper?: string; children: ReactNode; signup?: boolean }) {
  return <div className="recovery-page">
    <header className="recovery-header"><AuthBrand /><a href={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create account"}</a></header>
    <main className="recovery-main">
      <section className="recovery-card stack" aria-labelledby="auth-title"><h1 id="auth-title" tabIndex={-1}>{title}</h1>{helper ? <p className="helper">{helper}</p> : null}{children}</section>
      <LumiArt />
    </main>
  </div>;
}
