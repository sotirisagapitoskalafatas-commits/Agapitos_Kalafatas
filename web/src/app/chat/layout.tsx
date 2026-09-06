import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atlas - AI Agent",
  description:
    "Chat with Atlas, the AI agent built by Agapitos Kalafatas. Ask about full-stack architecture, software engineering and AI-driven innovation.",
  alternates: { canonical: "/chat" },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}