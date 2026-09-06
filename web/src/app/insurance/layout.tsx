import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insurance Solutions",
  description:
    "Complete health (BEWELL), home and auto insurance with personalized guidance and guaranteed better coverage.",
  alternates: { canonical: "/insurance" },
};

export default function InsuranceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}