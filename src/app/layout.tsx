import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrowthPilot | Find what's costing your business customers",
  description: "AI-powered growth audits for local businesses. Discover your biggest opportunities to generate more leads.",
  openGraph: { title: "GrowthPilot", description: "Find what's costing your business customers.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
