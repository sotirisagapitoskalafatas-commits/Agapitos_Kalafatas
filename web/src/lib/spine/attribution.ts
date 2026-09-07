export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_path: string | null;
};

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export function sanitizeValue(v: string | null | undefined, max = 512): string | null {
  if (v === null || v === undefined) return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, max);
}

export function emptyAttribution(): Attribution {
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    referrer: null,
    landing_path: null,
  };
}

export function parseAttribution(
  search: string,
  referrer?: string | null,
  path?: string | null
): Attribution {
  const params = new URLSearchParams(search || "");
  const out = emptyAttribution();
  for (const key of UTM_KEYS) {
    out[key] = sanitizeValue(params.get(key));
  }
  out.referrer = sanitizeValue(referrer, 1024);
  out.landing_path = sanitizeValue(path, 512);
  return out;
}

export function attributionToDbRecord(a: Attribution): Partial<Attribution> {
  return { ...a };
}