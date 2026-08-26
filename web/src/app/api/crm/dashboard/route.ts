import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const now = new Date().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [leadsRes, dealsRes, commRes, invRes, eventsRes, recentActivity] = await Promise.all([
    supabase.from('leads').select('id, status, created_at, service_category'),
    supabase.from('deals').select('id, stage, value, currency, created_at'),
    supabase.from('communications').select('id, comm_type, created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('invoices').select('id, type, status, total, currency, created_at'),
    supabase.from('calendar_events').select('id, event_type, start_time, completed').gte('start_time', now).lte('start_time', new Date(Date.now() + 7 * 86400000).toISOString()),
    supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(20),
  ]);

  const leads = leadsRes.data || [];
  const deals = dealsRes.data || [];
  const comms = commRes.data || [];
  const invoices = invRes.data || [];
  const events = eventsRes.data || [];
  const activity = recentActivity.data || [];

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'new_lead').length;
  const customers = leads.filter(l => l.status === 'customer').length;
  const conversionRate = totalLeads > 0 ? ((customers / totalLeads) * 100).toFixed(1) : '0';

  const pipelineValue = deals
    .filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const wonRevenue = deals
    .filter(d => d.stage === 'closed_won')
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const pendingInvoices = invoices
    .filter(i => i.type === 'invoice' && ['sent', 'draft'].includes(i.status))
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const paidInvoices = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const commsThisMonth = comms.length;

  const serviceBreakdown: Record<string, number> = {};
  leads.forEach(l => {
    const cat = l.service_category || 'Άλλο';
    serviceBreakdown[cat] = (serviceBreakdown[cat] || 0) + 1;
  });

  const stageBreakdown: Record<string, number> = {};
  deals.forEach(d => {
    stageBreakdown[d.stage] = (stageBreakdown[d.stage] || 0) + 1;
  });

  return NextResponse.json({
    kpis: {
      totalLeads,
      newLeads,
      customers,
      conversionRate,
      pipelineValue,
      wonRevenue,
      pendingInvoices,
      paidInvoices,
      commsThisMonth,
      upcomingEvents: events.length,
    },
    serviceBreakdown,
    stageBreakdown,
    upcomingEvents: events.slice(0, 10),
    recentActivity: activity,
  });
}
