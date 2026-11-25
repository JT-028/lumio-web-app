import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = { title: "Confirm your email — Lumio", referrer: "no-referrer", robots: { index: false, follow: false } };

export default function Page() { return <AuthScreen key="confirm-email" mode="confirm-email" />; }
