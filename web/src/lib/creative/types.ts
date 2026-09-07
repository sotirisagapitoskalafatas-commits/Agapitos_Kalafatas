// Creative Studio types + approval workflow FSM (pure, no I/O).

export type CreativeStatus =
  | "DRAFT"
  | "AI_GENERATED"
  | "VERIFICATION"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "READY_TO_PUBLISH"
  | "REJECTED";

export type WorkflowAction =
  | "generate"
  | "verify"
  | "verified"
  | "approve"
  | "ready"
  | "reject";

// User-approved linear flow:
// DRAFT → AI_GENERATED → VERIFICATION → PENDING_APPROVAL → APPROVED → READY_TO_PUBLISH
const TRANSITIONS: Record<WorkflowAction, Partial<Record<CreativeStatus, CreativeStatus>>> = {
  generate: { DRAFT: "AI_GENERATED" },
  verify: { AI_GENERATED: "VERIFICATION" },
  verified: { VERIFICATION: "PENDING_APPROVAL" },
  approve: { VERIFICATION: "APPROVED", PENDING_APPROVAL: "APPROVED" },
  ready: { APPROVED: "READY_TO_PUBLISH" },
  reject: { VERIFICATION: "REJECTED", PENDING_APPROVAL: "REJECTED" },
};

export function transitionStatus(current: CreativeStatus, action: WorkflowAction): CreativeStatus {
  const next = TRANSITIONS[action]?.[current];
  if (!next) {
    throw new Error(`Invalid workflow transition: ${current} --(${action})--> ?`);
  }
  return next;
}

export const CREATIVE_FLOW: CreativeStatus[] = [
  "DRAFT",
  "AI_GENERATED",
  "VERIFICATION",
  "PENDING_APPROVAL",
  "APPROVED",
  "READY_TO_PUBLISH",
  "REJECTED",
];

export const PLATFORMS = [
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "linkedin",
  "web",
  "generic",
] as const;

export const LANGUAGES = ["en", "gr", "fr"] as const;

export const OBJECTIVES = [
  "awareness",
  "engagement",
  "traffic",
  "leads",
  "conversions",
  "sales",
] as const;

export const TONES = ["professional", "warm", "playful", "urgent", "authoritative"] as const;

export type CopyVariant = {
  platform: string;
  language: string;
  headline?: string;
  primary_text?: string;
  short_text?: string;
  cta?: string;
  hashtags?: string[];
  alt_text?: string;
};

export type BrandCheck = {
  rule_type: string;
  rule_name: string;
  passed: boolean;
  severity: "info" | "warning" | "blocking";
  note?: string;
};

export type ComplianceFlag = {
  domain: string;
  claim: string;
  recommendation: string;
};

export type VerificationResult = {
  brand_checks: BrandCheck[];
  compliance: {
    needs_human_review: boolean;
    flags: ComplianceFlag[];
  };
  deterministic_pii: {
    found: boolean;
    matches: string[];
  };
  summary: string;
};

export type MediaFilter = {
  type?: string;
  status?: string;
  campaignId?: string;
  q?: string;
  limit?: number;
};