import type { ReactNode } from "react";
import type { Mode } from "@/components/auth/use-auth";
import { CloudDecor, SparkleDecor } from "@/components/icons";
import { LUMI_ALT, LumiImage, type MeaningfulPose } from "@/components/lumi-image";
import { BrandBlock, SkipLink } from "@/components/ui";

const ART: Record<Mode, { pose: MeaningfulPose; peek: MeaningfulPose; welcome: string }> = {
  login: { pose: "lumi-hero", peek: "lumi-wave", welcome: "Good to see you again." },
  signup: { pose: "lumi-hero", peek: "lumi-wave", welcome: "Let's set up your Lumio." },
  "forgot-password": { pose: "lumi-think", peek: "lumi-think", welcome: "It happens to everyone." },
  "check-email": { pose: "lumi-calm", peek: "lumi-calm", welcome: "Look out for an email from Lumio." },
  "reset-password": { pose: "lumi-idea", peek: "lumi-idea", welcome: "Almost done." },
  "confirm-email": { pose: "lumi-thumbs-up", peek: "lumi-thumbs-up", welcome: "One quick step." },
};

export function AuthBrand() {
  return <BrandBlock linked />;
}

/**
 * The auth card: the form panel always comes before every image in the DOM.
 * Below 960px the art sits above the card as a small peek; at 960px and up it
 * is the sky panel on the right with a one-line welcome.
 */
export function AuthLayout({ mode, title, helper, children }: { mode: Mode; title: string; helper?: string; children: ReactNode }) {
  const art = ART[mode];
  // Only one of the two images is displayed at a time; the hidden one is lazy and not fetched.
  const peekAlt = art.peek === art.pose ? LUMI_ALT[art.peek] : "";
  return (
    <div className="auth-page">
      <SkipLink />
      <header className="public-header">
        <AuthBrand />
        {mode === "login" ? <a className="button-quiet" href="/signup">Create account</a> : <a className="button-quiet" href="/login">Sign in</a>}
      </header>
      <main id="main" tabIndex={-1} className="auth-main">
        <div className="auth-split">
          <section className="auth-panel" aria-labelledby="auth-title">
            <h1 id="auth-title" tabIndex={-1}>{title}</h1>
            {helper ? <p className="auth-helper">{helper}</p> : null}
            {children}
          </section>
          <aside className="auth-art">
            <CloudDecor className="decor decor-cloud decor-cloud-1" />
            <CloudDecor className="decor decor-cloud decor-cloud-2" />
            <SparkleDecor className="decor decor-sparkle decor-sparkle-1" />
            <SparkleDecor className="decor decor-sparkle decor-sparkle-2" />
            <LumiImage pose={art.pose} alt={LUMI_ALT[art.pose]} size="lg" className="auth-art-full" />
            <LumiImage pose={art.peek} alt={peekAlt} size="peek" className="auth-art-peek" />
            <p className="auth-welcome">{art.welcome}</p>
          </aside>
        </div>
      </main>
    </div>
  );
}
