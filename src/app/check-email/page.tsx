import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = { title: "Check your email — Lumio", referrer: "no-referrer", robots: { index: false, follow: false } };

export default function Page() { return <AuthScreen key="check-email" mode="check-email" />; }
