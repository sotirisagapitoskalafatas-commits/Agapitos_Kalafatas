import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, unauthorizedResponse } from '@/lib/admin-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { data, error } = await supabase
    .from('invoices')
    .select('*, leads(first_name, last_name)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = await req.json();

  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true });

  const invoiceNumber = `${body.type === 'quote' ? 'Q' : 'INV'}-${String((count || 0) + 1).padStart(4, '0')}`;

  const items = body.items || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
  const taxRate = body.tax_rate || 24;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...body,
      invoice_number: invoiceNumber,
      subtotal,
      tax_amount: taxAmount,
      total,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('activity_log').insert({
    entity_type: 'invoice',
    entity_id: data.id,
    action: 'created',
    details: { invoice_number: invoiceNumber, total, type: body.type },
  });

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { id, ...updates } = await req.json();

  if (updates.status === 'paid') {
    updates.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('activity_log').insert({
    entity_type: 'invoice',
    entity_id: id,
    action: 'updated',
    details: updates,
  });

  return NextResponse.json(data);
}
