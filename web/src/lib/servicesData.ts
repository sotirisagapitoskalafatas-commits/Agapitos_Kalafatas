import en from "../../messages/en.json";
import el from "../../messages/el.json";
import fr from "../../messages/fr.json";

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

export interface ServiceDetail {
  slug: string;
  icon: string;
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  whyTitle: string;
  whyText: string;
  benefits: { title: string; desc: string }[];
  offerings: { title: string; items: string[] }[];
  pricing?: PricingTier[];
  audience: string[];
  faqs: { q: string; a: string }[];
  ctaTitle: string;
  ctaDesc: string;
}

type ServiceDataMap = Record<string, ServiceDetail>;

export type Locale = "en" | "el" | "fr";

const serviceDataByLocale: Record<Locale, ServiceDataMap | undefined> = {
  en: en.serviceData,
  el: el.serviceData,
  fr: fr.serviceData,
};

export function getServicesData(locale: string): ServiceDataMap {
  const data = serviceDataByLocale[locale as Locale];
  if (data) {
    return data;
  }
  return en.serviceData;
}

export function getServicesList(locale: string): ServiceDetail[] {
  const data = getServicesData(locale);
  return Object.values(data);
}

export const servicesData: ServiceDataMap = en.serviceData;
export const servicesList: ServiceDetail[] = Object.values(en.serviceData);
