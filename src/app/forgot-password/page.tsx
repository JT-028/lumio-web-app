import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = { title: "Forgot your password? — Lumio", referrer: "no-referrer", robots: { index: false, follow: false } };

export default function Page() { return <AuthScreen key="forgot-password" mode="forgot-password" />; }
