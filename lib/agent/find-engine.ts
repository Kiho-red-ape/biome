// STAGE 0 — FIND & CONVERT engine.
// Given a recruiting study, maps where eligible cohorts gather (healthy AND
// patient groups) plus hospitals, clinics, old-age homes, patient advocacy
// groups, doctors and clinical operators. Two-pass: (1) live web research via
// Anthropic's web_search server tool (falls back to model knowledge if the tool
// is unavailable), then (2) structured extraction into recruitment_targets.

import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

type Db = ReturnType<typeof createServiceClient>;

const KINDS = ['online_community','forum','advocacy','creator','hospital','clinic',
  'old_age_home','patient_group','doctor','clinical_operator','registry','regional','other'] as const;
const COHORTS = ['healthy','patient','both','unspecified'] as const;
const ACCESS  = ['open','gated','restricted','unknown'] as const;
const TRUST   = ['high','medium','low','unknown'] as const;

type Kind = typeof KINDS[number];
function clampEnum<T extends readonly string[]>(v: unknown, allowed: T, dflt: T[number]): T[number] {
  return (typeof v === 'string' && (allowed as readonly string[]).includes(v)) ? v as T[number] : dflt;
}

interface RawTarget {
  cohort?: string; kind?: string; name?: string; region?: string; url?: string;
  fit_score?: number; size_estimate?: string; accessibility?: string; trust?: string;
  rationale?: string; contact_hint?: string;
}

const RESEARCH_SYSTEM = `You are BIOME's recruitment scout. Given a study and its eligibility criteria, identify
WHERE the right people and partners can be reached — for BOTH a healthy cohort and a relevant patient
cohort when applicable. Look across: online communities and forums, patient advocacy groups, condition
charities, relevant creators, hospitals, clinics, diagnostic labs, old-age/care homes, doctor networks,
clinical operators/site coordinators, and research registries — biased to the study's region. Be concrete
and name real, specific places/organisations where possible. Note rough size, how accessible/gated each
is, and how to make ethical, compliant first contact (never direct-to-patient where a coordinator is
required). Summarise your findings as a clear briefing.`;

const EXTRACT_SYSTEM = `Convert the recruitment research notes into a structured outreach map. Return 8–20 concrete targets
via the record_targets tool. For each: cohort (healthy|patient|both|unspecified), kind (one of:
online_community, forum, advocacy, creator, hospital, clinic, old_age_home, patient_group, doctor,
clinical_operator, registry, regional, other), a specific name, region, url if known, fit_score 0..1,
size_estimate, accessibility (open|gated|restricted|unknown), trust (high|medium|low|unknown), a one-line
rationale, and a contact_hint (how to make first ethical contact). Prefer specific named organisations over
generic categories. Also provide a one-paragraph summary.`;

const RECORD_TOOL: Anthropic.Tool = {
  name: 'record_targets',
  description: 'Record the ranked recruitment outreach map.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      targets: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            cohort:        { type: 'string' },
            kind:          { type: 'string' },
            name:          { type: 'string' },
            region:        { type: 'string' },
            url:           { type: 'string' },
            fit_score:     { type: 'number' },
            size_estimate: { type: 'string' },
            accessibility: { type: 'string' },
            trust:         { type: 'string' },
            rationale:     { type: 'string' },
            contact_hint:  { type: 'string' },
          },
          required: ['kind', 'name'],
        },
      },
    },
    required: ['targets'],
  },
};

function buildBrief(exp: Record<string, unknown>): string {
  const region = (exp.region as string | null) ?? ((exp.is_remote as boolean | null) ? 'Remote / global' : 'Unspecified');
  return [
    `Study title: ${exp.title}`,
    `Category: ${exp.category}`,
    `Region: ${region}`,
    exp.duration_weeks ? `Duration: ${exp.duration_weeks} weeks` : null,
    `Description: ${exp.description ?? '—'}`,
    exp.inclusion_criteria ? `Inclusion criteria: ${exp.inclusion_criteria}` : null,
    exp.exclusion_criteria ? `Exclusion criteria: ${exp.exclusion_criteria}` : null,
    exp.tests_needed ? `Samples / tests: ${exp.tests_needed}` : null,
  ].filter(Boolean).join('\n');
}

