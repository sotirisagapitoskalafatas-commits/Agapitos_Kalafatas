"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LanguageContext";

export default function UnifiedContactForm() {
  const { t } = useLocale();
  const tF = (t as any).contactPage?.form ?? {};

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    propertyType: "",
    region: "",
    serviceCategory: "Electricity",
    comments: "",
    gdprConsent: false,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gdprConsent) return;

    setLoading(true);
    setErrorMsg("");

    const body = new FormData();
    body.append("first_name", formData.firstName);
    body.append("last_name", formData.lastName);
    body.append("email", formData.email);
    body.append("phone", formData.phone);
    body.append("property_type", formData.propertyType);
    body.append("region", formData.region);
    body.append("service_category", formData.serviceCategory);
    body.append("comments", formData.comments);
    body.append("gdpr_consent", formData.gdprConsent ? "true" : "false");

    selectedFiles.forEach((file) => {
      body.append("files", file);
    });

    try {
      const res = await fetch("/api/contact", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error submitting the form");
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 p-10 rounded-3xl text-center">
        <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-green-900 mb-2">{tF.successTitle || "Your request has been submitted!"}</h3>
        <p className="text-green-700">{tF.successDesc || "A specialized advisor will contact you shortly."}</p>
      </div>
    );
  }

  const isEnergyService = ["Electricity", "Natural Gas", "Solar", "E-Mobility", "Energy Storage", "Energy Savings"].includes(formData.serviceCategory);

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-2xl shadow-slate-900/5 max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{tF.title || "Request a callback"}</h2>
        <p className="text-sm text-slate-500">{tF.subtitle || "Fill out the form and we'll get back to you right away. 100% free."}</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{errorMsg}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{tF.firstName || "First Name *"}</label>
          <input
            type="text"
            required
            className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{tF.lastName || "Last Name *"}</label>
          <input
            type="text"
            required
            className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{tF.phone || "Phone *"}</label>
          <input
            type="tel"
            required
            className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{tF.email || "Email (optional)"}</label>
          <input
            type="email"
            className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{tF.serviceCategory || "Service of Interest *"}</label>
        <select
          className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white transition-all text-sm"
          value={formData.serviceCategory}
          onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
        >
          <optgroup label={tF.groupSaaS || "SaaS, Web & Software Engineering"}>
            <option value="Website">{tF.optWebsite || "Website Development"}</option>
            <option value="E-shop">{tF.optEshop || "E-shop Development (from €1400)"}</option>
            <option value="Website Management">{tF.optWebsiteMgmt || "Website Management & Security"}</option>
            <option value="Software Development">{tF.optSoftware || "Custom Software / SaaS Development"}</option>
            <option value="AI Agents">{tF.optAiAgents || "AI Agents & Neural Systems"}</option>
          </optgroup>
          <optgroup label={tF.groupEnergy || "Energy"}>
            <option value="Electricity">{tF.optElectricity || "Electricity (Cheap Plans)"}</option>
            <option value="Natural Gas">{tF.optNaturalGas || "Natural Gas"}</option>
            <option value="Solar">{tF.optSolar || "Solar / Photovoltaics"}</option>
            <option value="E-Mobility">{tF.optEv || "E-Mobility / EV"}</option>
            <option value="Energy Storage">{tF.optStorage || "Energy Storage"}</option>
            <option value="Energy Savings">{tF.optSavings || "Energy Savings"}</option>
          </optgroup>
          <optgroup label={tF.groupInsurance || "Insurance Services"}>
            <option value="Life Insurance">{tF.optLife || "Life Insurance"}</option>
            <option value="Health Insurance">{tF.optHealth || "Health Insurance"}</option>
            <option value="Car Insurance">{tF.optAuto || "Car Insurance"}</option>
          </optgroup>
        </select>
      </div>

      {isEnergyService && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{tF.propertyType || "Property Type"}</label>
            <select
              className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white transition-all text-sm"
              value={formData.propertyType}
              onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
            >
              <option value="">{tF.selectType || "Select type..."}</option>
              <option value="House">{tF.optHouse || "House"}</option>
              <option value="Business">{tF.optBusiness || "Business"}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{tF.region || "Region"}</label>
            <select
              className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white transition-all text-sm"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            >
              <option value="">{tF.selectRegion || "Select region..."}</option>
              <option value="Attica">{tF.optAttica || "Attica"}</option>
              <option value="Thessaloniki">{tF.optThessaloniki || "Thessaloniki"}</option>
              <option value="Crete">{tF.optCrete || "Crete"}</option>
              <option value="Thessaly">{tF.optThessaly || "Thessaly"}</option>
              <option value="Ionian Islands">{tF.optIonian || "Ionian Islands"}</option>
              <option value="Aegean Islands">{tF.optAegean || "Aegean Islands"}</option>
              <option value="Peloponnese">{tF.optPeloponnese || "Peloponnese"}</option>
              <option value="Macedonia">{tF.optMacedonia || "Macedonia"}</option>
              <option value="Other">{tF.optOther || "Other"}</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{tF.comments || "Comments (optional)"}</label>
        <textarea
          rows={3}
          className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm resize-none transition-all"
          placeholder={tF.commentsPlaceholder || "Describe your request..."}
          value={formData.comments}
          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{tF.uploadFiles || "Upload bills / files"}</label>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-300 transition-colors">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="text-3xl mb-2"> </div>
            <p className="text-sm text-slate-600 font-medium">{tF.clickToSelect || "Click to select files"}</p>
            <p className="text-[10px] text-slate-400 mt-1">{tF.fileHint || "PDF, JPG, PNG, DOC up to 25MB each"}</p>
          </label>
        </div>
        {selectedFiles.length > 0 && (
          <div className="mt-3 space-y-1">
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                <span> {f.name}</span>
                <span>{(f.size / 1024 / 1024).toFixed(1)}MB</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 pt-2">
        <input
          type="checkbox"
          id="gdpr"
          required
          checked={formData.gdprConsent}
          onChange={(e) => setFormData({ ...formData, gdprConsent: e.target.checked })}
          className="mt-1 h-4 w-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
        />
        <label htmlFor="gdpr" className="text-xs text-slate-500 leading-relaxed">
          {tF.gdpr || "I consent to the processing of my data so you can contact me, in accordance with the GDPR privacy policy."}
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !formData.gdprConsent}
        className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/25"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {tF.sending || "Sending..."}
          </span>
        ) : (
          tF.submit || "Request a callback"
        )}
      </button>
    </form>
  );
}
