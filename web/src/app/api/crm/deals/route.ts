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
    .from('deals')
    .select('*, leads(first_name, last_name, phone, email)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = await req.json();
  const { data, error } = await supabase
    .from('deals')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('activity_log').insert({
    entity_type: 'deal',
    entity_id: data.id,
    action: 'created',
    details: { title: data.title, value: data.value },
  });

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { id, ...updates } = await req.json();
  updates.updated_at = new Date().toISOString();

  if (updates.stage === 'closed_won' || updates.stage === 'closed_lost') {
    updates.closed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('activity_log').insert({
    entity_type: 'deal',
    entity_id: id,
    action: 'updated',
    details: updates,
  });

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase.from('deals').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
