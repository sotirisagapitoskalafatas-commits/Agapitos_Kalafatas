export const CONSENT_VERSION = "v1";

export type ConsentPayload = {
  entity_type: string;
  entity_id: string | null;
  email: string | null;
  granted: boolean;
  consent_version: string;
  source: string | null;
  ip: string | null;
  user_agent: string | null;
  details: Record<string, unknown>;
};

function clean(v: string | null | undefined, max: number): string | null {
  if (v === null || v === undefined) return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, max);
}

export function buildConsentRecord(input: {
  entityId?: string | null;
  email?: string | null;
  granted?: boolean;
  consentVersion?: string;
  source?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
}): ConsentPayload {
  return {
    entity_type: "lead",
    entity_id: input.entityId ?? null,
    email: clean(input.email, 320),
    granted: input.granted ?? false,
    consent_version: input.consentVersion || CONSENT_VERSION,
    source: clean(input.source, 256),
    ip: clean(input.ip, 64),
    user_agent: clean(input.userAgent, 512),
    details: input.details ?? {},
  };
}