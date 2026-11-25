import type { Metadata } from "next";
import { FocusFrame } from "@/components/frame";
import { LUMI_ALT, LumiImage } from "@/components/lumi-image";

export const metadata: Metadata = { title: "Page not found — Lumio", robots: { index: false, follow: false } };

// Static: no status code, path or stack. Middleware sends signed-out visitors from /home to sign-in.
export default function NotFound() {
  return (
    <FocusFrame center>
      <LumiImage pose="lumi-question" alt={LUMI_ALT["lumi-question"]} size="md" />
      <h1 className="page-title">We can’t find that page</h1>
      <p>The link may be old or mistyped.</p>
      <a className="button-primary" href="/home">Go to home</a>
    </FocusFrame>
  );
}
