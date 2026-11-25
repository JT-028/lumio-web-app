import type { Metadata } from "next";

export const metadata: Metadata = { title: "Taking a short rest — Lumio", referrer: "no-referrer", robots: { index: false, follow: false } };

// Must stay static with no auth or data calls: middleware sends users here when the provider is down.
export default function Page() {
  return (
    <main className="recovery-page">
      <section className="recovery-card stack">
        <h1>Taking a short rest</h1>
        <p>Lumio is taking a short rest. Please try again in a moment.</p>
        <a className="button-primary" href="/home">Try again</a>
      </section>
    </main>
  );
}
