import type { Metadata } from "next";
import { Landing } from "@/components/landing";

export const metadata: Metadata = {
  title: "Sign in \u2014 Lumio",
};

export default function Page() {
  return <Landing />;
}
