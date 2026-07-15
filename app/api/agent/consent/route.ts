// The regulated consent core.
//
// GET  ?privyDid=&experimentId=  → the study's real IRB-approved ICF + a
//      comprehension quiz generated from it (answer key withheld). The quiz is
//      cached in the consent conversation so grading is consistent + auditable.
//
// POST { action }:
//   'submit_quiz' → grade answers against the cached quiz (must pass to proceed)
//   'affirm'      → only after passing: capture explicit, timestamped consent tied
//                   to the exact ICF version + hash, write consent_records, enroll.

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { generateConsentQuiz, type ConsentQuizQuestion } from '@/lib/agent/consent-quiz';

type Db = ReturnType<typeof createServiceClient>;

interface CachedQuiz {
  icf_hash: string;
  questions: ConsentQuizQuestion[];
  passed: boolean;
  last_score: number | null;
}

// ── ICF lookup ──────────────────────────────────────────────────────────────
async function loadIcf(db: Db, experimentId: string) {
  const { data } = await db
    .from('study_documents')
    .select('id, title, version, content_html, content_hash, file_path')
    .eq('experiment_id', experimentId)
    .eq('document_type', 'consent_form')
    .in('status', ['approved', 'signed', 'pending_signature'])
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as {
    id: string; title: string; version: number | null;
    content_html: string | null; content_hash: string | null; file_path: string | null;
  } | null;
}

// ── Consent conversation (holds the cached quiz, server-side only) ────────────
async function getConsentConvo(db: Db, participantId: string, experimentId: string) {
  const { data } = await db
    .from('agent_conversations')
    .select('id, extracted_data, status')
    .eq('participant_id', participantId)
    .eq('stage', 'consent')
    .eq('experiment_id', experimentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) return data as { id: string; extracted_data: Record<string, unknown>; status: string };

  const { data: created } = await db
    .from('agent_conversations')
    .insert({ participant_id: participantId, stage: 'consent', experiment_id: experimentId, messages: [], extracted_data: {} })
    .select('id, extracted_data, status')
    .single();

  return created as { id: string; extracted_data: Record<string, unknown>; status: string };
}

async function alreadyConsented(db: Db, participantId: string, experimentId: string): Promise<boolean> {
  const { data } = await db
    .from('consent_records')
    .select('id')
    .eq('participant_id', participantId)
    .eq('experiment_id', experimentId)
    .eq('consent_given', true)
    .eq('withdrawn', false)
    .maybeSingle();
  return !!data;
}

// ── GET: present ICF + quiz ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const privyDid     = req.nextUrl.searchParams.get('privyDid');
  const experimentId = req.nextUrl.searchParams.get('experimentId');
  if (!privyDid || !experimentId) {
    return NextResponse.json({ error: 'privyDid and experimentId required' }, { status: 400 });
  }

  const db = createServiceClient();

  if (await alreadyConsented(db, privyDid, experimentId)) {
    return NextResponse.json({ ready: true, alreadyConsented: true });
  }

  const icf = await loadIcf(db, experimentId);
  if (!icf || !icf.content_html) {
    return NextResponse.json({ ready: false, reason: 'no_icf',
      message: 'This study has no readable consent document available yet.' });
  }

  const icfHash = icf.content_hash ?? `len:${icf.content_html.length}`;
  const convo = await getConsentConvo(db, privyDid, experimentId);
  const cached = (convo.extracted_data?.consent_quiz as CachedQuiz | undefined);

  let quiz: CachedQuiz;
  if (cached && cached.icf_hash === icfHash && cached.questions?.length) {
    quiz = cached;
  } else {
    const questions = await generateConsentQuiz(icf.content_html);
    if (questions.length === 0) {
      return NextResponse.json({ ready: false, reason: 'quiz_unavailable',
        message: 'Could not prepare the comprehension check. A team member will assist.' });
    }
    quiz = { icf_hash: icfHash, questions, passed: false, last_score: null };
    await db.from('agent_conversations')
      .update({ extracted_data: { ...convo.extracted_data, consent_quiz: quiz }, updated_at: new Date().toISOString() })
      .eq('id', convo.id);
  }

  return NextResponse.json({
    ready: true,
    alreadyConsented: false,
    icf: { title: icf.title, version: String(icf.version ?? 1), hash: icfHash, html: icf.content_html },
    quiz: quiz.questions.map((q) => ({ question: q.question, options: q.options })),
    quizPassed: quiz.passed,
  });
}

