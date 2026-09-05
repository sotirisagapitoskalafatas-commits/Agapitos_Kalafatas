// Connector layer for the Small Business Plugin.
//
// Each connector wraps an external tool (QuickBooks, Stripe, HubSpot, ...).
// For this first slice most connectors return CLEARLY-MARKED SAMPLE DATA so the
// commands, the Human-In-The-Loop approval flow, and the UI all work end-to-end
// without live credentials.
//
// The Stripe connector is LIVE: once a secret is available (the STRIPE_SECRET_KEY
// env var, or a service-role-only row in `integration_credentials`), `read()`
// calls the Stripe REST API directly (no SDK dependency). Without a secret it
// falls back to the marked sample set, exactly like the other connectors.
//
// Golden rule (unchanged): the agent can READ connector data, but client/finance-
// touching WRITES still go through the approval queue (agent_action_approvals).
// Nothing here ever sends or mutates an external system.

import { supabase } from "@/lib/agents/db";

export type ConnectorId =
  | "quickbooks"
  | "stripe"
  | "paypal"
  | "square"
  | "hubspot"
  | "gmail"
  | "calendar"
  | "docusign"
  | "slack"
  | "canva";

export interface ConnectorMeta {
  id: ConnectorId;
  name: string;
  purpose: string;
  stub: boolean;
}

// A single external "read" result a command node can consume.
export interface ConnectorData {
  connector: ConnectorId;
  stub: boolean;
  kind: string;
  items: Record<string, any>[];
}

// ---------------------------------------------------------------------------
// Stub data (sample, non-live). Each payload is a small believable business set.
// ---------------------------------------------------------------------------

const sampleInvoices = [
  { client: "TechCorp", invoice: "INV-1024", amount: 1200, daysLate: 4, history: "usually pays on time", email: "ap@techcorp.example" },
  { client: "Global Logistics", invoice: "INV-1011", amount: 4500, daysLate: 32, history: "frequently late", email: "billing@globallog.example" },
  { client: "Helios Energy", invoice: "INV-1030", amount: 890, daysLate: 9, history: "slow payer, responds to nudges", email: "finance@helios.example" },
  { client: "Astra Café", invoice: "INV-1008", amount: 340, daysLate: 41, history: "repeatedly overdue, no response", email: "astra@cafe.example" },
  { client: "Vertex Studio", invoice: "INV-1035", amount: 2050, daysLate: 2, history: "always on time", email: "hello@vertex.example" },
];

const sampleSettlements = [
  { client: "TechCorp", invoice: "INV-1024", amount: 1200, synced: false },
  { client: "Astra Café", invoice: "INV-1008", amount: 340, synced: false },
];

const sampleLeads = [
  { id: "L-101", name: "Maria Petrova", email: "maria@nova-industrial.gr", serviceCategory: "SaaS / Custom Software", comments: "Need a custom CRM for 40 users, urgent", status: "hot", phone: "6912345678" },
  { id: "L-102", name: "John Smith", email: "john@gmail.com", serviceCategory: "E-shop", comments: "Budget?", status: "warm", phone: "" },
  { id: "L-103", name: "Nikos Alexiou", email: "nikos@rooms-hotel.eu", serviceCategory: "Website", comments: "Hotel website + booking, open to a call", status: "hot", phone: "6978899000" },
  { id: "L-104", name: "Elena K.", email: "elena.k@gmail.com", serviceCategory: "Simplon", comments: "?", status: "cold", phone: "6900011222" },
];

const sampleDeals = [
  { deal: "Nova CRM Build", stage: "proposal", value: 18500, probability: 60 },
  { deal: "Rooms Hotel Site", stage: "qualified", value: 6400, probability: 45 },
  { deal: "Astra Refit", stage: "lead", value: 2100, probability: 20 },
  { deal: "Global Logistics Retainer", stage: "won", value: 12000, probability: 100 },
];

const sampleTasks = [
  { title: "Follow up with Nova on scope", priority: "high", due: "today" },
  { title: "Send Rooms Hotel estimate", priority: "high", due: "tomorrow" },
  { title: "Update QBO classes for Q3", priority: "medium", due: "this week" },
];

const sampleComms = [
  { client: "TechCorp", channel: "email", subject: "Re: Invoice #1024", sentAt: "2 days ago" },
  { client: "Astra Café", channel: "email", subject: "Reminder: Invoice #1008", sentAt: "last month" },
];

