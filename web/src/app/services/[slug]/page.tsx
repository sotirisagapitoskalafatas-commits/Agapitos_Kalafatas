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
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
      {/* Back Link */}
      <div className="bg-slate-50 border-b border-slate-200 pt-24">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {tD.allServices}
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-blue-500/20">
            <Zap className="w-3.5 h-3.5" />
            {t.servicesPage?.badge || "Agapitos Kalafatas"}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            {service.heroTitle}
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed mb-4">
            {service.heroSubtitle}
          </p>
          <p className="text-blue-400 font-semibold text-sm tracking-wide">
            {service.heroTagline}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/25 text-sm"
            >
              {tD.requestFreeEstimate}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:+306977691776"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition-all border border-white/20 text-sm"
            >
              <Phone className="w-4 h-4" />
              +30 697 769 1776
            </a>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 md:p-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                {service.whyTitle}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {service.whyText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-3 text-slate-900">
          {tD.keyFeatures}
        </h2>
        <p className="text-slate-500 mb-10">
          {tD.keyFeaturesSub}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {service.benefits.map((benefit, i) => (
            <div
              key={i}
              className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3 text-slate-900">
            {tD.whatsIncluded}
          </h2>
          <p className="text-slate-500 mb-8">
            {tD.whatsIncludedSub}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.offerings[0]?.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200"
              >
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {service.pricing && service.pricing.length > 0 && (
        <section className="py-16 max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3 text-slate-900">
            {tD.pricing}
          </h2>
          <p className="text-slate-500 mb-10">
            {tD.pricingSub}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.pricing.map((tier, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  tier.highlight
                    ? "border-blue-600 bg-blue-50 shadow-lg shadow-blue-600/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {tier.highlight && (
                  <div className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full inline-block mb-4">
                    {tD.mostPopular}
                  </div>
                )}
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-slate-900">
                    €{tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-sm text-slate-500">{tier.period}</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-6">{tier.description}</p>
                <ul className="space-y-3">
                  {tier.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={`mt-6 block text-center py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                    tier.highlight
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900"
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
        <h2 className="text-2xl font-bold mb-3 text-slate-900">
          {tD.targetAudience}
        </h2>
        <p className="text-slate-500 mb-8">
          {tD.targetAudienceSub}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {service.audience.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-5 bg-white rounded-xl border border-slate-200 shadow-sm"
            >
              <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-700">
                {item}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Service-specific FAQ */}
      <section className="py-16 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-slate-900">
            {tD.faq}
          </h2>
          <div className="space-y-4">
            {service.faqs.map((faq, i) => (
              <details
                key={i}
                className="bg-white border border-slate-200/80 rounded-xl overflow-hidden group"
              >
                <summary className="p-6 cursor-pointer font-bold text-slate-900 list-none flex justify-between items-center hover:text-blue-600 transition-colors">
                  {faq.q}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-xl">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-slate-900">
          {tD.otherServices}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicesList
            .filter((s) => s.slug !== slug)
            .slice(0, 3)
            .map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="text-2xl mb-2">{s.icon}</div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                  {s.heroTitle.split(" ").slice(0, 4).join(" ")}...
                </h3>
                <div className="flex items-center text-xs font-semibold text-blue-600 mt-3 group-hover:translate-x-1 transition-transform">
                  {tD.learnMore} &rarr;
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-400" />
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-extrabold mb-4">
            {service.ctaTitle}
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            {service.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/25"
            >
              <Mail className="w-4 h-4" />
              {tD.requestFreeEstimate}
            </Link>
            <a
              href="tel:+306977691776"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition-all border border-white/20"
            >
              <Phone className="w-4 h-4" />
              +30 697 769 1776
            </a>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/25"
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