// ── POST: submit quiz / affirm consent ────────────────────────────────────────
const postSchema = z.union([
  z.object({ privyDid: z.string().min(1), experimentId: z.string().uuid(),
             action: z.literal('submit_quiz'), answers: z.array(z.number().int().min(0)).min(1).max(10) }),
  z.object({ privyDid: z.string().min(1), experimentId: z.string().uuid(),
             action: z.literal('affirm'), affirmed: z.literal(true) }),
]);

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof postSchema>;
  try {
    parsed = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { privyDid, experimentId, action } = parsed;
  const db = createServiceClient();
  const convo = await getConsentConvo(db, privyDid, experimentId);
  const cached = convo.extracted_data?.consent_quiz as CachedQuiz | undefined;

  if (!cached || !cached.questions?.length) {
    return NextResponse.json({ error: 'Load the consent document first' }, { status: 409 });
  }

  // ── Grade the comprehension quiz ─────────────────────────────────────────────
  if (action === 'submit_quiz') {
    const answers = parsed.answers;
    let score = 0;
    const responses = cached.questions.map((q, i) => {
      const correct = answers[i] === q.answerIndex;
      if (correct) score += 1;
      return { question: q.question, concept: q.concept, chosen: answers[i] ?? null, correct };
    });
    const passed = score === cached.questions.length;

    const updatedQuiz: CachedQuiz = { ...cached, passed, last_score: score };
    await db.from('agent_conversations')
      .update({ extracted_data: { ...convo.extracted_data, consent_quiz: updatedQuiz, consent_quiz_responses: responses },
                updated_at: new Date().toISOString() })
      .eq('id', convo.id);

    return NextResponse.json({ passed, score, total: cached.questions.length,
      // Tell them which protective concepts to revisit, not the answers.
      revisit: passed ? [] : responses.filter((r) => !r.correct).map((r) => r.concept) });
  }

  // ── Affirm consent — only after passing ──────────────────────────────────────
  if (!cached.passed) {
    return NextResponse.json({ error: 'Comprehension quiz must be passed before consenting' }, { status: 403 });
  }
  if (await alreadyConsented(db, privyDid, experimentId)) {
    return NextResponse.json({ enrolled: true, alreadyConsented: true });
  }

  const icf = await loadIcf(db, experimentId);
  if (!icf) return NextResponse.json({ error: 'Consent document unavailable' }, { status: 409 });
  const icfHash = icf.content_hash ?? cached.icf_hash;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const now = new Date().toISOString();

  // Formal consent artifact.
  const { error: crErr } = await db.from('consent_records').insert({
    participant_id:            privyDid,
    experiment_id:             experimentId,
    icf_version:               String(icf.version ?? 1),
    icf_document_hash:         icfHash,
    comprehension_quiz_score:  cached.last_score ?? cached.questions.length,
    comprehension_quiz_passed: true,
    quiz_responses:            convo.extracted_data?.consent_quiz_responses ?? null,
    consent_given:             true,
    consent_timestamp:         now,
    consent_ip:                ip,
  });
  if (crErr) return NextResponse.json({ error: `consent: ${crErr.message}` }, { status: 500 });

  // ── Enroll (2c): application → enrolled + pseudonymised study-participant map ──
  const enrollment = await enroll(db, privyDid, experimentId);

  await db.from('agent_conversations').update({ status: 'complete', updated_at: now }).eq('id', convo.id);

  return NextResponse.json({ enrolled: true, ...enrollment });
}

// Create/advance the application and the pseudonymised study identity map.
async function enroll(db: Db, participantId: string, experimentId: string) {
  const now = new Date().toISOString();

  // Find or create the application, set to enrolled + agreement accepted.
  const { data: existingApp } = await db
    .from('applications')
    .select('id')
    .eq('experiment_id', experimentId)
    .eq('participant_id', participantId)
    .maybeSingle();

  let applicationId: string;
  if (existingApp) {
    applicationId = (existingApp as { id: string }).id;
    await db.from('applications')
      .update({ status: 'enrolled', study_agreement_accepted_at: now, eligibility_status: 'eligible' })
      .eq('id', applicationId);
  } else {
    const { data: created } = await db.from('applications').insert({
      experiment_id: experimentId, participant_id: participantId, status: 'enrolled',
      applied_at: now, payout_status: 'pending', study_agreement_accepted_at: now, eligibility_status: 'eligible',
    }).select('id').single();
    applicationId = (created as { id: string }).id;
  }

  // Pseudonymised per-study identity. (encrypted_identity_blob is a server-side
  // placeholder; production replaces it with a client-encrypted blob.)
  const spId       = `SP-${randomBytes(4).toString('hex').toUpperCase()}`;
  const pseudonym  = `Participant ${randomBytes(2).toString('hex').toUpperCase()}`;
  const blob       = Buffer.from(JSON.stringify({ platform_participant_id: participantId })).toString('base64');

  await db.from('study_participant_map').upsert({
    experiment_id:           experimentId,
    application_id:          applicationId,
    study_participant_id:    spId,
    study_pseudonym:         pseudonym,
    platform_participant_id: participantId,
    encrypted_identity_blob: blob,
    key_delivered_to_client: false,
  }, { onConflict: 'experiment_id,application_id' });

  return { applicationId, studyParticipantId: spId };
}
