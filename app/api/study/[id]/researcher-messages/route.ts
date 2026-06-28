// Researcher side of the per-study chat room.
// GET  ?privyDid=  → the study thread (participants shown by pseudonym), marks
//                    inbound participant messages read.
// POST ?privyDid=  { messageText } → broadcast a message to all participants.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { canManageExperiment } from '@/lib/org/access';

type Db = ReturnType<typeof createServiceClient>;

interface MsgRow {
  id: string; sender_type: string; sender_study_participant_id: string | null;
  recipient_type: string; message_text: string; message_type: string;
  read_at: string | null; created_at: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: experimentId } = await params;
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const db: Db = createServiceClient();
  if (!(await canManageExperiment(db, privyDid, experimentId))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { data: rows } = await db
    .from('study_messages')
    .select('id, sender_type, sender_study_participant_id, recipient_type, message_text, message_type, read_at, created_at')
    .eq('experiment_id', experimentId)
    .order('created_at', { ascending: true })
    .limit(300);

  const msgs = (rows ?? []) as MsgRow[];

  // Map participant SP-ids → pseudonyms.
  const spIds = [...new Set(msgs.filter((m) => m.sender_study_participant_id).map((m) => m.sender_study_participant_id as string))];
  const pseudoBySp = new Map<string, string>();
  if (spIds.length > 0) {
    const { data: maps } = await db
      .from('study_participant_map')
      .select('study_participant_id, study_pseudonym')
      .eq('experiment_id', experimentId)
      .in('study_participant_id', spIds);
    for (const m of (maps ?? []) as { study_participant_id: string; study_pseudonym: string }[]) {
      pseudoBySp.set(m.study_participant_id, m.study_pseudonym);
    }
  }

  // Mark inbound (participant → researcher) unread messages read.
  const inboundUnread = msgs.filter((m) => m.sender_type === 'participant' && !m.read_at).map((m) => m.id);
  if (inboundUnread.length > 0) {
    await db.from('study_messages').update({ read_at: new Date().toISOString() }).in('id', inboundUnread);
  }

  return NextResponse.json({
    messages: msgs.map((m) => ({
      id:        m.id,
      fromResearcher: m.sender_type === 'researcher',
      isSystem:  m.sender_type === 'system' || m.message_type === 'system_notice',
      senderLabel: m.sender_type === 'researcher' ? 'You / research team'
        : m.sender_type === 'system' ? 'System'
        : (m.sender_study_participant_id ? pseudoBySp.get(m.sender_study_participant_id) ?? 'Participant' : 'Participant'),
      broadcast: m.recipient_type === 'all_participants',
      text:      m.message_text,
      createdAt: m.created_at,
    })),
  });
}

const postSchema = z.object({ privyDid: z.string().min(1), messageText: z.string().min(1).max(4000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: experimentId } = await params;
  let body: z.infer<typeof postSchema>;
  try { body = postSchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'messageText required' }, { status: 400 }); }

  const db: Db = createServiceClient();
  if (!(await canManageExperiment(db, body.privyDid, experimentId))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { error } = await db.from('study_messages').insert({
    experiment_id:  experimentId,
    sender_type:    'researcher',
    sender_user_id: body.privyDid,
    recipient_type: 'all_participants',
    message_text:   body.messageText,
    message_type:   'text',
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
