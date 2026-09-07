export const RENEWAL_WINDOWS = [1, 3, 7, 14, 30, 60, 90] as const;

export type RenewalWindow = (typeof RENEWAL_WINDOWS)[number];

export type UpcomingRenewal = {
  leadId: string;
  daysLeft: number;
  window: number;
  renewalDate: string;
  name: string | null;
  email: string | null;
  service: string | null;
};

export function daysUntil(dateStr: string | null, now: Date = new Date()): number | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((target - today) / 86400000);
}

export function pickWindow(dateStr: string | null, now?: Date): RenewalWindow | null {
  const days = daysUntil(dateStr, now);
  if (days === null || days < 0) return null;
  for (const w of RENEWAL_WINDOWS) {
    if (days <= w) return w;
  }
  return null;
}

export function renewalIdempotencyKey(
  leadId: string,
  renewalDate: string,
  windowDays: number
): string {
  return `renew:${leadId}:${renewalDate}:${windowDays}`;
}

export function upcomingRenewals(
  rows: Array<{
    id: string;
    renewal_date: string | null;
    full_name?: string | null;
    email?: string | null;
    service_category?: string | null;
  }>,
  horizonDays = 30,
  now: Date = new Date()
): UpcomingRenewal[] {
  const out: UpcomingRenewal[] = [];
  for (const r of rows) {
    const days = daysUntil(r.renewal_date, now);
    if (days === null || days < 0 || days > horizonDays) continue;
    const window = pickWindow(r.renewal_date, now);
    if (window === null) continue;
    out.push({
      leadId: r.id,
      daysLeft: days,
      window,
      renewalDate: r.renewal_date as string,
      name: r.full_name ?? null,
      email: r.email ?? null,
      service: r.service_category ?? null,
    });
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}