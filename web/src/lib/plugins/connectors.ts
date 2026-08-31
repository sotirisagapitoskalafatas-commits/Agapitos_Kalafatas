// Connector layer for the Small Business Plugin.
//
// Each connector wraps an external tool (QuickBooks, Stripe, HubSpot, ...).
// For this first slice the connectors return CLEARLY-MARKED SAMPLE DATA so the
// commands, the Human-In-The-Loop approval flow, and the UI all work end-to-end
// without live credentials. Swap the `run` bodies for real API calls once a
// connector's OAuth/secret is wired via `integration_credentials`.
//
// Golden rule (unchanged): the agent can READ connector data, but client/finance-
// touching WRITES still go through the approval queue (agent_action_approvals).
// Nothing here ever sends or mutates an external system.

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
    meta: { id: "stripe", name: "Stripe", purpose: "Payments, disputes, refunds, settlements", stub: true },
    async read(kind) {
      if (kind === "settlements") {
        return { connector: "stripe", stub: true, kind: "settlements", items: [...sampleSettlements] };
      }
      return { connector: "stripe", stub: true, kind, items: [] };
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
