import { notFound } from 'next/navigation';
import { createAnonClient } from '@/lib/supabase/anon';
import { DEMO_EXPERIMENTS } from '@/lib/demo-data';
import type { QuizQuestion } from '@/lib/demo-data';
import { ApplyFlowClient } from './apply-flow-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplyExperiment = {
  id: string;
  title: string;
  category: string;
  bounty_per_participant: number;
  compliance_threshold: number;
  duration_weeks: number | null;
  is_remote: boolean;
  region: string | null;
  inclusion_criteria: string | null;
  status: string;
  application_deadline: string | null;
  // Pre-derived collection summary
  inputs: string;
  devices_tools: string;
  sample_type: string;
  visits: string;
};

export type ApplyMilestone = {
  week_number: number;
  title: string;
  milestone_type: string;
};

// ─── Collection derivation helpers (server-side) ──────────────────────────────

function deriveInputs(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('sleep'))                         return 'Wearable sleep data · daily logs · morning HRV';
  if (c.includes('nutri') || c.includes('diet'))  return 'Food logs · dietary surveys · biometric check-ins';
  if (c.includes('micro') || c.includes('gut'))   return 'Stool / saliva samples · symptom surveys';
  if (c.includes('longev') || c.includes('cold')) return 'HRV wearable data · subjective energy logs';
  if (c.includes('wear'))                          return 'Wearable sensor data · self-report logs';
  return 'Survey responses · self-report logs';
}

function deriveDevices(incl: string | null, isRemote: boolean): string {
  const t = (incl ?? '').toLowerCase();
  const hasWearable = /wearable|oura|fitbit|garmin|whoop|apple watch|polar/.test(t);
  const tools: string[] = [];
  if (hasWearable) tools.push('wearable device');
  if (isRemote)    tools.push('mobile app');
  if (tools.length === 0) tools.push('questionnaire');
  return tools.join(' · ');
}

function deriveSample(incl: string | null, category: string): string {
  const t  = (incl ?? '').toLowerCase();
  const c  = category.toLowerCase();
  const ps: string[] = [];
  if (t.includes('stool') || c.includes('micro'))  ps.push('stool');
  if (t.includes('saliva'))                          ps.push('saliva');
  if (t.includes('blood') || t.includes('glucose')) ps.push('blood');
  if (t.includes('urine'))                           ps.push('urine');
  return ps.length > 0 ? ps.join(', ') : 'none';
}

function deriveVisits(isRemote: boolean, region: string | null): string {
  if (isRemote) return 'Remote only';
  return region ? `${region} in-person` : 'In-person';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplyPage({ params }: Props) {
  const { id } = await params;

  let experiment: ApplyExperiment | null = null;
  let milestones: ApplyMilestone[] = [];
  let quiz: QuizQuestion[] = [];

  // ── Try demo data first ──────────────────────────────────────────────────────
  const demoExp = DEMO_EXPERIMENTS.find((e) => e.id === id);
  if (demoExp) {
    experiment = {
      id:                     demoExp.id,
      title:                  demoExp.title,
      category:               demoExp.category,
      bounty_per_participant: demoExp.bounty_per_participant,
      compliance_threshold:   80,
      duration_weeks:         demoExp.duration_weeks,
      is_remote:              demoExp.is_remote,
      region:                 demoExp.region,
      inclusion_criteria:     demoExp.inclusion_criteria,
      status:                 demoExp.status,
      application_deadline:   demoExp.application_deadline ?? null,
      inputs:                 demoExp.inputs ?? deriveInputs(demoExp.category),
      devices_tools:          demoExp.devices_tools ?? deriveDevices(demoExp.inclusion_criteria, demoExp.is_remote),
      sample_type:            demoExp.sample_type ?? deriveSample(demoExp.inclusion_criteria, demoExp.category),
      visits:                 demoExp.visits ?? deriveVisits(demoExp.is_remote, demoExp.region),
    };
    quiz = demoExp.eligibility_quiz ?? [];
    // Provide a brief milestone preview for demo
    milestones = [
      { week_number: 1, title: 'Baseline measurements & onboarding',     milestone_type: 'self_report'          },
      { week_number: 2, title: 'First weekly check-in',                  milestone_type: 'self_report'          },
      { week_number: 4, title: 'Mid-study progress report',              milestone_type: 'experimenter_confirm' },
      { week_number: demoExp.duration_weeks, title: 'Final data submission & study exit', milestone_type: 'self_report' },
    ];
  } else {
    // ── Fetch from Supabase ────────────────────────────────────────────────────
    const supabase = createAnonClient();
    const [expRes, msRes] = await Promise.all([
      supabase
        .from('experiments')
        .select('id, title, category, bounty_per_participant, compliance_threshold, duration_weeks, is_remote, region, inclusion_criteria, status')
        .eq('id', id)
        .single(),
      supabase
        .from('study_milestones')
        .select('week_number, title, milestone_type')
        .eq('experiment_id', id)
        .order('week_number')
        .order('sort_order')
        .limit(8),
    ]);

    if (!expRes.data) notFound();

    const raw = expRes.data as Record<string, unknown>;
    experiment = {
      id:                     raw.id as string,
      title:                  raw.title as string,
      category:               raw.category as string,
      bounty_per_participant: raw.bounty_per_participant as number,
      compliance_threshold:   (raw.compliance_threshold as number | null) ?? 80,
      duration_weeks:         raw.duration_weeks as number | null,
      is_remote:              raw.is_remote as boolean,
      region:                 raw.region as string | null,
      inclusion_criteria:     raw.inclusion_criteria as string | null,
      status:                 raw.status as string,
      application_deadline:   (raw.application_deadline as string | null) ?? null,
      inputs:                 deriveInputs(raw.category as string),
      devices_tools:          deriveDevices(raw.inclusion_criteria as string | null, raw.is_remote as boolean),
      sample_type:            deriveSample(raw.inclusion_criteria as string | null, raw.category as string),
      visits:                 deriveVisits(raw.is_remote as boolean, raw.region as string | null),
    };
    milestones = (msRes.data ?? []) as ApplyMilestone[];
  }

  return (
    <ApplyFlowClient
      experiment={experiment}
      milestones={milestones}
      quiz={quiz}
    />
  );
}
