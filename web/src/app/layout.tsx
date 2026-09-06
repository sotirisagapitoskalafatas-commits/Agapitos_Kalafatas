import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AtlasAgenticWidget from "@/components/AtlasAgenticWidget";
import JsonLd from "@/components/JsonLd";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  title: {
    default: "Agapitos Kalafatas | AI & Innovation Hub",
    template: "%s | Agapitos Kalafatas",
  },
  description:
    "Full-Stack SaaS Architect & Digital Operations Strategist. AI-powered software engineering, intelligent systems, and predictive analytics.",
  keywords: [
    "AI architect",
    "full-stack SaaS",
    "digital operations",
    "Agapitos Kalafatas",
    "AI innovation",
    "web development Greece",
    "e-shop development",
    "custom software",
    "ERP integration",
    "CRM automation",
  ],
  metadataBase: new URL("https://agapitoskalafatas.vercel.app"),
  alternates: {
    canonical: "/",
  },
  authors: [{ name: "Agapitos Kalafatas" }],
  creator: "Agapitos Kalafatas",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "el_GR",
    url: "https://agapitoskalafatas.vercel.app",
    siteName: "Agapitos Kalafatas - AI Innovation Hub",
    title: "Agapitos Kalafatas | AI & Innovation Hub",
    description:
      "Full-Stack SaaS Architect & Digital Operations Strategist. AI-powered software engineering, intelligent systems, and predictive analytics.",
    images: [
      {
        url: "https://agapitoskalafatas.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Agapitos Kalafatas - AI Innovation Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agapitos Kalafatas | AI & Innovation Hub",
    description:
      "Full-Stack SaaS Architect & Digital Operations Strategist.",
    images: ["https://agapitoskalafatas.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <JsonLd />
      </head>
      <body className="antialiased">
        <GoogleAnalytics />
        <LanguageProvider>
          <SmoothScroll>
            {children}
          </SmoothScroll>
          <AtlasAgenticWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
