import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketing Knowledge & Strategy Notes",
  description:
    "Actionable marketing playbooks: copywriting, sales letters, email marketing, Facebook ads, lead magnets and funnels.",
  alternates: { canonical: "/marketing" },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}