import type { Metadata } from "next";
import { ConnectRoute } from "@/components/connect-screen";

export const metadata: Metadata = {
  title: "Connect — Lumio",
  referrer: "no-referrer",
};

export default function Page() {
  return <ConnectRoute />;
}
