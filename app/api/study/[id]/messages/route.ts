// GET  /api/study/[id]/messages?privyDid=  — fetch thread for participant
// POST /api/study/[id]/messages?privyDid=  — send a message to the research team

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

const ENROLLED = ['approved', 'active', 'enrolled', 'completed'];

// ── Shape types ──────────────────────────────────────────────────────────────

type MapRow = {
  study_participant_id: string;
  study_pseudonym: string | null;
};

type MessageRow = {
  id: string;
  sender_type: string;
  sender_study_participant_id: string | null;
  recipient_type: string;
  recipient_study_participant_id: string | null;
  message_text: string;
  message_type: string;
  read_at: string | null;
  created_at: string;
};

type DisplayMessage = {
  id: string;
  senderType: string;
  senderLabel: string;
  isMe: boolean;
  recipientType: string;
  text: string;
  messageType: string;
  readAt: string | null;
  createdAt: string;
};

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) {
    return NextResponse.json({ error: 'privyDid required' }, { status: 400 });
  }

  const experimentId = params.id;
  const db = createServiceClient();

  // Look up the participant's pseudonymous study identity
  const { data: mapRaw } = await db
    .from('study_participant_map')
    .select('study_participant_id, study_pseudonym')
    .eq('experiment_id', experimentId)
    .eq('platform_participant_id', privyDid)
    .maybeSingle();

  const mapRow = mapRaw as MapRow | null;

  if (!mapRow) {
    // Not yet enrolled in map — chat not yet available
    return NextResponse.json({ messages: [], myStudyId: null, myPseudonym: null });
  }

  const myId = mapRow.study_participant_id;

  // Fetch messages visible to this participant
  const { data: msgsRaw, error: msgsErr } = await db
    .from('study_messages')
    .select(
      'id, sender_type, sender_study_participant_id, recipient_type, ' +
      'recipient_study_participant_id, message_text, message_type, read_at, created_at',
    )
    .eq('experiment_id', experimentId)
    .or(
      `recipient_study_participant_id.eq.${myId},` +
      `recipient_type.eq.all_participants,` +
      `sender_study_participant_id.eq.${myId}`,
    )
    .order('created_at', { ascending: true })
    .limit(100);

  if (msgsErr) {
    return NextResponse.json({ error: msgsErr.message }, { status: 500 });
  }

  const msgs = (msgsRaw ?? []) as unknown as MessageRow[];

  // Mark unread inbound researcher messages as read
  const unreadIds = msgs
    .filter(
      (m) =>
        m.sender_type === 'researcher' &&
        m.read_at === null &&
        (m.recipient_study_participant_id === myId || m.recipient_type === 'all_participants'),
    )
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await db
      .from('study_messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds);
  }

  // Map to safe display shape — no platform identity leak
  const messages: DisplayMessage[] = msgs.map((m) => {
    const isMe = m.sender_study_participant_id === myId;
    const senderLabel =
      m.sender_type === 'researcher'
        ? 'Research Team'
        : m.sender_type === 'system'
          ? 'System'
          : isMe
            ? (mapRow.study_pseudonym ?? 'You')
            : 'Participant';
    return {
      id:            m.id,
      senderType:    m.sender_type,
      senderLabel,
      isMe,
      recipientType: m.recipient_type,
      text:          m.message_text,
      messageType:   m.message_type,
      readAt:        m.read_at,
      createdAt:     m.created_at,
    };
  });

  return NextResponse.json({
    messages,
    myStudyId:    myId,
    myPseudonym:  mapRow.study_pseudonym ?? null,
  });
}

// ── POST ─────────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  message_text: z.string().min(1).max(4000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) {
    return NextResponse.json({ error: 'privyDid required' }, { status: 400 });
  }

  const experimentId = params.id;
  const db = createServiceClient();

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body' }, { status: 400 });
  }

  const { message_text } = parsed.data;

  // Verify enrollment
  const { data: appCheck } = await db
    .from('applications')
    .select('id')
    .eq('participant_id', privyDid)
    .eq('experiment_id', experimentId)
    .in('status', ENROLLED)
    .maybeSingle();

  if (!appCheck) {
    return NextResponse.json({ error: 'Not enrolled in this study' }, { status: 403 });
  }

  // Look up pseudonymous study id
  const { data: mapRaw } = await db
    .from('study_participant_map')
    .select('study_participant_id')
    .eq('experiment_id', experimentId)
    .eq('platform_participant_id', privyDid)
    .maybeSingle();

  const mapRow = mapRaw as { study_participant_id: string } | null;

  // Insert message
  const { error: insertErr } = await db.from('study_messages').insert({
    experiment_id:               experimentId,
    sender_type:                 'participant',
    sender_study_participant_id: mapRow?.study_participant_id ?? null,
    recipient_type:              'researcher',
    message_text,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
