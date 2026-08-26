export default function JsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Agapitos Kalafatas - AI Innovation Hub",
    url: "https://agapitoskalafatas.vercel.app",
    logo: "https://agapitoskalafatas.vercel.app/logo.png",
    description:
      "Full-Stack SaaS Architect & Digital Operations Strategist. AI-powered software engineering, intelligent systems, and predictive analytics.",
    founder: {
      "@type": "Person",
      name: "Agapitos Kalafatas",
      jobTitle: "Full-Stack SaaS Architect & AI Innovation Strategist",
      url: "https://www.linkedin.com/in/agapitos-kalafatas-red-ai/",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+30-697-769-1776",
      contactType: "customer service",
      email: "kalafatasagapitos@gmail.com",
    },
    sameAs: ["https://www.linkedin.com/in/agapitos-kalafatas-red-ai/"],
  };

  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Atlas AI - Agentic AI Assistant",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered agentic assistant for digital transformation, CRM, and business automation.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    author: {
      "@type": "Person",
      name: "Agapitos Kalafatas",
    },
  };

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Agapitos Kalafatas - Digital Solutions",
    image: "https://agapitoskalafatas.vercel.app/og-image.png",
    url: "https://agapitoskalafatas.vercel.app",
    telephone: "+30-697-769-1776",
    email: "kalafatasagapitos@gmail.com",
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      addressCountry: "GR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 37.9838,
      longitude: 23.7275,
    },
    areaServed: {
      "@type": "Country",
      name: "Greece",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Digital Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Custom Website Development",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "E-shop Development",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Custom Software Development",
          },
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
    </>
  );
}
