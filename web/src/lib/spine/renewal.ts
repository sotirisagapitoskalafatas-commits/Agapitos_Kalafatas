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

export type OverdueRenewal = {
  leadId: string;
  daysOverdue: number;
  renewalDate: string;
  name: string | null;
  email: string | null;
  service: string | null;
};

export function overdueRenewals(
  rows: Array<{
    id: string;
    renewal_date: string | null;
    full_name?: string | null;
    email?: string | null;
    service_category?: string | null;
    status?: string | null;
  }>,
  now: Date = new Date()
): OverdueRenewal[] {
  const out: OverdueRenewal[] = [];
  for (const r of rows) {
    if (!r.renewal_date) continue;
    const days = daysUntil(r.renewal_date, now);
    if (days === null || days >= 0) continue; // only strictly past
    out.push({
      leadId: r.id,
      daysOverdue: -days,
      renewalDate: r.renewal_date,
      name: r.full_name ?? null,
      email: r.email ?? null,
      service: r.service_category ?? null,
    });
  }
  return out.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

export type OwnerEmailCandidate = {
  id: string;
  leadId: string;
  renewalDate: string;
  daysLeft: number;
  windowDays: number;
  name: string | null;
};

/**
 * Pure filter for the optional owner email pass. A reminder qualifies only when
 * the renewal is still ahead (never re-email after the date has passed), the
 * window is within 7 days, and the reminder actually got a task. The DB-side
 * owner_email_sent_at guard (also checked in the query) prevents second sends.
 */
export function ownerEmailCandidates(
  reminders: Array<{
    id: string;
    lead_id: string;
    renewal_date: string | null;
    window_days: number;
    task_id: string | null;
    owner_email_sent_at: string | null;
    full_name?: string | null;
  }>,
  now: Date = new Date()
): OwnerEmailCandidate[] {
  const out: OwnerEmailCandidate[] = [];
  for (const r of reminders) {
    if (!r.task_id) continue; // must be materialized already
    if (r.window_days > 7) continue; // only act-now windows
    if (!r.renewal_date) continue;
    const days = daysUntil(r.renewal_date, now);
    if (days === null || days < 0) continue; // overdue never re-emails
    out.push({
      id: r.id,
      leadId: r.lead_id,
      renewalDate: r.renewal_date,
      daysLeft: days,
      windowDays: r.window_days,
      name: r.full_name ?? null,
    });
  }
  return out;
}