import type { Metadata } from "next";
import { Landing } from "@/components/landing";

export const metadata: Metadata = {
  title: "Grade 6 starts with family — Lumio",
};

export default function Page() {
  return <Landing />;
}
