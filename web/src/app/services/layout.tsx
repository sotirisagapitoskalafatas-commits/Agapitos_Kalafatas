import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Solutions",
  description:
    "From website development to custom software and AI integrations - comprehensive digital solutions for every need.",
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}