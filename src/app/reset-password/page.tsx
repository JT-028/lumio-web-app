import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = { title: "Choose a new password — Lumio", referrer: "no-referrer", robots: { index: false, follow: false } };

export default function Page() { return <AuthScreen key="reset-password" mode="reset-password" />; }
