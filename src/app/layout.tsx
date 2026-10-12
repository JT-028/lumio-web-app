import type { Metadata } from "next";
import { atkinson, atkinsonExt, fraunces, frauncesExt } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumio",
  description: "Grade 6 study for a student and a parent.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${frauncesExt.variable} ${atkinson.variable} ${atkinsonExt.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
