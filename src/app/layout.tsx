import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

export const metadata: Metadata = {
  title: "GrowthPilot | Find What's Holding Your Business Back",
  description: "Get an AI-powered business growth audit, personalized opportunities, and a practical action plan.",
  keywords: ["AI business audit", "business growth audit", "business assessment", "AI business consultant", "business automation audit", "growth strategy"],
  openGraph: { title: "GrowthPilot | Find What's Holding Your Business Back", description: "Get a personalized business growth assessment and action plan.", type: "website" },
  twitter: { card: "summary_large_image", title: "GrowthPilot | Business Growth Audit", description: "Find your biggest growth opportunities." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}<Analytics /></body></html>; }
