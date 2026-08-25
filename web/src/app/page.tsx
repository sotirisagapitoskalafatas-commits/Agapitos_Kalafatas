"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scene3D from "@/components/Scene3D";

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    title: "Smart City Integration",
    desc: "AI-powered urban infrastructure seamlessly blended with nature. Real-time data analytics optimize energy, traffic, and sustainability across connected city networks.",
    img: "/images/image5.jpg",
    tag: "AI Infrastructure",
  },
  {
    title: "Global Intelligence Network",
    desc: "Holographic data visualization connecting intelligence hubs across Europe. Neural pathways of information flowing through secure, quantum-encrypted channels.",
    img: "/images/image6.jpg",
    tag: "Neural Networks",
  },
  {
    title: "Research & Innovation Lab",
    desc: "Next-generation R&D facility overlooking the Mediterranean. Where breakthrough algorithms meet quantum computing to solve tomorrow's challenges.",
    img: "/images/image7.jpg",
    tag: "R&D",
  },
  {
    title: "Analytics Dashboard",
    desc: "Ultra-modern digital interface displaying real-time AI analytics with depth-of-field parallax. Predictive insights rendered in beautiful 3D visualizations.",
    img: "/images/image8.jpg",
    tag: "Data Visualization",
  },
];

const services = [
  { icon: " ", title: "AI Architecture", desc: "End-to-end AI system design, from neural network topology to production deployment pipelines." },
  { icon: " ", title: "Full-Stack SaaS", desc: "Complete platform engineering — frontend, backend, infrastructure, and everything in between." },
  { icon: " ", title: "Data Intelligence", desc: "Transform raw data into actionable insights with predictive analytics and real-time dashboards." },
  { icon: " ", title: "Cloud & DevOps", desc: "Scalable infrastructure on AWS, Azure, and GCP with CI/CD and container orchestration." },
  { icon: " ", title: "Product Strategy", desc: "From concept to market-fit. Product roadmaps, MVP design, and growth engineering." },
  { icon: " ", title: "Digital Transformation", desc: "Modernize legacy systems with cloud-native architectures and AI-first approaches." },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.fromTo(
        ".hero-title",
        { opacity: 0, y: 80, rotateX: -15 },
        { opacity: 1, y: 0, rotateX: 0, duration: 1.2, ease: "power3.out", delay: 0.2 }
      );
      gsap.fromTo(
        ".hero-subtitle",
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.5 }
      );
      gsap.fromTo(
        ".hero-cta",
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out", delay: 0.8 }
      );
      gsap.fromTo(
        ".hero-image",
        { opacity: 0, scale: 0.9, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.6 }
      );

      // About section
      gsap.fromTo(
        ".about-text",
        { opacity: 0, x: -60 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".about-text", start: "top 80%", toggleActions: "play none none reverse" },
        }
      );
      gsap.fromTo(
        ".about-image",
        { opacity: 0, x: 60, rotateY: 8 },
        {
          opacity: 1,
          x: 0,
          rotateY: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: ".about-image", start: "top 80%", toggleActions: "play none none reverse" },
        }
      );

      // Services stagger
      gsap.fromTo(
        ".service-card",
        { opacity: 0, y: 60, rotateX: -10 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: ".service-card", start: "top 85%", toggleActions: "play none none reverse" },
        }
      );

      // Projects horizontal scroll
      const projectCards = gsap.utils.toArray(".project-card");
      if (projectCards.length > 0) {
        gsap.fromTo(
          ".project-card",
          { opacity: 0, y: 80, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            stagger: 0.2,
            ease: "power3.out",
            scrollTrigger: { trigger: ".projects-grid", start: "top 80%", toggleActions: "play none none reverse" },
          }
        );
      }

      // Contact section
      gsap.fromTo(
        ".contact-form",
        { opacity: 0, y: 60, rotateY: -5 },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".contact-form", start: "top 80%", toggleActions: "play none none reverse" },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">A</span>
          </div>
            <span className="text-xl font-bold text-slate-900">Agapitos Kalafatas</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#about" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
              About
            </Link>
            <Link href="#services" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
              Services
            </Link>
            <Link href="#projects" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
              Projects
            </Link>
            <Link href="#contact" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
              Contact
            </Link>
            <Link
              href="/chat"
              className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-brand-500/25"
            >
              Launch Atlas AI
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-brand-50/30 to-white" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />

        {/* 3D Scene */}
        <Scene3D />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center w-full">
          <div>
            <div className="hero-title opacity-0">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 mb-6">
                AI & Futuristic Innovation Hub
              </span>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.95] tracking-tight">
                AGAPITOS
                <br />
                <span className="gradient-text">KALAFATAS</span>
              </h1>
            </div>
            <p className="hero-subtitle opacity-0 text-lg text-slate-500 mt-8 max-w-lg leading-relaxed">
              Full-Stack SaaS Architect & Digital Operations Strategist.
              Building the future with AI-powered platforms and intelligent systems.
            </p>
            <div className="hero-cta opacity-0 flex gap-4 mt-10">
              <Link
                href="/chat"
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-xl shadow-slate-900/20 text-sm"
              >
                Start a Conversation
              </Link>
              <a
                href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="glass hover:bg-white/40 text-slate-700 px-8 py-4 rounded-xl font-semibold transition-all text-sm"
              >
                Connect on LinkedIn
              </a>
            </div>
          </div>
          <div className="hero-image opacity-0 relative">
            <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2">
              <img
                src="/images/image1.jpg"
                alt="Agapitos Kalafatas - AI Innovation Hub"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>
            {/* Floating accent cards */}
            <div className="absolute -bottom-6 -left-6 glass-strong rounded-2xl p-4 animate-float shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">AI-Powered</p>
                  <p className="text-xs text-slate-500">Autonomous Systems</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 glass-strong rounded-2xl p-4 animate-float-delayed shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Real-Time</p>
                  <p className="text-xs text-slate-500">Neural Processing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 rounded-full border-2 border-slate-300 flex justify-center pt-2">
            <div className="w-1 h-2.5 bg-slate-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="about-text">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 mb-6">
                Vision & Mission
              </span>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-8">
                Architecting the
                <br />
                <span className="gradient-text">Future of AI</span>
              </h2>
              <div className="space-y-5 text-slate-500 leading-relaxed">
                <p>
                  <strong className="text-slate-900">Founder & Chief SaaS Architect</strong> at
                  Agapitos Kalafatas — 12+ years of building and scaling digital products
                  that transform industries.
                </p>
                <p>
                  With <strong className="text-slate-900">16+ years</strong> of total professional
                  experience, I architect and develop comprehensive B2B SaaS platforms from
                  concept to production.
                </p>
                <p>
                  Currently building <strong className="text-brand-500">RED-AI</strong>,
                  an intelligence layer that aggregates and analyzes real estate data from
                  50+ international portals across 30+ countries to provide predictive
                  market insights.
                </p>
              </div>
              <div className="mt-10 flex gap-4">
                <a
                  href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass hover:bg-white/40 border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all"
                >
                  LinkedIn Profile
                </a>
              </div>
            </div>
            <div className="about-image relative">
              <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2">
                <img
                  src="/images/image2.jpg"
                  alt="AI Vision & Smart Cities"
                  className="w-full h-auto rounded-2xl object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 glass-strong rounded-2xl p-5 animate-float-slow shadow-lg max-w-[200px]">
                <p className="text-3xl font-black text-slate-900">30+</p>
                <p className="text-xs text-slate-500 mt-1">Countries covered by RED-AI intelligence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" ref={servicesRef} className="py-32 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 mb-6">
              Capabilities
            </span>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">
              Innovation <span className="gradient-text">Services</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Comprehensive AI and full-stack solutions engineered for scale,
              performance, and intelligent automation.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div
                key={i}
                className="service-card glass rounded-2xl p-8 hover:bg-white/40 transition-all duration-500 group cursor-default"
                style={{ perspective: "1000px" }}
              >
                <div className="text-4xl mb-5">{s.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-600 transition-colors">
                  {s.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" ref={projectsRef} className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 mb-6">
              Portfolio
            </span>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">
              AI <span className="gradient-text">Projects</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Showcasing intelligent systems that push the boundaries of
              what&apos;s possible with AI and full-stack engineering.
            </p>
          </div>
          <div className="projects-grid grid md:grid-cols-2 gap-8">
            {projects.map((p, i) => (
              <div
                key={i}
                className="project-card group"
              >
                <div className="glass rounded-3xl overflow-hidden shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-500">
                  <div className="relative overflow-hidden">
                    <img
                      src={p.img}
                      alt={p.title}
                      className="w-full h-64 object-cover img-parallax group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="glass-strong px-3 py-1 rounded-full text-xs font-semibold text-slate-700">
                        {p.tag}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-brand-600 transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed text-sm">{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Hub Section */}
      <section className="py-32 bg-gradient-to-b from-white to-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2">
                <img
                  src="/images/image3.jpg"
                  alt="Collaboration Hub"
                  className="w-full h-auto rounded-2xl object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-green-600 bg-green-50 border border-green-100 mb-6">
                Collaboration
              </span>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-8">
                The Innovation
                <br />
                <span className="gradient-text">Hub</span>
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-6">
                Where brilliant minds converge to architect the next generation of
                AI-powered solutions. Our collaboration hub brings together expertise
                in machine learning, full-stack engineering, and strategic product design.
              </p>
              <p className="text-slate-500 leading-relaxed">
                From concept brainstorming to production deployment, every project
                benefits from cross-disciplinary thinking and relentless iteration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Solutions Feature */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 mb-6">
                AI Solutions
              </span>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-8">
                Neural
                <br />
                <span className="gradient-text">Innovations</span>
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-6">
                Leveraging cutting-edge neural networks, global connectivity models,
                and quantum-inspired algorithms to solve complex business challenges
                at unprecedented scale.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { label: "Neural Networks", value: "Deep Learning" },
                  { label: "Global Scale", value: "30+ Countries" },
                  { label: "Data Points", value: "50M+ Daily" },
                  { label: "Response Time", value: "<100ms" },
                ].map((stat, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2">
                <img
                  src="/images/image4.jpg"
                  alt="AI Neural Innovations"
                  className="w-full h-auto rounded-2xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* R&D Section */}
      <section className="py-32 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 mb-6">
            Research & Development
          </span>
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">
            Pushing <span className="gradient-text">Boundaries</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-16">
            Our R&D lab overlooks the Mediterranean — where breakthrough
            algorithms meet quantum computing to solve tomorrow&apos;s challenges.
          </p>
          <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2 max-w-4xl mx-auto">
            <img
              src="/images/image7.jpg"
              alt="Research & Development Lab"
              className="w-full h-auto rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" ref={contactRef} className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/30 via-white to-purple-50/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 mb-6">
                Get In Touch
              </span>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-8">
                Let&apos;s Build
                <br />
                <span className="gradient-text">Together</span>
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-8">
                Ready to transform your business with AI? Let&apos;s discuss how
                intelligent systems can drive your next breakthrough.
              </p>
              <div className="space-y-4">
                <a
                  href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 glass rounded-xl p-4 hover:bg-white/40 transition-all group"
                >
                  <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">in</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">LinkedIn</p>
                    <p className="text-sm text-slate-500">Connect professionally</p>
                  </div>
                </a>
                <Link
                  href="/chat"
                  className="flex items-center gap-4 glass rounded-xl p-4 hover:bg-white/40 transition-all group"
                >
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">Atlas AI Agent</p>
                    <p className="text-sm text-slate-500">Start a conversation now</p>
                  </div>
                </Link>
              </div>
            </div>
            <div className="contact-form relative">
              <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 p-2">
                <img
                  src="/images/image9.jpg"
                  alt="Contact"
                  className="w-full h-auto rounded-2xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-slate-900">Agapitos Kalafatas</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/chat" className="hover:text-slate-900 transition-colors">Atlas AI</Link>
            <Link href="/visualizer" className="hover:text-slate-900 transition-colors">Visualizer</Link>
            <Link href="/memory" className="hover:text-slate-900 transition-colors">Memory</Link>
            <Link href="/marketing" className="hover:text-slate-900 transition-colors">Marketing</Link>
            <Link href="/prompts" className="hover:text-slate-900 transition-colors">Prompts</Link>
          </div>
          <p className="text-xs text-slate-400">© 2026 Agapitos Kalafatas. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
