import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atlas - AI Agent",
  description:
    "Chat with Atlas, the AI assistant of Agapitos Kalafatas. Ask about technology services (e-shops, websites, SaaS, AI agents), energy (electricity, gas, photovoltaics, EV charging), and insurance (life, health, car, home).",
  alternates: { canonical: "/chat" },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}