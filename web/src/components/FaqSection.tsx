"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/contexts/LanguageContext";

export const FaqSection: React.FC = () => {
  const { t } = useLocale();
  const data = t.faqSection || {};
  const faqs = data.items || [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-20 bg-transparent relative">
      <div className="ambient-glow w-[400px] h-[400px] bg-amber-500/[0.07] top-10 left-1/2 -translate-x-1/2" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            {data.title}
          </h2>
          <p className="text-white/60 mt-4">{data.subtitle}</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden backdrop-blur transition-all duration-200 hover:border-white/20"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-bold text-white pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/50 transition-transform duration-200 ${
                      isOpen ? "transform rotate-180 text-amber-300" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-white/60 text-sm leading-relaxed border-t border-white/10 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};