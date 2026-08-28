// Core specialist agents, each with tenant-scoped tools.
import type { AgentDef } from "./registry";
import {
  searchKnowledge,
  lookupLead,
  searchDeals,
  getPipelineMetrics,
  getInvoices,
  getTasks,
  getCommunications,
  listDocuments,
} from "./knowledge";
import { proposeAction } from "./approvals";
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

  get_tasks: {
    name: "get_tasks",
    description: "List tasks, optionally filtered by status or assignee. Read-only.",
    category: "read",
    argsSchema: {
      type: "object",
      properties: { status: { type: "string" }, assignee: { type: "string" }, limit: { type: "number" } },
    },
    run: (ctx: AgentContext, args: any) => getTasks(ctx, args),
  } as Tool,

  get_communications: {
    name: "get_communications",
    description: "List communications log entries (email, phone, sms, whatsapp). Read-only.",
    category: "read",
    argsSchema: {
      type: "object",
      properties: { channel: { type: "string" }, limit: { type: "number" } },
    },
    run: (ctx: AgentContext, args: any) => getCommunications(ctx, args),
  } as Tool,

  list_documents: {
    name: "list_documents",
    description: "List the client document vault files. Read-only.",
    category: "read",
    argsSchema: {
      type: "object",
      properties: { limit: { type: "number" } },
    },
    run: (ctx: AgentContext, args: any) => listDocuments(ctx, args),
  } as Tool,

  // ── Approval-gated WRITE tools ──
  // These only STAGE a proposal; nothing is written until an admin approves.
  propose_create_lead: {
    name: "propose_create_lead",
    description:
      "PROPOSES creating a new CRM lead. Does NOT save yet — requires admin approval. Use only when the user has supplied at least a name and contact.",
    category: "write",
    argsSchema: {
      type: "object",
      properties: {
        fullName: { type: "string", description: "Full name of the lead" },
        email: { type: "string" },
        phone: { type: "string" },
        company: { type: "string" },
        notes: { type: "string" },
        status: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["fullName"],
    },
    run: (ctx, args) =>
      proposeAction(ctx, {
        actionType: "create_lead",
        payload: args,
        summary: `Create lead: ${args.fullName}${args.email ? ` (${args.email})` : ""}${args.phone ? ` · ${args.phone}` : ""}`,
      }),
  } as Tool,

  propose_create_deal: {
    name: "propose_create_deal",
    description: "PROPOSES creating a new pipeline deal. Requires admin approval.",
    category: "write",
    argsSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        value: { type: "number" },
        stage: { type: "string" },
        probability: { type: "number" },
        notes: { type: "string" },
      },
      required: ["title"],
    },
    run: (ctx, args) =>
      proposeAction(ctx, {
        actionType: "create_deal",
        payload: args,
        summary: `Create deal: ${args.title} (${args.value ? `€${args.value}` : "no value"})`,
      }),
  } as Tool,

  propose_create_event: {
    name: "propose_create_event",
    description: "PROPOSES creating a calendar event / task reminder. Requires admin approval.",
    category: "write",
    argsSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        eventType: { type: "string" },
        startsAt: { type: "string", description: "ISO timestamp" },
        endsAt: { type: "string" },
      },
      required: ["title", "startsAt"],
    },
    run: (ctx, args) =>
      proposeAction(ctx, {
        actionType: "create_event",
        payload: args,
        summary: `Create event: ${args.title} at ${args.startsAt}`,
      }),
  } as Tool,

  propose_send_email: {
    name: "propose_send_email",
    description:
      "PROPOSES sending an email notification. Requires admin approval. Only use when the user explicitly asks to send a message.",
    category: "write",
    argsSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email" },
        subject: { type: "string" },
        html: { type: "string", description: "HTML body" },
      },
      required: ["to", "subject", "html"],
    },
    run: (ctx, args) =>
      proposeAction(ctx, {
        actionType: "send_email",
        payload: args,
        summary: `Send email to ${args.to}: “${args.subject}”`,
      }),
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

// ── Communications Agent ──
export const commsAgent: AgentDef = {
  id: "comms",
  name: "Communications Agent",
  description:
    "Handles outbound communication: reads the communications log, and can propose sending emails (requires approval). Never sends without explicit user request.",
  primaryTool: "get_communications",
  tools: [tools.get_communications, tools.propose_send_email, tools.search_leads],
};

// ── Tasks Agent ──
export const tasksAgent: AgentDef = {
  id: "tasks",
  name: "Tasks Agent",
  description:
    "Manages tasks and to-dos: reads the task list and can propose creating calendar events/reminders (requires approval).",
  primaryTool: "get_tasks",
  tools: [tools.get_tasks, tools.propose_create_event, tools.search_leads],
};

// ── Documents Agent ──
export const documentsAgent: AgentDef = {
  id: "documents",
  name: "Documents Agent",
  description:
    "Handles the client document vault: lists stored documents and their locations. Read-only.",
  primaryTool: "list_documents",
  tools: [tools.list_documents],
};

// ── Operations / Support Agent ──
export const operationsAgent: AgentDef = {
  id: "operations",
  name: "Operations & Support Agent",
  description:
    "General operations assistant: combines CRM leads/deals/events/invoices, proposes new leads, deals and events when the user asks to add them (each requires approval).",
  primaryTool: "search_leads",
  tools: [
    tools.search_leads,
    tools.search_deals,
    tools.get_tasks,
    tools.get_invoices,
    tools.propose_create_lead,
    tools.propose_create_deal,
    tools.propose_create_event,
  ],
};

export const ALL_AGENTS: AgentDef[] = [
  webDevAgent,
  energyAgent,
  insuranceAgent,
  leadCrmAgent,
  analyticsAgent,
  commsAgent,
  tasksAgent,
  documentsAgent,
  operationsAgent,
  generalAgent,
];

export function findAgent(id: string): AgentDef | undefined {
  return ALL_AGENTS.find((a) => a.id === id);
}
