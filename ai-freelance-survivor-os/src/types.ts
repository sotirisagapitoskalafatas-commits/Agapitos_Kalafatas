export type AgentRole = 'CEO'|'RESEARCHER'|'OPPORTUNITY_HUNTER'|'CLIENT_INTELLIGENCE'|'SALES'|'PROPOSAL'|'PLANNER'|'CODER'|'DESIGNER'|'CONTENT'|'DELIVERY'|'QA'|'CFO'|'CUSTOMER_SUCCESS'|'LEARNING';
export type AgentState = 'IDLE'|'SEARCHING'|'RESEARCHING'|'EVALUATING'|'PLANNING'|'AWAITING_APPROVAL'|'EXECUTING'|'VERIFYING'|'DELIVERING'|'WAITING'|'LEARNING'|'PAUSED'|'ERROR'|'DEAD';
export type JobState = 'DISCOVERED'|'RESEARCHED'|'SCORED'|'SELECTED'|'PROPOSAL_DRAFTED'|'AWAITING_APPROVAL'|'SUBMITTED'|'WAITING_FOR_CLIENT'|'WON'|'PLANNED'|'IN_PROGRESS'|'VERIFYING'|'QA'|'READY_FOR_DELIVERY'|'DELIVERED'|'PAYMENT_PENDING'|'PAID'|'LOST'|'FAILED'|'CANCELLED';
export type SurvivalState = 'ALIVE'|'CAUTION'|'CRITICAL'|'DEAD';
export type StrategyName = 'CONSERVATIVE'|'BALANCED'|'AGGRESSIVE'|'ENTREPRENEUR';
export type TransactionType = 'STARTING_CAPITAL'|'JOB_REVENUE'|'TOOL_EXPENSE'|'AI_INFERENCE_EXPENSE'|'MARKETPLACE_FEE'|'ADVERTISING_EXPENSE'|'REFUND'|'OTHER_INCOME'|'OTHER_EXPENSE';
export type ApprovalStatus = 'PENDING'|'APPROVED'|'REJECTED'|'EXPIRED';
export type EventName = 'AGENT_STARTED'|'AGENT_PAUSED'|'NEW_JOB_FOUND'|'OPPORTUNITY_SCORED'|'PROPOSAL_CREATED'|'APPROVAL_REQUESTED'|'APPROVAL_APPROVED'|'JOB_WON'|'JOB_FAILED'|'PAYMENT_RECEIVED'|'PAYMENT_FAILED'|'DEADLINE_APPROACHING'|'BROWSER_ERROR'|'TOOL_ERROR'|'BALANCE_LOW'|'REFLECTION_CREATED'|'MEMORY_CREATED';

export interface WalletState { balance:number; revenue:number; expenses:number; profit:number; currency:string; state:SurvivalState; }
export interface Opportunity { id:string; source:string; title:string; description:string; url?:string; budget:number; currency:string; estimatedHours:number; skills:string[]; clientName:string; clientRating:number; competition:number; deadlineHours:number; platformFeePct:number; difficulty:number; createdAt:string; }
export interface Score { winProbability:number; executionProbability:number; expectedRevenue:number; expectedCost:number; expectedProfit:number; expectedHourlyProfit:number; capitalRisk:number; customerQuality:number; repeatProbability:number; overall:number; confidence:number; evidence:string[]; }
export interface Proposal { id:string; opportunityId:string; text:string; price:number; status:ApprovalStatus|'SUBMITTED'; createdAt:string; }
export interface Job { id:string; opportunityId:string; title:string; clientName:string; revenue:number; state:JobState; estimatedHours:number; actualHours?:number; cost:number; profit?:number; createdAt:string; }
export interface Approval { id:string; type:string; targetId:string; description:string; amount?:number; risk:string; status:ApprovalStatus; createdAt:string; }
export interface Memory { id:string; kind:'SHORT_TERM'|'LONG_TERM'; text:string; importance:number; tags:string[]; source:string; createdAt:string; }
export interface AgentContext { task:string; role:AgentRole; objective:string; constraints:Record<string,unknown>; currentState:AgentState; wallet:WalletState; worldState:Record<string,unknown>; job?:Job; customer?:Record<string,unknown>; relevantMemory:Memory[]; availableTools:string[]; strategy:StrategyName; }
