"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
import {
  Zap,
  Flame,
  Sun,
  Car,
  BatteryCharging,
  TrendingDown,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Upload,
  ArrowRight,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

const iconMap: Record<string, React.ElementType> = {
  Electricity: Zap,
  Gas: Flame,
  Solar: Sun,
  "E-Mobility": Car,
  "Energy Storage": BatteryCharging,
  "Energy Savings": TrendingDown,
};

const services = [
  {
    title: "Electricity",
    desc: "Cheap energy plans made for you. We compare providers and find the most cost-effective solution.",
  },
  {
    title: "Gas",
    desc: "Tailored natural gas solutions for home and business with the best pricing plans.",
  },
  {
    title: "Solar (Photovoltaic)",
    desc: "Innovation and sustainable development for your space. Invest in green energy safely.",
  },
  {
    title: "E-Mobility",
    desc: "We drive ecologically, we move electrically. Charging and EV solutions for every need.",
  },
  {
    title: "Energy Storage",
    desc: "Battery storage solutions for autonomy and savings.",
  },
  {
    title: "Energy Savings",
    desc: "Consumption analysis and strategies to reduce your electricity bill.",
  },
];

const faqs = [
  {
    q: "Is the service free?",
    a: "Yes, our service is completely free, with no hidden charges. We are compensated by the providers, not by you.",
  },
  {
    q: "How does switching provider work?",
    a: "You sign the new contract with your chosen provider — online or in person. They take care of the notification, the meter reading and the transfer, while we guide you at every step.",
  },
  {
    q: "Do I have to pay to switch?",
    a: "No. Switching is completely free of charge and without penalties — you only pay the new provider according to your new plan.",
  },
  {
    q: "How long does it take?",
    a: "Typically 1 to 2 weeks from the moment your new contract is activated, depending on the provider and the time of year.",
  },
  {
    q: "Can the power be cut off?",
    a: "No. The transition is seamless — supply is never interrupted between the old and the new provider.",
  },
];

const trust = [
  {
    value: "100% Free",
    desc: "Our service is completely free, with no hidden charges.",
  },
  {
    value: "Immediate Service",
    desc: "Contact within hours from your personal advisor.",
  },
  {
    value: "Tailored Solution",
    desc: "A proposal built specifically for your consumption needs.",
  },
];

export default function EnergyPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formSent, setFormSent] = useState(false);
  const [formSending, setFormSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleEnergySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (formSending) return;
    setFormError(null);
    setFormSending(true);
    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      const res = await fetch("/api/contact", { method: "POST", body: data });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      setFormSent(true);
      form.reset();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setFormSending(false);
    }
  }

  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("revealed"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );
    els.forEach((el) => {
      el.classList.add("reveal-init");
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-x-clip">
      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.35}} .reveal-init{opacity:0;transform:translateY(26px);transition:opacity .85s cubic-bezier(.2,.7,.2,1),transform .85s cubic-bezier(.2,.7,.2,1)} .revealed{opacity:1;transform:none}`}</style>

      <Navbar />

      {/* HERO — bright */}
      <section className="relative overflow-hidden pt-40 pb-20">
        <div className="pointer-events-none absolute -top-24 right-0 h-[460px] w-[460px] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-amber-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 shadow-sm">
            <span
              className="block h-1.5 w-1.5 rounded-full bg-amber-500"
              style={{ animation: "pulseDot 2s ease-in-out infinite" }}
            />
            Athens Innovation Hub
          </div>
          <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Your advisor, face to face
            <br />
            <span className="bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400 bg-clip-text text-transparent">
              Energy Operations
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            We watch the market for you.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition-colors hover:bg-amber-600"
            >
              See our services
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="tel:+306977691776"
              className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-8 py-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <Phone className="h-4 w-4 text-amber-600" /> +30 697 769 1776
            </a>
          </div>
        </div>
      </section>

      {/* TRUST VALUES */}
      <section className="relative z-10 pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {trust.map((item, idx) => (
              <div
                key={item.value}
                data-reveal
                className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${
                  idx === 2 ? "sm:col-span-1" : ""
                }`}
              >
                <div className="text-2xl font-black text-amber-600">
                  {item.value}
                </div>
                <div className="mt-2 text-sm text-slate-600">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="relative z-10 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p
            data-reveal
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-600"
          >
            Services
          </p>
          <h2
            data-reveal
            className="mt-3.5 text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl"
          >
            For home and business!
          </h2>
          <p data-reveal className="mt-4 max-w-xl text-slate-600">
            Complete energy solutions tailored to your needs.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((srv, idx) => {
              const Icon = iconMap[srv.title] || Zap;
              return (
                <div
                  key={srv.title}
                  data-reveal
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
                >
                  <span className="text-xs font-black tracking-[0.2em] text-slate-300">
                    0{idx + 1}
                  </span>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-100 bg-amber-50">
                      <Icon className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {srv.title}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    {srv.desc}
                  </p>
                  <Link
                    href={`/contact?service=${encodeURIComponent(srv.title)}`}
                    className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-amber-700 transition-transform hover:translate-x-1"
                  >
                    See more <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section id="about" className="relative z-10 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div data-reveal>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-600">
                Who We Are
              </p>
              <h2 className="mt-3.5 text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Your personal energy advisor!
              </h2>
              <p className="mt-5 leading-relaxed text-slate-600">
                We are a team of specialized energy consultants, dedicated to
                creating value and safety for our clients. Our goal is to
                provide complete energy solutions that fully satisfy your needs
                and expectations.
              </p>
              <div className="mt-7 rounded-2xl border-l-[3px] border-amber-400 bg-amber-50/60 p-6">
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                  Our vision
                </h3>
                <p className="mt-2.5 leading-relaxed text-slate-600">
                  We ensure that every client has their own personal energy
                  advisor, providing customized services throughout the
                  partnership.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div
                data-reveal
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-10"
              >
                <p className="flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                  <span className="block h-1.5 w-1.5 rounded-full bg-sky-500" />
                  Expertise meets technology
                </p>
                <h3 className="mt-4 text-2xl font-bold leading-snug text-slate-900 lg:text-[28px]">
                  Privacy-First Architecture
                </h3>
                <p className="mt-3.5 leading-relaxed text-slate-600">
                  GDPR is not a checkbox. It is the architecture.
                </p>
                <p className="mt-3.5 leading-relaxed text-slate-600">
                  Our system is built privacy-first. We never scrape third-party
                  sites or social platforms. Every contact has a documented
                  lawful basis and can exercise their rights from a self-service
                  panel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <p
            data-reveal
            className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-600"
          >
            Frequently Asked Questions
          </p>
          <h2
            data-reveal
            className="mt-3.5 text-center text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl"
          >
            Everything you need to know
          </h2>
          <p data-reveal className="mt-4 text-center text-slate-500">
            Everything you need to know about switching energy provider.
          </p>

          <div data-reveal className="mt-10 grid gap-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold text-slate-900 transition-colors hover:text-amber-700"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-amber-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                  )}
                </button>
                {openFaq === idx && (
                  <p className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-600">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT / REQUEST A CALL */}
      <section
        id="contact"
        className="relative z-10 overflow-hidden py-24"
      >
        <div className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div data-reveal className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-600">
              Request a call back!
            </p>
            <h2 className="mt-3.5 text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Ready to save money?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Fill in the form and a specialized consultant will contact you
              immediately to propose the right plan — FREE!
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div data-reveal className="lg:col-span-4">
              <div className="grid gap-4">
                <a
                  href="tel:+306977691776"
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                    <Phone className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400">
                      Call us
                    </p>
                    <p className="font-semibold text-slate-900">
                      +30 697 769 1776
                    </p>
                  </div>
                </a>
                <a
                  href="mailto:kalafatasagapitos@gmail.com"
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                    <Mail className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400">
                      Email
                    </p>
                    <p className="font-semibold text-slate-900">
                      kalafatasagapitos@gmail.com
                    </p>
                  </div>
                </a>
              </div>
            </div>

            <form
              data-reveal
              onSubmit={handleEnergySubmit}
              className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8 sm:p-9"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-amber-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-amber-400 focus:bg-white"
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-amber-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-amber-400 focus:bg-white"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="property_type"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-amber-400"
                  >
                    <option>Home</option>
                    <option>Business</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="region"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-amber-400"
                  >
                    <option>Attica</option>
                    <option>Central Greece</option>
                    <option>Northern Greece</option>
                    <option>Aegean Islands</option>
                    <option>Crete</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Service <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="service_category"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-amber-400"
                  >
                    {services.map((s, i) => (
                      <option key={i}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Upload bills / files (optional)
                </label>
                <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-colors hover:border-amber-400/60">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-amber-600" />
                  <p className="text-xs font-medium text-slate-500">
                    PDF, JPG or PNG up to 25MB — multiple files
                  </p>
                  <input type="file" name="files" multiple className="hidden" />
                </label>
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="gdpr_consent"
                  value="true"
                  required
                  className="mt-1 h-4 w-4 rounded border-slate-200 accent-amber-500"
                />
                <label className="text-xs leading-relaxed text-slate-500">
                  I consent to the processing of my data so you can contact me,
                  in accordance with the{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-amber-700 underline"
                  >
                    GDPR privacy policy
                  </Link>
                  .
                </label>
              </div>
              {formSent && (
                <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <Check className="h-4 w-4" /> Thank you! A specialist will
                  contact you shortly.
                </p>
              )}
              {formError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={formSending}
                className="w-full rounded-full bg-amber-500 py-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-white shadow-lg shadow-amber-200 transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formSending ? "..." : "Request a call"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <SiteFooter hideBrand />
    </main>
  );
}