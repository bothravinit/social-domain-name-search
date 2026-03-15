import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Namecheck — Check your username across social media",
  description:
    "Instantly check if your username is available on Instagram, TikTok, X, Facebook, YouTube, LinkedIn, Reddit, GitHub, and Pinterest.",
  openGraph: {
    title: "Namecheck",
    description: "Check your username availability across 9 major platforms.",
  },
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
