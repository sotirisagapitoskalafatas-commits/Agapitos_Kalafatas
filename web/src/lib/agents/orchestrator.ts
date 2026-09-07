// Master orchestrator: routes user requests to specialist agents,
// runs the model tier cascade, and records audit trail.
import { runAgent, type AgentDef } from "./registry";
import { ALL_AGENTS, findAgent, generalAgent } from "./core-agents";
import { getModelClient, type ChatMessage } from "./model-client";
import { decideTier } from "./router";
import type { AgentCall, AgentContext, AgentResult, AuditRecord, Tier, Tool } from "./types";
import { supabase } from "./db";

// Public (unauthenticated) mode only ever reaches these service-advisory
// agents. The CRM/communications/tasks agents hold PII and are admin-only.
const PUBLIC_AGENTS = new Set(["webdev", "energy", "insurance", "general"]);

const ORCHESTRATOR_SYSTEM = `You are Atlas Master — the orchestrating AI for Agapitos Kalafatas.
Your job is to understand the user's request and delegate it to the correct specialist agent.

Specialist agents you can delegate to:
${ALL_AGENTS.map((a) => `- ${a.id}: ${a.description}`).join("\n")}

RULES:
- Pick the single most relevant agent for the request.
- Respond with ONLY a JSON object: {"agent": "<agentId>", "reason": "<one line>"}
- For multi-part requests, choose the dominant topic.
- Assistant messages here are always the orchestrator's own briefing.
`;

export type ProgressEvent =
  | { stage: "routing"; message: string; agent?: string }
  | { stage: "running"; message: string; agent: string; tier: Tier }
  | { stage: "done"; message: string };

export type ProgressReporter = (event: ProgressEvent) => void;

export type OrchestrateOptions = {
  // Restrict routing to service-advisory agents and expose ONLY knowledge-base
  // read tools (no CRM/PII tools). Used by the public /api/chat.
  publicMode?: boolean;
  // Extra tools layered on the selected agent (e.g. public lead capture).
  extraTools?: Tool[];
  // Extra system-instruction text (forced language / marketing mode).
  systemExtra?: string;
  // Prior conversation turns for multi-turn context (internal-only callers).
  history?: ChatMessage[];
};

export async function orchestrate(
  context: AgentContext,
  userInput: string,
  onProgress?: ProgressReporter,
  opts: OrchestrateOptions = {}
): Promise<AgentResult> {
  const llm = getModelClient();
  const steps: AgentCall[] = [];
  const start = Date.now();

  try {
    // 1. Route to the right agent (use small model — cheap routing)
    onProgress?.({ stage: "routing", message: "Analyzing your request and selecting the right specialist…" });
    const routed = await routeToAgent(llm, userInput);
    const routedAgent = findAgent(routed.agent) || ALL_AGENTS[ALL_AGENTS.length - 1];

    // Public mode: never route to CRM/admin agents.
    const baseAgent =
      opts.publicMode && !PUBLIC_AGENTS.has(routedAgent.id) ? generalAgent : routedAgent;

    // Public mode: expose ONLY knowledge-base read tools. Agents normally also
    // carry CRM read tools (search_leads, search_deals, …) which must never
    // reach an unauthenticated caller.
    let tools = baseAgent.tools;
    if (opts.publicMode) {
      tools = baseAgent.tools.filter(
        (t) => t.category === "read" && t.name.startsWith("search_knowledge_")
      );
    }
    const agent: AgentDef = { ...baseAgent, tools: [...tools, ...(opts.extraTools || [])] };

    // 2. Decide tier for quality/cost cascade
    const { tier } = decideTier(userInput);

    onProgress?.({
      stage: "running",
      message: `Handing off to ${agent.name} (${tier} model)…`,
      agent: agent.id,
      tier,
    });

    // 3. Run the specialist agent at the chosen tier
    const agentCall = await runAgent(context, agent, userInput, {
      tier,
      history: opts.history,
      systemExtra: opts.systemExtra,
    });
    steps.push(agentCall);

    const durationMs = Date.now() - start;

    const finalAnswer = `${agentCall.result}`;

    const result: AgentResult = {
      finalAnswer,
      steps,
      provider: llm.provider,
      model: llm.model,
    };

    // 4. Async audit (do not block response)
    recordAudit(context, {
      requestId: context.requestId,
      organizationId: context.organizationId,
      userId: context.userId,
      agentName: agent.name,
      input: userInput,
      outputSummary: finalAnswer,
      tier,
      provider: llm.provider,
      model: llm.model,
      durationMs,
    });

    onProgress?.({ stage: "done", message: "Done." });
    return result;
  } catch (e: any) {
    onProgress?.({ stage: "done", message: "Error." });
    return {
      finalAnswer: `Sorry, the agent orchestrator hit an error: ${e.message}`,
      steps,
      provider: llm.provider,
      model: llm.model,
    };
  }
}

async function routeToAgent(
  llm: ReturnType<typeof getModelClient>,
  userInput: string
): Promise<{ agent: string; reason: string }> {
  // Fast keyword routing first — avoids an LLM call for clear cases
  const kw = routeByKeywords(userInput);
  if (kw) return kw;

  try {
    const messages: ChatMessage[] = [
      { role: "system", content: ORCHESTRATOR_SYSTEM },
      { role: "user", content: userInput },
    ];
    const resp = await llm.chat(messages, []);
    const text = (resp.content || "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (data && data.agent) {
      return { agent: data.agent, reason: data.reason || "LLM routing" };
    }
  } catch {
    // fall through to keyword routing
  }

  return { agent: "general", reason: "fallback" };
}

function routeByKeywords(input: string): { agent: string; reason: string } | null {
  const text = input.toLowerCase();
  const has = (arr: string[]) => arr.some((k) => text.includes(k));

  if (has(["lead", "crm", "customer", "deal", "pipeline", "invoice", "client"]))
    return { agent: "leadcrm", reason: "keyword: CRM data" };
  if (has(["website", "e-shop", "eshop", "web", "software", "saas", "app", "ai agent", "application"]))
    return { agent: "webdev", reason: "keyword: web/software" };
  if (has(["energy", "electricity", "ρέυμα", "gas", "αέριο", "pv", "photovoltaic", "φωτοβολταϊκ", "ev", "charging"]))
    return { agent: "energy", reason: "keyword: energy" };
  if (has(["insurance", "ασφάλ", "assurance", "life", "health", "car", "property cover"]))
    return { agent: "insurance", reason: "keyword: insurance" };
  if (has(["analytics", "report", "forecast", "performance", "kpi", "win rate"]))
    return { agent: "analytics", reason: "keyword: analytics" };
  return null;
}

async function recordAudit(context: AgentContext, rec: AuditRecord) {
  try {
    await supabase.from("agent_audit").insert({
      request_id: rec.requestId,
      organization_id: rec.organizationId,
      user_id: rec.userId,
      agent_name: rec.agentName,
      input: rec.input,
      output_summary: rec.outputSummary,
      tier: rec.tier,
      provider: rec.provider,
      model: rec.model,
      duration_ms: rec.durationMs,
    });
  } catch (e) {
    console.error("Audit insertion failed (non-critical):", e);
  }
}

export type { Tier };
