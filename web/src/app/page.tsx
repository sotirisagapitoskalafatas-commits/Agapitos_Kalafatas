"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scene3D from "@/components/Scene3D";
import Navbar from "@/components/Navbar";
import { ServiceGrid } from "@/components/ServiceGrid";
import { SectorGrid } from "@/components/SectorGrid";
import { FaqSection } from "@/components/FaqSection";
import { useLocale } from "@/contexts/LanguageContext";

gsap.registerPlugin(ScrollTrigger);

const projectImages = ["/images/image5.jpg", "/images/image6.jpg", "/images/image7.jpg", "/images/image8.jpg"];

export default function Home() {
  const { t } = useLocale();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-title", { opacity: 0, y: 80, rotateX: -15 }, { opacity: 1, y: 0, rotateX: 0, duration: 1.2, ease: "power3.out", delay: 0.2 });
      gsap.fromTo(".hero-subtitle", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.5 });
      gsap.fromTo(".hero-cta", { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out", delay: 0.8 });
      gsap.fromTo(".hero-image", { opacity: 0, scale: 0.9, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.6 });

      gsap.fromTo(".about-text", { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".about-text", start: "top 80%", toggleActions: "play none none reverse" } });
      gsap.fromTo(".about-image", { opacity: 0, x: 60, rotateY: 8 }, { opacity: 1, x: 0, rotateY: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".about-image", start: "top 80%", toggleActions: "play none none reverse" } });

      gsap.fromTo(".project-card", { opacity: 0, y: 80, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.2, ease: "power3.out", scrollTrigger: { trigger: ".projects-grid", start: "top 80%", toggleActions: "play none none reverse" } });

      gsap.fromTo(".contact-section", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".contact-section", start: "top 80%", toggleActions: "play none none reverse" } });
    });
    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-brand-50/30 to-white" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
        <Scene3D />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center w-full">
          <div>
            <div className="hero-title opacity-0">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 mb-6">{t.hero.badge}</span>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.95] tracking-tight">
                {t.hero.title1}<br />
                <span className="gradient-text">{t.hero.title2}</span>
              </h1>
            </div>
            <p className="hero-subtitle opacity-0 text-lg text-slate-500 mt-8 max-w-lg leading-relaxed">{t.hero.subtitle}</p>
            <div className="hero-cta opacity-0 flex gap-4 mt-10">
              <Link href="/chat" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-xl shadow-slate-900/20 text-sm">{t.hero.cta1}</Link>
              <a href="https://linkedin.com/in/agapitos-kalafatas-red-ai" target="_blank" rel="noopener noreferrer" className="glass hover:bg-white/40 text-slate-700 px-8 py-4 rounded-xl font-semibold transition-all text-sm">{t.hero.cta2}</a>
            </div>
          </div>
          <div className="hero-image opacity-0 relative">
            <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2">
              <img src="/images/image1.jpg" alt="Agapitos Kalafatas" className="w-full h-auto rounded-2xl object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 glass-strong rounded-2xl p-4 animate-float shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center"><span className="text-white text-sm">✓</span></div>
                <div><p className="text-xs font-semibold text-slate-900">{t.hero.aiPowered}</p><p className="text-xs text-slate-500">{t.hero.autonomous}</p></div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 glass-strong rounded-2xl p-4 animate-float-delayed shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center"><span className="text-white text-sm">⚡</span></div>
                <div><p className="text-xs font-semibold text-slate-900">{t.hero.realTime}</p><p className="text-xs text-slate-500">{t.hero.neural}</p></div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 rounded-full border-2 border-slate-300 flex justify-center pt-2"><div className="w-1 h-2.5 bg-slate-400 rounded-full animate-bounce" /></div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="about-text">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 mb-6">{t.about.badge}</span>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-8">{t.about.title.split(" ").slice(0, 2).join(" ")}<br /><span className="gradient-text">{t.about.title.split(" ").slice(2).join(" ")}</span></h2>
              <div className="space-y-5 text-slate-500 leading-relaxed">
                <p><strong className="text-slate-900">Founder & Chief SaaS Architect</strong> — {t.about.p1}</p>
                <p>{t.about.p2}</p>
              </div>
              <div className="mt-10 flex gap-4">
                <a href="https://linkedin.com/in/agapitos-kalafatas-red-ai" target="_blank" rel="noopener noreferrer" className="glass hover:bg-white/40 border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all">{t.about.linkedin}</a>
              </div>
            </div>
            <div className="about-image relative">
              <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2">
                <img src="/images/image2.jpg" alt="AI Vision" className="w-full h-auto rounded-2xl object-cover" />
              </div>
              <div className="absolute -bottom-8 -right-8 glass-strong rounded-2xl p-5 animate-float-slow shadow-lg max-w-[200px]">
                <p className="text-3xl font-black text-slate-900">30+</p>
                <p className="text-xs text-slate-500 mt-1">{t.about.countries}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <div id="services">
        <ServiceGrid />
      </div>

      {/* Industry Sectors */}
      <SectorGrid />

      {/* FAQ */}
      <FaqSection />

      {/* Projects */}
      <section id="projects" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 mb-6">{t.projects.badge}</span>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">{t.projects.title.split(" ")[0]} <span className="gradient-text">{t.projects.title.split(" ").slice(1).join(" ")}</span></h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">{t.projects.subtitle}</p>
          </div>
          <div className="projects-grid grid md:grid-cols-2 gap-8">
            {t.projects.items.map((p, i) => (
              <div key={i} className="project-card group">
                <div className="glass rounded-3xl overflow-hidden shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-500">
                  <div className="relative overflow-hidden">
                    <img src={projectImages[i]} alt={p.title} className="w-full h-64 object-cover img-parallax group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 left-4"><span className="glass-strong px-3 py-1 rounded-full text-xs font-semibold text-slate-700">{p.tag}</span></div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-brand-600 transition-colors">{p.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hub */}
      <section className="py-32 bg-gradient-to-b from-white to-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2">
                <img src="/images/image3.jpg" alt="Collaboration Hub" className="w-full h-auto rounded-2xl object-cover" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-green-600 bg-green-50 border border-green-100 mb-6">{t.hub.badge}</span>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-8">{t.hub.title.split(" ").slice(0, 2).join(" ")}<br /><span className="gradient-text">{t.hub.title.split(" ").slice(2).join(" ")}</span></h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-6">{t.hub.p1}</p>
              <p className="text-slate-500 leading-relaxed">{t.hub.p2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Solutions */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 mb-6">{t.aiSolutions.badge}</span>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-8">{t.aiSolutions.title.split(" ")[0]}<br /><span className="gradient-text">{t.aiSolutions.title.split(" ").slice(1).join(" ")}</span></h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-6">{t.aiSolutions.desc}</p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {t.aiSolutions.stats.map((stat, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2">
                <img src="/images/image4.jpg" alt="AI Neural Innovations" className="w-full h-auto rounded-2xl object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* R&D */}
      <section className="py-32 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 mb-6">{t.rnd.badge}</span>
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">{t.rnd.title.split(" ")[0]} <span className="gradient-text">{t.rnd.title.split(" ").slice(1).join(" ")}</span></h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-16">{t.rnd.desc}</p>
          <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2 max-w-4xl mx-auto">
            <img src="/images/image7.jpg" alt="R&D Lab" className="w-full h-auto rounded-2xl object-cover" />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="contact-section py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/30 via-white to-purple-50/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 mb-6">{t.contact.badge}</span>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-8">{t.contact.title.split(" ").slice(0, 2).join(" ")}<br /><span className="gradient-text">{t.contact.title.split(" ").slice(2).join(" ")}</span></h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-8">{t.contact.desc}</p>
              <div className="space-y-4">
                <a href="https://linkedin.com/in/agapitos-kalafatas-red-ai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 glass rounded-xl p-4 hover:bg-white/40 transition-all group">
                  <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg"><span className="text-white text-lg">in</span></div>
                  <div><p className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{t.contact.linkedin}</p><p className="text-sm text-slate-500">{t.contact.linkedinDesc}</p></div>
                </a>
                <Link href="/chat" className="flex items-center gap-4 glass rounded-xl p-4 hover:bg-white/40 transition-all group">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg"><span className="text-white text-lg">⚡</span></div>
                  <div><p className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">{t.contact.atlas}</p><p className="text-sm text-slate-500">{t.contact.atlasDesc}</p></div>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2">
                <img src="/images/image9.jpg" alt="Contact" className="w-full h-auto rounded-2xl object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">A</span></div>
            <span className="font-semibold text-slate-900">Agapitos Kalafatas</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/chat" className="hover:text-slate-900 transition-colors">Atlas AI</Link>
            <Link href="/services" className="hover:text-slate-900 transition-colors">{t.nav.services}</Link>
            <Link href="/admin/crm" className="hover:text-slate-900 transition-colors">CRM</Link>
          </div>
          <p className="text-xs text-slate-400">{t.footer.rights}</p>
        </div>
      </footer>
    </main>
  );
}
