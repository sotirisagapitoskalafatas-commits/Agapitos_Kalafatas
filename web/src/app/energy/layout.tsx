import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Athens Innovation Hub — Personal Energy Advisor",
  description:
    "Your personal energy advisor, face to face. Free energy comparison for home and business — Electricity, Gas, Solar, E-Mobility, Storage and Savings, all over Greece.",
  alternates: { canonical: "/energy" },
};

export default function EnergyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}