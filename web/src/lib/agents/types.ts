// Shared agent types + Zod schemas for the master orchestrator.

export type AgentRole = "owner" | "admin" | "member";

export type AgentContext = {
  userId: string;
  organizationId: string;
  role: AgentRole;
  requestId: string;
};

export type AgentCall = {
  agent: string;
  input: string;
  result: string;
  durationMs: number;
  tier?: string;
};

export type AgentResult = {
  finalAnswer: string;
  steps: AgentCall[];
  tokens?: {
    input: number;
    output: number;
  };
  provider: string;
  model: string;
};

export type AuditRecord = {
  requestId: string;
  organizationId: string;
  userId: string;
  agentName: string;
  input: string;
  outputSummary: string;
  tier: string;
  provider: string;
  model: string;
  durationMs: number;
  createdAt?: string;
};

// Tier routing for the model cascade
export type Tier = "small" | "medium" | "large";

// A single tool that an agent can call
export type Tool = {
  name: string;
  description: string;
  category: "read" | "write" | "draft" | "external";
  argsSchema: Record<string, any>;
  run: (context: AgentContext, args: any) => Promise<any>;
};
