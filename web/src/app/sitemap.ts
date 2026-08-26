import { MetadataRoute } from "next";

const BASE_URL = "https://agapitoskalafatas.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/services`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/energy`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/insurance`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/chat`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
  ];

  const serviceSlugs = [
    "web-development",
    "eshop-development",
    "ux-ui-branding",
    "digital-marketing",
    "web-mobile-apps",
    "hosting-support",
    "custom-integrations",
  ];

  const servicePages = serviceSlugs.map((slug) => ({
    url: `${BASE_URL}/services/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...servicePages];
}
