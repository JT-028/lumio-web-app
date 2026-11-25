import type { Metadata } from "next";
import { FocusFrame } from "@/components/frame";
import { LUMI_ALT, LumiImage } from "@/components/lumi-image";

export const metadata: Metadata = { title: "Taking a short rest — Lumio", referrer: "no-referrer", robots: { index: false, follow: false } };

// Must stay static with no auth or data calls: middleware sends users here when the provider is down.
export default function Page() {
  return (
    <FocusFrame center>
      <LumiImage pose="lumi-sleep" alt={LUMI_ALT["lumi-sleep"]} size="md" />
      <h1 className="page-title">Taking a short rest</h1>
      <p>Lumio is taking a short rest. Please try again in a moment.</p>
      <a className="button-primary" href="/home">Try again</a>
    </FocusFrame>
  );
}
