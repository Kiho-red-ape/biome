import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase/server';
import { OME_SYSTEM_PROMPT } from '@/lib/ome/system-prompt';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL     = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;

// Cost per million tokens (Haiku 4.5)
const COST_PER_M_INPUT  = 0.80;
const COST_PER_M_OUTPUT = 4.00;

export async function POST(req: NextRequest) {
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const body = await req.json() as {
    message: string;
    sessionId?: string;
    experimentId?: string;
  };

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'message required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // ── Resolve or create session ──────────────────────────────────
  let sessionId = body.sessionId;

  if (!sessionId) {
    const { data: session, error } = await supabase
      .from('ome_sessions')
      .insert({
        user_id:       privyDid,
        experiment_id: body.experimentId ?? null,
        title:         body.message.slice(0, 80),
        model_used:    MODEL,
      })
      .select('id')
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    sessionId = session.id as string;
  }

  // ── Load message history ───────────────────────────────────────
  const { data: history } = await supabase
    .from('ome_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(40);

  type Role = 'user' | 'assistant';
  const messages: { role: Role; content: string }[] = (history ?? [])
    .filter((m: { role: string; content: string }) => m.role === 'user' || m.role === 'assistant')
    .map((m: { role: string; content: string }) => ({ role: m.role as Role, content: m.content }));

  messages.push({ role: 'user', content: body.message });

  // ── Inject facility context if experimentId provided ──────────
  let systemPrompt = OME_SYSTEM_PROMPT;

  if (body.experimentId) {
    const { data: exp } = await supabase
      .from('experiments')
      .select('title, description, region, slots_total, duration_weeks, category')
      .eq('id', body.experimentId)
      .single();

    if (exp) {
      systemPrompt += `\n\n## Current study context\nTitle: ${exp.title}\nCategory: ${exp.category}\nRegion: ${exp.region ?? 'Not specified'}\nCohort size: ${exp.slots_total}\nDuration: ${exp.duration_weeks} weeks\nDescription: ${exp.description ?? 'Not provided'}`;
    }
  }

  // ── Call Claude ────────────────────────────────────────────────
  const response = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    system:     systemPrompt,
    messages,
  });

  const assistantContent = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  const inputTokens  = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costUsd      = (inputTokens / 1_000_000) * COST_PER_M_INPUT
                     + (outputTokens / 1_000_000) * COST_PER_M_OUTPUT;

  // ── Persist messages ───────────────────────────────────────────
  await supabase.from('ome_messages').insert([
    {
      session_id:    sessionId,
      role:          'user',
      content:       body.message,
      input_tokens:  0,
      output_tokens: 0,
      cost_usd:      0,
    },
    {
      session_id:    sessionId,
      role:          'assistant',
      content:       assistantContent,
      input_tokens:  inputTokens,
      output_tokens: outputTokens,
      cost_usd:      costUsd,
    },
  ]);

  // ── Update session totals ──────────────────────────────────────
  await supabase.rpc('increment_ome_session_totals', {
    p_session_id:  sessionId,
    p_tokens:      inputTokens + outputTokens,
    p_cost:        costUsd,
  });

  return NextResponse.json({
    sessionId,
    reply:  assistantContent,
    usage:  { inputTokens, outputTokens, costUsd },
  });
}
