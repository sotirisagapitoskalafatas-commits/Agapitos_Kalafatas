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
    <section className="py-20 bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">
            {data.title}
          </h2>
          <p className="text-slate-600 mt-2">
            {data.subtitle}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 rounded-xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-bold text-slate-900 pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                      isOpen ? "transform rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
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