async function research(brief: string): Promise<string> {
  // Try live web search first; fall back to model knowledge if unavailable.
  try {
    const r = await anthropic.messages.create({
      model: MODEL, max_tokens: 2500, system: RESEARCH_SYSTEM,
      messages: [{ role: 'user', content: brief }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }] as unknown as Anthropic.Tool[],
    });
    return r.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('\n').trim();
  } catch {
    const r = await anthropic.messages.create({
      model: MODEL, max_tokens: 2500,
      system: RESEARCH_SYSTEM + '\n(Web search is unavailable — use your own knowledge; be explicit where a real-time check would help.)',
      messages: [{ role: 'user', content: brief }],
    });
    return r.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('\n').trim();
  }
}

export async function runFindAgent(experimentId: string, trigger = 'recruiting'): Promise<{ runId: string; targetsFound: number; summary: string }> {
  const db: Db = createServiceClient();

  const { data: expData, error: expErr } = await db
    .from('experiments')
    .select('title, description, category, inclusion_criteria, exclusion_criteria, region, is_remote, tests_needed, duration_weeks')
    .eq('id', experimentId)
    .maybeSingle();
  if (expErr || !expData) throw new Error('Experiment not found');

  const { data: runRow } = await db
    .from('recruitment_runs')
    .insert({ experiment_id: experimentId, status: 'running', trigger, model_used: MODEL })
    .select('id')
    .single();
  const runId = (runRow as { id: string }).id;

  try {
    const brief = buildBrief(expData as Record<string, unknown>);
    const notes = await research(brief);

    const r2 = await anthropic.messages.create({
      model: MODEL, max_tokens: 3500, system: EXTRACT_SYSTEM,
      messages: [{ role: 'user', content: `Study brief:\n${brief}\n\nResearch notes:\n${notes}\n\nRecord the outreach targets.` }],
      tools: [RECORD_TOOL],
      tool_choice: { type: 'tool', name: 'record_targets' },
    });

    const block = r2.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    const input = (block?.input ?? {}) as { summary?: string; targets?: RawTarget[] };
    const raw = Array.isArray(input.targets) ? input.targets : [];

    const rows = raw
      .filter((t) => t.name && t.kind)
      .slice(0, 30)
      .map((t) => ({
        experiment_id: experimentId,
        run_id:        runId,
        cohort:        clampEnum(t.cohort, COHORTS, 'unspecified'),
        kind:          clampEnum(t.kind, KINDS, 'other') as Kind,
        name:          String(t.name).slice(0, 200),
        region:        t.region ? String(t.region).slice(0, 120) : null,
        url:           t.url ? String(t.url).slice(0, 500) : null,
        fit_score:     typeof t.fit_score === 'number' ? Math.max(0, Math.min(1, t.fit_score)) : null,
        size_estimate: t.size_estimate ? String(t.size_estimate).slice(0, 120) : null,
        accessibility: clampEnum(t.accessibility, ACCESS, 'unknown'),
        trust:         clampEnum(t.trust, TRUST, 'unknown'),
        rationale:     t.rationale ? String(t.rationale).slice(0, 600) : null,
        contact_hint:  t.contact_hint ? String(t.contact_hint).slice(0, 400) : null,
      }));

    if (rows.length > 0) await db.from('recruitment_targets').insert(rows);

    const summary = input.summary?.slice(0, 2000) ?? `${rows.length} outreach targets identified.`;
    await db.from('recruitment_runs')
      .update({ status: 'complete', targets_found: rows.length, summary, completed_at: new Date().toISOString() })
      .eq('id', runId);

    return { runId, targetsFound: rows.length, summary };
  } catch (err) {
    await db.from('recruitment_runs')
      .update({ status: 'failed', error: String(err).slice(0, 500), completed_at: new Date().toISOString() })
      .eq('id', runId);
    throw err;
  }
}
