// POST /api/agent/nudge  { privyDid }
// Sign-in engagement nudge: computes the participant's next best action
// (finish awareness modules → grow the community → start data contribution),
// has Haiku write one warm line for it, drops an in-app notification, and
// returns the nudge for the dashboard banner. Throttled to once per 48h.
// Compensation-suppression applies: never mentions money.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { TOTAL_MODULES } from '@/lib/agent/awareness-content';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-haiku-4-5-20251001';
const THROTTLE_MS = 48 * 3600 * 1000;

type NudgeKind = 'complete_courses' | 'invite_people' | 'start_data' | 'sync_data';

interface Nudge { kind: NudgeKind; title: string; message: string; href: string; cta: string }

const FALLBACKS: Record<NudgeKind, Omit<Nudge, 'kind'>> = {
  complete_courses: {
    title: 'Become a verified contributor',
    message: 'A few short lessons stand between you and verified status — verified members are matched to studies first.',
    href: '/learn', cta: 'Continue lessons →',
  },
  invite_people: {
    title: 'Grow the research community',
    message: 'Know someone who would value contributing to research? Invite them — three verified invites unlock Community Builder status.',
    href: '/dashboard#referrals', cta: 'Invite someone →',
  },
  start_data: {
    title: 'Start your health record',
    message: 'Sync your first metrics or add a health report to begin your longitudinal record — it helps match you to studies that fit you.',
    href: '/dashboard#data-hub', cta: 'Start contributing →',
  },
  sync_data: {
    title: 'Keep your record current',
    message: 'It has been a while since your last sync — a fresh snapshot keeps your longitudinal record meaningful.',
    href: '/dashboard#data-hub', cta: 'Sync now →',
  },
};

const SYSTEM = `You write ONE short, warm nudge (max 30 words) for a research-community member.
Rules: never mention money, payment, earning, rewards, bounties, or compensation of any kind.
Frame everything as contribution to research and community. No emoji. No exclamation overload.
Return only the sentence.`;

export async function POST(req: NextRequest) {
  let body: { privyDid: string };
  try { body = z.object({ privyDid: z.string().min(1) }).parse(await req.json()); }
  catch { return NextResponse.json({ error: 'privyDid required' }, { status: 400 }); }

  const db = createServiceClient();

  const { data: prof } = await db
    .from('participant_profiles')
    .select('user_id, verification_level, last_nudged_at, successful_referrals')
    .eq('user_id', body.privyDid)
    .maybeSingle();
  if (!prof) return NextResponse.json({ nudge: null });

  const p = prof as {
    verification_level: string | null; last_nudged_at: string | null; successful_referrals: number | null;
  };

  // Throttle: at most one nudge per 48h.
  if (p.last_nudged_at && Date.now() - new Date(p.last_nudged_at).getTime() < THROTTLE_MS) {
    return NextResponse.json({ nudge: null, throttled: true });
  }

  // ── Next best action ─────────────────────────────────────────────────────────
  const [{ data: progress }, { data: consents }, { data: lastSnap }] = await Promise.all([
    db.from('awareness_progress').select('quiz_passed').eq('participant_id', body.privyDid),
    db.from('data_consents').select('scope, granted, withdrawn_at').eq('participant_id', body.privyDid),
    db.from('health_data_snapshots').select('captured_at').eq('participant_id', body.privyDid)
      .order('captured_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const passed = (progress ?? []).filter((r) => (r as { quiz_passed: boolean }).quiz_passed).length;
  const hasDataConsent = ((consents ?? []) as Array<{ granted: boolean; withdrawn_at: string | null }>)
    .some((c) => c.granted && !c.withdrawn_at);
  const lastSync = (lastSnap as { captured_at: string } | null)?.captured_at ?? null;
  const syncStaleDays = lastSync ? Math.floor((Date.now() - new Date(lastSync).getTime()) / 86_400_000) : null;

  let kind: NudgeKind;
  if (passed < TOTAL_MODULES) kind = 'complete_courses';
  else if ((p.successful_referrals ?? 0) < 1) kind = 'invite_people';
  else if (!hasDataConsent || syncStaleDays === null) kind = 'start_data';
  else if (syncStaleDays > 14) kind = 'sync_data';
  else return NextResponse.json({ nudge: null }); // all caught up — stay quiet

  // ── AI-written line (fallback to static copy on any failure) ────────────────
  const fallback = FALLBACKS[kind];
  let message = fallback.message;
  try {
    const context =
      kind === 'complete_courses' ? `They have passed ${passed} of ${TOTAL_MODULES} short research-awareness lessons. Encourage finishing to become a verified contributor (verified members are matched to studies first).`
      : kind === 'invite_people'  ? 'They are verified and have not invited anyone yet. Encourage inviting someone who would value contributing to research.'
      : kind === 'start_data'     ? 'They have not started their longitudinal health record yet. Encourage syncing first metrics or adding a health report to help match them to fitting studies.'
      : `Their last data sync was ${syncStaleDays} days ago. Encourage a fresh snapshot to keep their longitudinal record meaningful.`;
    const r = await anthropic.messages.create({
      model: MODEL, max_tokens: 100, system: SYSTEM,
      messages: [{ role: 'user', content: context }],
    });
    const text = r.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text.trim();
    if (text && text.length > 10 && text.length < 260 &&
        !/\b(pay|paid|payment|earn|reward|bounty|compensat|money|\$)/i.test(text)) {
      message = text;
    }
  } catch { /* fallback copy already set */ }

  const nudge: Nudge = { kind, ...fallback, message };
  const now = new Date().toISOString();

  await Promise.all([
    db.from('notifications').insert({
      user_id: body.privyDid, type: 'nudge',
      payload: { title: nudge.title, message: nudge.message }, read: false,
    }),
    db.from('participant_profiles').update({ last_nudged_at: now }).eq('user_id', body.privyDid),
  ]);

  return NextResponse.json({ nudge });
}
