"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Users,
  Zap,
  Shield,
  Clock,
  BarChart3,
  Phone,
  MessageSquare,
  Mail,
} from "lucide-react";
import { getServicesData, getServicesList } from "@/lib/servicesData";
import Navbar from "@/components/Navbar";
import CinematicSkyBackground from "@/components/CinematicSkyBackground";
import Service3DCard, { themeBySlug } from "@/components/Service3DCard";
import { useLocale } from "@/contexts/LanguageContext";

interface PageProps {
  params: { slug: string };
}

export default function ServiceDetailPage({ params }: PageProps) {
  const { t, locale } = useLocale();
  const tD = t.serviceDetailPage || {};
  const servicesData = getServicesData(locale);
  const servicesList = getServicesList(locale);
  const { slug } = params;
  const service = servicesData[slug];

  if (!service) {
    notFound();
    return null;
  }

  const theme = themeBySlug[slug] || themeBySlug["web-development"];

  return (
    <>
      <CinematicSkyBackground pushScreens={1.5} mistIntensity={0.6} />
      <Navbar />
      <main className="relative z-10 min-h-screen text-slate-100">
        {/* Back Link */}
        <div className="pt-24">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm text-slate-300/80 hover:text-white transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {tD.allServices}
            </Link>
          </div>
        </div>

        {/* Hero */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div
              className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-white/15 bg-white/5 backdrop-blur ${theme.text}`}
            >
              <Zap className="w-3.5 h-3.5" />
              {t.servicesPage?.badge || "Agapitos Kalafatas"}
            </div>
            <h1
              className="text-4xl md:text-6xl font-light leading-tight mb-6 text-white"
              style={{ color: "white" }}
            >
              {service.heroTitle}
            </h1>
            <p className="text-slate-300/85 text-lg max-w-2xl mx-auto leading-relaxed mb-4 font-light">
              {service.heroSubtitle}
            </p>
            <p className={`font-semibold text-sm tracking-wide ${theme.text}`}>
              {service.heroTagline}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg text-sm bg-white/10 border border-white/20 hover:bg-white/20"
              >
                {tD.requestFreeEstimate}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="tel:+306977691776"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-4 rounded-xl transition-all border border-white/15 text-sm"
              >
                <Phone className="w-4 h-4" />
                +30 697 769 1776
              </a>
            </div>
          </div>
        </section>

        {/* Why -- themed glass card */}
        <section className="py-16 max-w-6xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 md:p-12">
            <div
              className="pointer-events-none absolute -inset-6 opacity-40 blur-3xl"
              style={{ background: `radial-gradient(circle at 20% 20%, ${theme.aura}, transparent 70%)` }}
            />
            <div className="relative flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl border border-white/10 bg-white/10 ${theme.chipBg} flex items-center justify-center flex-shrink-0`}
              >
                <BarChart3 className={`w-6 h-6 ${theme.text}`} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-light text-white mb-3">
                  {service.whyTitle}
                </h2>
                <p className="text-slate-300/80 leading-relaxed font-light">
                  {service.whyText}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits grid */}
        <section className="py-16 max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-light mb-3 text-white">
            {tD.keyFeatures}
          </h2>
          <p className="text-slate-400 mb-10 font-light">{tD.keyFeaturesSub}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.benefits.map((benefit, i) => (
              <div
                key={i}
                className="relative p-6 rounded-xl border border-slate-300/15 bg-white/[0.04] backdrop-blur-md hover:border-slate-300/40 hover:shadow-xl transition-all overflow-hidden"
              >
                <div
                  className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 hover:opacity-100"
                  style={{ background: theme.aura }}
                />
                <div className="flex items-start gap-3">
                  <CheckCircle className={`w-5 h-5 ${theme.text} mt-0.5 flex-shrink-0`} />
                  <div>
                    <h3 className="font-medium text-white mb-1">{benefit.title}</h3>
                    <p className="text-sm text-slate-300/75 leading-relaxed font-light">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What's Included */}
        <section className="py-16 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-light mb-3 text-white">
              {tD.whatsIncluded}
            </h2>
            <p className="text-slate-400 mb-8 font-light">{tD.whatsIncludedSub}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.offerings[0]?.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur"
                >
                  <div
                    className={`w-6 h-6 ${theme.chipBg} rounded-full flex items-center justify-center flex-shrink-0 border border-white/10`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        {service.pricing && service.pricing.length > 0 && (
          <section className="py-16 max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-light mb-3 text-white">
              {tD.pricing}
            </h2>
            <p className="text-slate-400 mb-10 font-light">{tD.pricingSub}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.pricing.map((tier, i) => (
                <div
                  key={i}
                  className={`relative p-6 rounded-2xl border backdrop-blur-md transition-all overflow-hidden ${
                    tier.highlight
                      ? "border-white/25 bg-white/[0.08] shadow-xl"
                      : "border-slate-300/15 bg-white/[0.04] hover:border-slate-300/40"
                  }`}
                >
                  {tier.highlight && (
                    <div
                      className={`text-xs font-bold ${theme.text} px-3 py-1 rounded-full inline-block mb-4 border border-white/15 ${theme.chipBg}`}
                    >
                      {tD.mostPopular}
                    </div>
                  )}
                  <h3 className="text-lg font-medium text-white mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-extrabold text-white">€{tier.price}</span>
                    {tier.period && (
                      <span className="text-sm text-slate-400">{tier.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300/75 mb-6 font-light">
                    {tier.description}
                  </p>
                  <ul className="space-y-3">
                    {tier.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <CheckCircle className={`w-4 h-4 ${theme.text} mt-0.5 flex-shrink-0`} />
                        <span className="text-sm text-slate-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className={`mt-6 block text-center py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      tier.highlight
                        ? "bg-white/15 hover:bg-white/25 text-white"
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    }`}
                  >
                    {tD.requestQuote}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Target Audience */}
        <section className="py-16 max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-light mb-3 text-white">
            {tD.targetAudience}
          </h2>
          <p className="text-slate-400 mb-8 font-light">{tD.targetAudienceSub}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {service.audience.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-5 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur"
              >
                <Users className={`w-5 h-5 ${theme.text} flex-shrink-0`} />
                <span className="text-sm font-medium text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-light mb-8 text-white">{tD.faq}</h2>
            <div className="space-y-4">
              {service.faqs.map((faq, i) => (
                <details
                  key={i}
                  className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden group backdrop-blur"
                >
                  <summary className="p-6 cursor-pointer font-medium text-slate-100 list-none flex justify-between items-center hover:text-white transition-colors">
                    {faq.q}
                    <span
                      className="text-slate-400 group-open:rotate-45 transition-transform text-xl"
                      style={{ color: theme.accent }}
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-slate-300/75 text-sm leading-relaxed border-t border-white/10 pt-4 font-light">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Related services -- 3D themed cards */}
        <section className="py-16 max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-light mb-8 text-white">
            {tD.otherServices}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesList
              .filter((s) => s.slug !== slug)
              .slice(0, 3)
              .map((s) => (
                <Service3DCard
                  key={s.slug}
                  slug={s.slug}
                  title={s.heroTitle.split(" ").slice(0, 4).join(" ")}
                  description={s.heroSubtitle}
                  learnMore={tD.learnMore}
                  size="sm"
                />
              ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 text-center relative">
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-40 blur-3xl"
              style={{ background: `radial-gradient(circle at 50% 50%, ${theme.aura}, transparent 70%)` }}
            />
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className={`w-8 h-8 ${theme.text}`} />
              <Clock className={`w-8 h-8 ${theme.text}`} />
            </div>
            <h2 className="text-3xl md:text-4xl font-light mb-4 text-white">{service.ctaTitle}</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto font-light">
              {service.ctaDesc}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-8 py-4 rounded-xl transition-all border border-white/20"
              >
                <Mail className="w-4 h-4" />
                {tD.requestFreeEstimate}
              </Link>
              <a
                href="tel:+306977691776"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-4 rounded-xl transition-all border border-white/15"
              >
                <Phone className="w-4 h-4" />
                +30 697 769 1776
              </a>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg bg-white/10 border border-white/20 hover:bg-white/20"
              >
                <MessageSquare className="w-4 h-4" />
                {tD.requestHelp}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
