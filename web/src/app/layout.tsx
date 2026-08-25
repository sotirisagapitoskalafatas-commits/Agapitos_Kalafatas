import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Atlas AI Agent | Agapitos Kalafatas",
  description:
    "Full-Stack SaaS Architect & Digital Operations Strategist. AI-powered software engineering at your fingertips.",
  keywords: [
    "AI agent",
    "full-stack architect",
    "SaaS",
    "digital operations",
    "Agapitos Kalafatas",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
