import type { Metadata } from "next";
import { HomeScreen } from "@/components/home-screen";

export const metadata: Metadata = {
  title: "Home \u2014 Lumio",
};

export default function Page() {
  return <HomeScreen />;
}