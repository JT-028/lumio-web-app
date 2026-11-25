import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = { title: "Create account — Lumio", referrer: "no-referrer", robots: { index: false, follow: false } };

export default function Page() { return <AuthScreen key="signup" mode="signup" />; }
