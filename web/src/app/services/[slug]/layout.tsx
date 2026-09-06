import type { Metadata } from "next";
import { getServicesData } from "@/lib/servicesData";

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const service = getServicesData("en")[params.slug];
  if (!service) {
    return {
      title: "Digital Solutions",
      description: "Digital services and solutions by Agapitos Kalafatas.",
    };
  }
  return {
    title: service.heroTitle,
    description: service.heroSubtitle,
    alternates: { canonical: `/services/${params.slug}` },
  };
}

export default function ServiceDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}