const STORAGE_KEY = "atlas.contact.idempotency";

export function getContactIdempotencyKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const key =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(STORAGE_KEY, key);
    return key;
  } catch {
    return undefined;
  }
}

export function clearContactIdempotencyKey(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function captureAttribution(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const out: Record<string, string> = {};
  try {
    const q = new URLSearchParams(window.location.search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const v = q.get(k);
      if (v) out[k] = v.slice(0, 512);
    }
    const ref = document.referrer && document.referrer !== window.location.href ? document.referrer : "";
    if (ref) out.referrer = ref.slice(0, 1024);
    out.landing_path = (window.location.pathname + window.location.search).slice(0, 512);
  } catch {
    /* noop */
  }
  return out;
}

export function appendSpineFields(body: FormData, locale?: string): void {
  const idem = getContactIdempotencyKey();
  if (idem) body.append("idempotency_key", idem);
  const attr = captureAttribution();
  for (const [k, v] of Object.entries(attr)) body.append(k, v);
  if (locale) body.append("locale", locale);
}