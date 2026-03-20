import type { Metadata } from "next";
import "./globals.css";
import { Agentation } from "agentation";

export const metadata: Metadata = {
  title: "Social Handle Check — Check your username across social media",
  description:
    "Instantly check if your username is available on Instagram, TikTok, X, Facebook, YouTube, LinkedIn, Reddit, GitHub, and Pinterest.",
  openGraph: {
    title: "Social Handle Check",
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
      <body>
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
