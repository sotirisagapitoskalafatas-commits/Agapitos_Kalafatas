import type { Metadata } from "next";
import "@/styles/globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AtlasAgenticWidget from "@/components/AtlasAgenticWidget";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Agapitos Kalafatas | AI & Innovation Hub",
  description:
    "Full-Stack SaaS Architect & Digital Operations Strategist. AI-powered software engineering, intelligent systems, and predictive analytics.",
  keywords: [
    "AI architect",
    "full-stack SaaS",
    "digital operations",
    "Agapitos Kalafatas",
    "AI innovation",
    "RED-AI",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>
          <SmoothScroll>
            {children}
          </SmoothScroll>
          <AtlasAgenticWidget />
        </LanguageProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
