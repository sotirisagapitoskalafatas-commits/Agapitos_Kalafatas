import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-white">
                Agapitos Kalafatas
              </span>
            </div>
            <div className="flex items-center gap-8">
              <Link
                href="#services"
                className="text-dark-400 hover:text-white transition-colors"
              >
                Services
              </Link>
              <Link
                href="#about"
                className="text-dark-400 hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/chat"
                className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all glow"
              >
                Launch Atlas AI
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-dark-800/50 border border-dark-700 rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-dark-300">
                Full-Stack SaaS Architect
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
              Building the Future of{" "}
              <span className="gradient-text">AI-Powered Software</span>
            </h1>

            <p className="text-xl text-dark-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Founder & Chief SaaS Architect. 16+ years building scalable
              platforms, AI agents, and digital operations that drive real
              business results.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/chat"
                className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all glow"
              >
                Talk to Atlas AI
              </Link>
              <a
                href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-dark-600 hover:border-dark-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
              >
                LinkedIn Profile
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              What I Build
            </h2>
            <p className="text-dark-300 text-lg max-w-2xl mx-auto">
              End-to-end SaaS solutions, from architecture to deployment,
              powered by modern AI and cloud-native technologies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "AI Agent Systems",
                desc: "Custom AI agents with voice, memory, and tool use. Built on Gemini, Claude, and OpenAI APIs with full-stack integration.",
                icon: " ",
              },
              {
                title: "SaaS Architecture",
                desc: "Scalable multi-tenant platforms with subscription billing, RBAC, and enterprise-grade security.",
                icon: " ",
              },
              {
                title: "Full-Stack Development",
                desc: "Next.js, React, Node.js, Python, PostgreSQL. From database design to responsive UI.",
                icon: " ",
              },
              {
                title: "Cloud Infrastructure",
                desc: "AWS, Azure, Vercel, Supabase. Docker, CI/CD, monitoring, and cost optimization.",
                icon: "☁️",
              },
              {
                title: "Data Pipelines",
                desc: "ETL, real-time feeds, API integrations. Processing 50+ data sources for market intelligence.",
                icon: " ",
              },
              {
                title: "Digital Operations",
                desc: "Automation, workflow optimization, and digital transformation for growing businesses.",
                icon: "⚡",
              },
            ].map((service, i) => (
              <div
                key={i}
                className="bg-dark-800/50 border border-dark-700 rounded-2xl p-8 hover:border-brand-500/50 transition-all group"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-dark-300 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Agapitos Kalafatas
              </h2>
              <div className="space-y-4 text-dark-300 leading-relaxed">
                <p>
                  <strong className="text-white">Founder & Chief SaaS Architect</strong>{" "}
                  at Agapitos Kalafatas — 12+ years of building and scaling
                  digital products.
                </p>
                <p>
                  With <strong className="text-white">16+ years</strong> of total
                  professional experience, I architect and develop comprehensive
                  B2B SaaS platforms from concept to production.
                </p>
                <p>
                  Currently building <strong className="text-brand-400">RED-AI</strong>,
                  an intelligence layer that aggregates and analyzes real estate data
                  from 50+ international portals across 30+ countries to provide
                  predictive market insights.
                </p>
                <p>
                  Stack: Next.js, React, Supabase, PostgreSQL, Stripe, Python,
                  Docker, AWS, Azure, and AI/ML integration.
                </p>
              </div>
              <div className="mt-8 flex gap-4">
                <a
                  href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                >
                  LinkedIn
                </a>
                <Link
                  href="/chat"
                  className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                >
                  Try Atlas AI
                </Link>
              </div>
            </div>

            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">
                Core Technologies
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Next.js / React",
                  "Python / FastAPI",
                  "Node.js / Express",
                  "PostgreSQL / Supabase",
                  "Stripe Billing",
                  "Docker / K8s",
                  "AWS / Azure",
                  "AI / ML / LLMs",
                  "GraphQL / REST",
                  "Redis / Caching",
                  "CI/CD Pipelines",
                  "GDPR / Security",
                ].map((tech, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-dark-300"
                  >
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                    {tech}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-brand-950/50 to-dark-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Build Something?
          </h2>
          <p className="text-xl text-dark-300 mb-10">
            Talk to Atlas AI — my AI agent that knows my work and can help
            you understand what I build and how.
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all glow"
          >
            Launch Atlas AI
            <span className="text-xl">→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-dark-500 text-sm">
            © 2026 Agapitos Kalafatas. All rights reserved.
          </p>
          <p className="text-dark-500 text-sm">
            Powered by Gemini AI
          </p>
        </div>
      </footer>
    </main>
  );
}
