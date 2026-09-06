import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a quote for energy solutions, SaaS development, AI systems and insurance services. We will contact you shortly.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}