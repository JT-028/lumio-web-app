import type { Metadata } from "next";
import { WaitScreen } from "@/components/wait-screen";

export const metadata: Metadata = {
  title: "Waiting for a parent \u2014 Lumio",
};

export default function Page() {
  return <WaitScreen />;
}
