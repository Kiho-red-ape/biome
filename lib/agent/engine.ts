// The agent engine: one entry point that loads persistent memory, calls Claude
// with a forced structured-output tool, persists the turn, and returns a typed
// result. Model tiering keeps cost down: cheap model for onboard/screen/support,
// stronger model for the regulated consent reasoning.

import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase/server';
import { buildSystemPrompt } from './prompts';
import type {
  AgentMode, AgentMessage, ConversationStatus, ConverseResult,
  ParticipantContext, ReusableEligibility, RespondPayload, VerificationLevel,
} from './types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL_FAST   = 'claude-haiku-4-5-20251001';   // onboard / screen / support
const MODEL_STRONG = 'claude-sonnet-4-6';           // consent + edge-case reasoning
const MAX_TOKENS   = 1200;
const HISTORY_LIMIT = 30;                            // cap turns loaded into context

function modelFor(mode: AgentMode): string {
  return mode === 'consent' ? MODEL_STRONG : MODEL_FAST;
}

// Forced structured output — the model must reply through this tool every turn.
const RESPOND_TOOL: Anthropic.Tool = {
  name: 'respond',
  description: 'Reply to the participant and record anything learned this turn.',
  input_schema: {
    type: 'object',
    properties: {
      message:       { type: 'string', description: 'The participant-facing reply.' },
      extracted:     { type: 'object', description: 'Structured facts learned this turn (snake_case keys). {} if none.' },
      flag_operator: { type: 'boolean', description: 'True to escalate this conversation to a human operator.' },
      flag_reason:   { type: 'string', description: 'Short reason if flag_operator is true.' },
      done:          { type: 'boolean', description: "True only when this conversation's goal is fully met." },
    },
    required: ['message', 'flag_operator', 'done'],
  },
};

interface RunArgs {
  participantId: string;
  mode: AgentMode;
  userMessage: string;
  experimentId?: string | null;
  extraSystemContext?: string;
}

// ── Load the participant slice the agent reads each turn ───────────────────────
async function loadContext(
  db: ReturnType<typeof createServiceClient>,
  participantId: string,
): Promise<ParticipantContext> {
  const { data } = await db
    .from('participant_profiles')
    .select('pseudonym, country, year_of_birth, verification_level, reusable_eligibility, language_fluency')
    .eq('user_id', participantId)
    .maybeSingle();

  const row = (data ?? null) as {
    pseudonym: string | null;
    country: string | null;
    year_of_birth: number | null;
    verification_level: VerificationLevel | null;
    reusable_eligibility: ReusableEligibility | null;
    language_fluency: string[] | null;
  } | null;

  return {
    participantId,
    pseudonym:           row?.pseudonym ?? null,
    country:             row?.country ?? null,
    yearOfBirth:         row?.year_of_birth ?? null,
    verificationLevel:   row?.verification_level ?? 'unverified',
    reusableEligibility: row?.reusable_eligibility ?? {},
    languages:           row?.language_fluency ?? [],
  };
}

// ── Resolve the active conversation for this (participant, mode, study) ─────────
async function resolveConversation(
  db: ReturnType<typeof createServiceClient>,
  participantId: string,
  mode: AgentMode,
  experimentId: string | null,
): Promise<{ id: string; messages: AgentMessage[]; extracted: Record<string, unknown> }> {
  let query = db
    .from('agent_conversations')
    .select('id, messages, extracted_data')
    .eq('participant_id', participantId)
    .eq('stage', mode)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  query = experimentId ? query.eq('experiment_id', experimentId) : query.is('experiment_id', null);

  const { data } = await query.maybeSingle();
  const row = data as { id: string; messages: AgentMessage[]; extracted_data: Record<string, unknown> } | null;

  if (row) {
    return { id: row.id, messages: row.messages ?? [], extracted: row.extracted_data ?? {} };
  }

  const { data: created, error } = await db
    .from('agent_conversations')
    .insert({ participant_id: participantId, stage: mode, experiment_id: experimentId, messages: [], extracted_data: {} })
    .select('id')
    .single();

  if (error || !created) throw new Error(`conversation create failed: ${error?.message}`);
  return { id: (created as { id: string }).id, messages: [], extracted: {} };
}

// ── Main entry point ────────────────────────────────────────────────────────────
export async function runAgentTurn(args: RunArgs): Promise<ConverseResult> {
  const { participantId, mode, userMessage, experimentId = null, extraSystemContext } = args;
  const db = createServiceClient();

  const [ctx, convo] = await Promise.all([
    loadContext(db, participantId),
    resolveConversation(db, participantId, mode, experimentId),
  ]);

  const system = buildSystemPrompt(mode, ctx, extraSystemContext);

  // Cap history (cheap summarization: keep the most recent turns).
  const prior = convo.messages.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.content }));
  const apiMessages: Anthropic.MessageParam[] = [...prior, { role: 'user', content: userMessage }];

  const response = await anthropic.messages.create({
    model:       modelFor(mode),
    max_tokens:  MAX_TOKENS,
    system,
    messages:    apiMessages,
    tools:       [RESPOND_TOOL],
    tool_choice: { type: 'tool', name: 'respond' },
  });

  const toolBlock = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
  const payload = (toolBlock?.input ?? {}) as Partial<RespondPayload>;

  const reply       = payload.message?.trim() || "Thanks — could you tell me a little more?";
  const extracted   = (payload.extracted && typeof payload.extracted === 'object') ? payload.extracted : {};
  const flagged     = payload.flag_operator === true;
  const flagReason  = flagged ? (payload.flag_reason ?? 'Agent flagged for operator review') : null;
  const done        = payload.done === true;

  const status: ConversationStatus = flagged ? 'flagged_operator' : done ? 'complete' : 'active';

  // Append the turn + merge extracted data, persist.
  const now = new Date().toISOString();
  const newMessages: AgentMessage[] = [
    ...convo.messages,
    { role: 'user', content: userMessage, ts: now },
    { role: 'assistant', content: reply, ts: now },
  ];
  const mergedExtracted = { ...convo.extracted, ...extracted };

  await db
    .from('agent_conversations')
    .update({
      messages:             newMessages,
      extracted_data:       mergedExtracted,
      status,
      operator_flag_reason: flagReason,
      updated_at:           now,
    })
    .eq('id', convo.id);

  return {
    conversationId: convo.id,
    reply,
    extracted,
    flagged,
    flagReason,
    status,
    done,
  };
}
