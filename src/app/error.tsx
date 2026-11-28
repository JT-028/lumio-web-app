"use client";

import { useEffect, useRef } from "react";
import { FocusFrame } from "@/components/frame";
import { LUMI_ALT, LumiImage } from "@/components/lumi-image";

// Never renders error.message, digest or a stack.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = "Something went wrong — Lumio";
    heading.current?.focus();
  }, []);
  return (
    <FocusFrame center>
      <LumiImage pose="lumi-calm" alt={LUMI_ALT["lumi-calm"]} size="md" />
      <h1 ref={heading} className="page-title" tabIndex={-1}>Something went wrong</h1>
      <p>This page didn’t load properly. Please try again.</p>
      <div className="actions">
        <button type="button" className="button-primary" onClick={() => reset()}>Try again</button>
        <a className="button-secondary" href="/home">Go to home</a>
      </div>
    </FocusFrame>
  );
}
