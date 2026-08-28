// Core specialist agents, each with tenant-scoped tools.
import type { AgentDef } from "./registry";
import {
  searchKnowledge,
  lookupLead,
  searchDeals,
  getPipelineMetrics,
  getInvoices,
} from "./knowledge";
import type { AgentContext, Tool } from "./types";
import { retrieveKnowledge } from "@/lib/rag";
import { supabase } from "./db";

const knowledgeTool = (category: "web_dev" | "energy" | "insurance" | "all"): Tool => ({
  name: `search_knowledge_${category === "all" ? "general" : category}`,
  description: `Retrieve verified facts and pricing from the company knowledge base (category: ${category}). Always use before stating prices or policy details.`,
  category: "read",
  argsSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Topic to look up in the knowledge base" },
      limit: { type: "number", description: "Max docs (default 3)" },
    },
    required: ["query"],
  },
  run: async (ctx, args) => {
    const rag = await retrieveKnowledge(String(args.query || ""), category);
    return { source: `knowledge(${category})`, result: rag };
  },
});

const tools = {
  search_leads: {
    name: "search_leads",
    description: "Search CRM leads by name, email, status, or service category. Read-only.",
    category: "read",
    argsSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        status: { type: "string", description: "new_lead, contacted, qualified, proposal, closed_won, closed_lost" },
        limit: { type: "number" },
      },
    },
    run: (ctx: AgentContext, args: any) => lookupLead(ctx, args),
  } as Tool,

  search_deals: {
    name: "search_deals",
    description: "Search CRM deals/pipeline by stage, title, or value. Read-only.",
    category: "read",
    argsSchema: {
      type: "object",
      properties: {
        stage: { type: "string", description: "lead, qualified, proposal, won, lost" },
        title: { type: "string" },
        minValue: { type: "number" },
        maxValue: { type: "number" },
        limit: { type: "number" },
      },
    },
    run: (ctx: AgentContext, args: any) => searchDeals(ctx, args),
  } as Tool,

  get_pipeline_metrics: {
    name: "get_pipeline_metrics",
    description: "Summarize pipeline: deals per stage, total value, win rate. Read-only.",
    category: "read",
    argsSchema: { type: "object", properties: {} },
    run: (ctx: AgentContext, args: any) => getPipelineMetrics(ctx, {}),
  } as Tool,

  get_invoices: {
    name: "get_invoices",
    description: "List invoices, optionally filtered by status (draft, sent, paid, overdue). Read-only.",
    category: "read",
    argsSchema: {
      type: "object",
      properties: { status: { type: "string" }, limit: { type: "number" } },
    },
    run: (ctx: AgentContext, args: any) => getInvoices(ctx, args),
  } as Tool,
};

// ── WebDev & Software Agent ──
export const webDevAgent: AgentDef = {
  id: "webdev",
  name: "Web & Software Agent",
  description:
    "Expert on web development services: E-shops (from €1400), website management, custom web development, software/SaaS development, and AI agent systems. Quotes verified pricing from the knowledge base.",
  primaryTool: "search_knowledge_web_dev",
  tools: [knowledgeTool("web_dev"), tools.search_leads],
};

// ── Energy Services Agent ──
export const energyAgent: AgentDef = {
  id: "energy",
  name: "Energy Services Agent",
  description:
    "Expert on energy services: electricity (Ρεύμα) rates, natural gas (Αέριο), photovoltaics (Φωτοβολταϊκά), EV charging, and energy storage. Quotes verified rates from the knowledge base.",
  primaryTool: "search_knowledge_energy",
  tools: [knowledgeTool("energy"), tools.search_leads],
};

// ── Insurance Agent ──
export const insuranceAgent: AgentDef = {
  id: "insurance",
  name: "Insurance Agent",
  description:
    "Expert on insurance products: life insurance, health insurance, car insurance, and property insurance. Quotes verified coverage from the knowledge base.",
  primaryTool: "search_knowledge_insurance",
  tools: [knowledgeTool("insurance"), tools.search_leads],
};

// ── Lead & CRM Agent ──
export const leadCrmAgent: AgentDef = {
  id: "leadcrm",
  name: "Lead & CRM Agent",
  description:
    "Specialist on CRM data: finds leads, deals, pipeline metrics and invoices. Answers questions about the sales pipeline and CRM records. Read-only.",
  primaryTool: "search_leads",
  tools: [
    tools.search_leads,
    tools.search_deals,
    tools.get_pipeline_metrics,
    tools.get_invoices,
  ],
};

// ── Intelligence / Analytics Agent ──
export const analyticsAgent: AgentDef = {
  id: "analytics",
  name: "Business Intelligence Agent",
  description:
    "Analyzes the sales pipeline, invoice status, and win rates to provide business intelligence and forecasts based on actual CRM data.",
  primaryTool: "get_pipeline_metrics",
  tools: [
    tools.get_pipeline_metrics,
    tools.search_deals,
    tools.get_invoices,
    tools.search_leads,
  ],
};

// ── General Knowledge Agent ──
export const generalAgent: AgentDef = {
  id: "general",
  name: "General Knowledge Agent",
  description:
    "Answers general questions about the company Agapitos Kalafatas using the company knowledge base across all service categories.",
  primaryTool: "search_knowledge_general",
  tools: [knowledgeTool("all")],
};

export const ALL_AGENTS: AgentDef[] = [
  webDevAgent,
  energyAgent,
  insuranceAgent,
  leadCrmAgent,
  analyticsAgent,
  generalAgent,
];

export function findAgent(id: string): AgentDef | undefined {
  return ALL_AGENTS.find((a) => a.id === id);
}
