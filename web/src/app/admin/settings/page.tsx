"use client";

import { useState } from "react";

type SettingsTab = "profile" | "company" | "integrations" | "crm_ai";

const GLASS = "bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl";

function Input({
  label,
  type = "text",
  value,
  onChange,
  readOnly,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/60 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition ${
          readOnly ? "cursor-not-allowed opacity-60" : ""
        }`}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 6,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/60 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition resize-y"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("profile");

  const [name, setName] = useState("Αγαπητός Καλαφάτας");
  const [email, setEmail] = useState("kalafatasagapitos@gmail.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [companyName, setCompanyName] = useState("Agapitos Kalafatas");
  const [vatNumber, setVatNumber] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [address, setAddress] = useState("");
  const [bankIban, setBankIban] = useState("");

  const [slackUrl, setSlackUrl] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("kalafatasagapitos@gmail.com");
  const [gaId, setGaId] = useState("G-V73CT9GT6W");
  const [supabaseSecret, setSupabaseSecret] = useState("••••••••••••••••");

  const [aiPrompt, setAiPrompt] = useState("");
  const [pipelineStages, setPipelineStages] = useState<string[]>([
    "Lead",
    "Qualified",
    "Proposal",
    "Negotiation",
    "Closed Won",
    "Closed Lost",
  ]);
  const [newStage, setNewStage] = useState("");

  const saveProfile = () => {
    console.log("Saving profile:", { name, email });
    alert("Profile saved (mock)");
  };

  const savePassword = () => {
    console.log("Changing password for:", email);
    setCurrentPassword("");
    setNewPassword("");
    alert("Password changed (mock)");
  };

  const saveCompany = () => {
    console.log("Saving company:", { companyName, vatNumber, taxOffice, address, bankIban });
    alert("Company info saved (mock)");
  };

  const saveIntegrations = () => {
    console.log("Saving integrations:", { slackUrl, notifyEmail, gaId });
    alert("Integrations saved (mock)");
  };

  const saveCrmAi = () => {
    console.log("Saving CRM & AI:", { aiPrompt, pipelineStages });
    alert("CRM & AI settings saved (mock)");
  };

  const addStage = () => {
    if (newStage.trim()) {
      setPipelineStages([...pipelineStages, newStage.trim()]);
      setNewStage("");
    }
  };

  const removeStage = (index: number) => {
    setPipelineStages(pipelineStages.filter((_, i) => i !== index));
  };

  const tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "company", label: "Company & Invoicing", icon: " " },
    { key: "integrations", label: "Integrations", icon: " " },
    { key: "crm_ai", label: "CRM & AI", icon: " " },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account and system configuration</p>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <div className={`${GLASS} p-6 space-y-6`}>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Name" value={name} onChange={setName} />
                <Input label="Email" type="email" value={email} onChange={setEmail} />
              </div>
              <button
                onClick={saveProfile}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition"
              >
                Save Profile
              </button>
            </div>

            <div className="border-t border-slate-200/80 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Current Password" type="password" value={currentPassword} onChange={setCurrentPassword} />
                <Input label="New Password" type="password" value={newPassword} onChange={setNewPassword} />
              </div>
              <button
                onClick={savePassword}
                className="mt-4 px-6 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition"
              >
                Change Password
              </button>
            </div>
          </div>
        )}

        {tab === "company" && (
          <div className={`${GLASS} p-6 space-y-6`}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Company & Invoicing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Company Name" value={companyName} onChange={setCompanyName} />
              <Input label="VAT Number / ΑΦΜ" value={vatNumber} onChange={setVatNumber} />
              <Input label="Tax Office / ΔΟΥ" value={taxOffice} onChange={setTaxOffice} />
              <Input label="Bank IBAN" value={bankIban} onChange={setBankIban} />
            </div>
            <Input label="Address" value={address} onChange={setAddress} />
            <button
              onClick={saveCompany}
              className="mt-2 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition"
            >
              Save Company Info
            </button>
          </div>
        )}

        {tab === "integrations" && (
          <div className={`${GLASS} p-6 space-y-6`}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Integrations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Slack Webhook URL" value={slackUrl} onChange={setSlackUrl} placeholder="https://hooks.slack.com/..." />
              <Input label="Notification Email" type="email" value={notifyEmail} onChange={setNotifyEmail} />
              <Input label="Google Analytics ID" value={gaId} onChange={setGaId} />
              <Input label="Supabase Webhook Secret" value={supabaseSecret} readOnly />
            </div>
            <button
              onClick={saveIntegrations}
              className="mt-2 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition"
            >
              Save Integrations
            </button>
          </div>
        )}

        {tab === "crm_ai" && (
          <div className={`${GLASS} p-6 space-y-6`}>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">AI System Prompt</h3>
              <Textarea label="System Prompt" value={aiPrompt} onChange={setAiPrompt} rows={8} />
            </div>

            <div className="border-t border-slate-200/80 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Pipeline Stages</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addStage()}
                  placeholder="New stage name"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/60 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                />
                <button
                  onClick={addStage}
                  className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {pipelineStages.map((stage, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/60 border border-slate-200/60">
                    <span className="text-sm text-slate-900">{stage}</span>
                    <button
                      onClick={() => removeStage(i)}
                      className="text-sm text-red-400 hover:text-red-600 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={saveCrmAi}
              className="mt-2 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition"
            >
              Save CRM & AI Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
