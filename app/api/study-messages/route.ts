import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  privyDid:      z.string().min(1),
  experiment_id: z.string().uuid(),
  subject:       z.string().min(1).max(200),
  body:          z.string().min(1).max(5000),
  handoff_url:   z.string().url().startsWith('https').optional().or(z.literal('')),
});

// POST /api/study-messages
export async function POST(req: NextRequest) {
  const raw: unknown = await req.json();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { privyDid, experiment_id, subject, body, handoff_url } = parsed.data;
  const supabase = createServiceClient();

  // Verify experimenter owns the study
  const { data: exp } = await supabase
    .from('experiments')
    .select('id, experimenter_id, status')
    .eq('id', experiment_id)
    .single();

  if (!exp) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  if (exp.experimenter_id !== privyDid) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Count recipients (approved + enrolled participants)
  const { count } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('experiment_id', experiment_id)
    .in('status', ['approved', 'enrolled']);

  const recipientCount = count ?? 0;

  if (recipientCount === 0) {
    return NextResponse.json({ error: 'No approved or enrolled participants to message' }, { status: 400 });
  }

  const { data: msg, error } = await supabase
    .from('study_messages')
    .insert({
      experiment_id,
      sent_by:         privyDid,
      subject,
      body,
      handoff_url:     handoff_url || null,
      recipient_count: recipientCount,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: msg, recipient_count: recipientCount }, { status: 201 });
}

// GET /api/study-messages?experiment_id=...&privyDid=...
export async function GET(req: NextRequest) {
  const experiment_id = req.nextUrl.searchParams.get('experiment_id');
  const privyDid      = req.nextUrl.searchParams.get('privyDid');

  if (!experiment_id || !privyDid) {
    return NextResponse.json({ error: 'experiment_id and privyDid required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: exp } = await supabase
    .from('experiments')
    .select('experimenter_id')
    .eq('id', experiment_id)
    .single();

  if (!exp || exp.experimenter_id !== privyDid) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { data: messages } = await supabase
    .from('study_messages')
    .select('id, subject, body, handoff_url, sent_at, recipient_count')
    .eq('experiment_id', experiment_id)
    .order('sent_at', { ascending: false });

  return NextResponse.json({ messages: messages ?? [] });
}