// ---------------------------------------------------------------------------
// Live Stripe connector (REST over fetch — no SDK dependency).
// ---------------------------------------------------------------------------

const STRIPE_API = "https://api.stripe.com/v1";

async function stripeApi<T = Record<string, any>>(
  secret: string,
  path: string,
  account?: string
): Promise<T> {
  const res = await fetch(`${STRIPE_API}/${path}`, {
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(account ? { "Stripe-Account": account } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Stripe API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function mapStripeTime(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString();
}

// Credential resolution order: STRIPE_SECRET_KEY env var (highest priority),
// then the service-role-only `integration_credentials` row (unique service_name =
// 'stripe'). metadata.account / metadata.connected_account selects a Connect
// account via the Stripe-Account header.
async function loadStripeCredential(): Promise<{ secret: string; account?: string } | null> {
  const envSecret = process.env.STRIPE_SECRET_KEY;
  if (envSecret) return { secret: envSecret };

  try {
    const { data } = await supabase
      .from("integration_credentials")
      .select("encrypted_token, is_enabled, metadata")
      .eq("service_name", "stripe")
      .maybeSingle();
    if (data?.is_enabled && data.encrypted_token) {
      const meta = (data.metadata || {}) as Record<string, any>;
      return {
        secret: data.encrypted_token, // production decrypts the app-level encryption here
        account: meta.account || meta.connected_account || undefined,
      };
    }
  } catch {
    // fall through to stub
  }
  return null;
}

async function readStripe(kind: string): Promise<ConnectorData> {
  const cred = await loadStripeCredential();
  if (!cred) {
    if (kind === "settlements") {
      return { connector: "stripe", stub: true, kind: "settlements", items: [...sampleSettlements] };
    }
    return { connector: "stripe", stub: true, kind, items: [] };
  }

  try {
    if (kind === "settlements") {
      const data = await stripeApi<{ data: any[] }>(cred.secret, "balance_transactions?limit=25", cred.account);
      return {
        connector: "stripe",
        stub: false,
        kind: "settlements",
        items: data.data.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          net: t.net,
          currency: t.currency,
          status: "settled",
          time: mapStripeTime(t.created),
        })),
      };
    }
    if (kind === "disputes") {
      const data = await stripeApi<{ data: any[] }>(cred.secret, "disputes?limit=25", cred.account);
      return {
        connector: "stripe",
        stub: false,
        kind: "disputes",
        items: data.data.map((d) => ({
          id: d.id,
          status: d.status,
          reason: d.reason,
          amount: d.amount,
          currency: d.currency,
          time: mapStripeTime(d.created),
        })),
      };
    }
    if (kind === "payments") {
      const data = await stripeApi<{ data: any[] }>(cred.secret, "charges?limit=25", cred.account);
      return {
        connector: "stripe",
        stub: false,
        kind: "payments",
        items: data.data.map((c) => ({
          id: c.id,
          client: c.billing_details?.name || undefined,
          email: c.receipt_email || undefined,
          amount: c.amount,
          currency: c.currency,
          status: c.status,
          paid: c.paid,
          time: mapStripeTime(c.created),
        })),
      };
    }
    return { connector: "stripe", stub: false, kind, items: [] };
  } catch (e: any) {
    console.error("Stripe read failed:", e.message);
    return { connector: "stripe", stub: false, kind, items: [] };
  }
}

// ---------------------------------------------------------------------------
// Connector implementations. All consumers call `getConnector(id)`.
// ---------------------------------------------------------------------------

interface Connector {
  meta: ConnectorMeta;
  read(kind: "invoices" | "settlements" | "leads" | "deals" | "tasks" | "comms" | string): Promise<ConnectorData>;
}

const connectors: Record<ConnectorId, Connector> = {
  quickbooks: {
    meta: { id: "quickbooks", name: "QuickBooks", purpose: "Invoices, books, P&L, cash flow, tax prep", stub: true },
    async read(kind) {
      if (kind === "invoices") {
        return { connector: "quickbooks", stub: true, kind: "invoices", items: [...sampleInvoices] };
      }
      if (kind === "cashflow") {
        return { connector: "quickbooks", stub: true, kind: "cashflow", items: [
          { bucket: "30-day", expected: 12400, flagged: false },
          { bucket: "60-day", expected: 9800, flagged: true, note: "2 large invoices sliding" },
          { bucket: "90-day", expected: 7100, flagged: false },
        ]};
      }
      return { connector: "quickbooks", stub: true, kind, items: [] };
    },
  },
  stripe: {
    meta: { id: "stripe", name: "Stripe", purpose: "Payments, disputes, refunds, settlements", stub: false },
    async read(kind) {
      return readStripe(kind);
    },
  },
  paypal: {
    meta: { id: "paypal", name: "PayPal", purpose: "Payments, disputes, refunds, settlements", stub: true },
    async read() {
      return { connector: "paypal", stub: true, kind: "payments", items: [
        { client: "Vertex Studio", amount: 2050, status: "settled", at: "yesterday" },
      ]};
    },
  },
  square: {
    meta: { id: "square", name: "Square", purpose: "Payments, disputes, refunds, settlements", stub: true },
    async read() {
      return { connector: "square", stub: true, kind: "payments", items: [] };
    },
  },
  hubspot: {
    meta: { id: "hubspot", name: "HubSpot", purpose: "Leads, deals, contacts, tickets", stub: true },
    async read(kind) {
      if (kind === "leads") return { connector: "hubspot", stub: true, kind: "leads", items: [...sampleLeads] };
      if (kind === "deals") return { connector: "hubspot", stub: true, kind: "deals", items: [...sampleDeals] };
      if (kind === "tickets") return { connector: "hubspot", stub: true, kind: "tickets", items: [
        { subject: "Where is my order?", status: "open", age: 2 },
      ]};
      return { connector: "hubspot", stub: true, kind, items: [] };
    },
  },
  gmail: {
    meta: { id: "gmail", name: "Gmail", purpose: "Customer emails, follow-ups, watch-list items", stub: true },
    async read(kind) {
      if (kind === "comms") return { connector: "gmail", stub: true, kind: "comms", items: [...sampleComms] };
      return { connector: "gmail", stub: true, kind, items: [] };
    },
  },
  calendar: {
    meta: { id: "calendar", name: "Google Calendar", purpose: "Call blocks, week-ahead planning", stub: true },
    async read(kind) {
      if (kind === "tasks") return { connector: "calendar", stub: true, kind: "tasks", items: [...sampleTasks] };
      return { connector: "calendar", stub: true, kind, items: [] };
    },
  },
  docusign: {
    meta: { id: "docusign", name: "DocuSign", purpose: "Contracts in and out for review and signing", stub: true },
    async read(kind) {
      if (kind === "contracts") return { connector: "docusign", stub: true, kind: "contracts", items: [
        { title: "Nova CRM Build — MSA", status: "awaiting_signature", party: "Nova Industrial" },
        { title: "Rooms Hotel — Website SOW", status: "out_for_review", party: "Rooms Hotel" },
      ]};
      return { connector: "docusign", stub: true, kind, items: [] };
    },
  },
  slack: {
    meta: { id: "slack", name: "Slack", purpose: "Team updates", stub: true },
    async read() {
      return { connector: "slack", stub: true, kind: "messages", items: [] };
    },
  },
  canva: {
    meta: { id: "canva", name: "Canva", purpose: "Marketing assets", stub: true },
    async read() {
      return { connector: "canva", stub: true, kind: "assets", items: [] };
    },
  },
};

// ---------------------------------------------------------------------------
// Connector availability + access
// ---------------------------------------------------------------------------

// Which connectors currently have credentials configured. For the stub phase we
// treat every connector as "available" so the whole menu works; swap this to read
// `integration_credentials` (service role) once real keys are wired.
export function availableConnectors(): ConnectorId[] {
  return Object.keys(connectors) as ConnectorId[];
}

export function missingConnectors(wanted: ConnectorId[]): ConnectorId[] {
  const have = new Set(availableConnectors());
  return wanted.filter((c) => !have.has(c));
}

export async function getConnector(id: ConnectorId): Promise<Connector> {
  const c = connectors[id];
  if (!c) throw new Error(`Unknown connector: ${id}`);
  return c;
}

export function listConnectorMeta(): ConnectorMeta[] {
  return Object.values(connectors).map((c) => c.meta);
}
