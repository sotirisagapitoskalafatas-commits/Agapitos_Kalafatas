import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personal Energy Advisor",
  description:
    "Compare and find the cheapest energy provider in Greece - free. Complete energy solutions for home and business, all over Greece.",
  alternates: { canonical: "/energy" },
};

export default function EnergyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}