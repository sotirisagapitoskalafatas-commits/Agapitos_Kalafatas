// Proposal brain: scores opportunities against the active profile and
// stages bids through the existing approval-gated write system.
// "The LLM proposes; Postgres/RLS authorizes."
import type { AgentContext } from "../agents/types";
import { proposeAction } from "../agents/approvals";
import { supabase } from "./db";
import { planProposals, type ProposalPlan } from "./scoring";

export type { ProposalPlan };
export { planProposals };

// Server-side: create a proposal row, then stage the approval. The proposal is
// linked to the approval id so the CRM can show the full bid -> approve -> job path.
export async function stageProposals(
  context: AgentContext,
  agentId: string,
  plan: ProposalPlan,
): Promise<string[]> {
  const approvalIds: string[] = [];
  for (const s of plan.bidsStaged) {
    // 1. Persist the proposal itself (status "proposed", decision "bid").
    const { data: proposal, error: propErr } = await supabase
      .from("survivor_proposals")
      .insert({
        agent_id: agentId,
        opportunity_id: s.opportunity.id,
        source: "sandbox",
        score: s.score,
        decision: "bid",
        status: "proposed",
        rationale: s.reasons.join("; "),
      })
      .select()
      .single();
    if (propErr) throw new Error(propErr.message);

    // 2. Stage the approval-gated action with everything the executor needs.
    const result = await proposeAction(context, {
      actionType: "survivor_propose",
      payload: {
        proposalId: proposal.id,
        agentId,
        opportunityId: s.opportunity.id,
        title: s.opportunity.title,
        service_category: s.opportunity.service_category,
        value: s.opportunity.estimated_value,
        risk: s.opportunity.risk_percent,
        deadlineDays: s.opportunity.deadline_days,
        score: s.score,
        reasons: s.reasons,
      },
      summary: `Survivor bid: ${s.opportunity.title} — score ${s.score} (€${s.opportunity.estimated_value}, risk ${s.opportunity.risk_percent}%)`,
    });

    // 3. Link approval back onto the proposal.
    await supabase
      .from("survivor_proposals")
      .update({ approval_id: result.approvalId })
      .eq("id", proposal.id);

    approvalIds.push(result.approvalId);
  }
  return approvalIds;
}