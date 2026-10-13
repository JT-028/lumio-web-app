import type { Metadata } from "next";
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
