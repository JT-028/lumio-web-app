import type { Metadata } from "next";
import "./globals.css";
import { AuthFlowProvider } from "@/components/auth-flow";

export const metadata: Metadata = {
  title: "Lumio",
  description: "Grade 6 study for a student and a parent.",
  // Opt in to OS text scaling: every size is in rem and the root font size is never set.
  other: { "text-scale": "scale" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body><AuthFlowProvider>{children}</AuthFlowProvider></body>
    </html>
  );
}
