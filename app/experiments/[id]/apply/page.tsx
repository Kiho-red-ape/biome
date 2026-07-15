import { notFound } from 'next/navigation';
import { createAnonClient } from '@/lib/supabase/anon';
import { ApplyFlowClient } from './apply-flow-client';
import type { QuizQuestion } from './apply-flow-client';

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

function deriveInputs(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('sleep'))                        return 'Wearable sleep data · daily logs · morning HRV';
  if (c.includes('nutri') || c.includes('diet')) return 'Food logs · dietary surveys · biometric check-ins';
  if (c.includes('micro') || c.includes('gut'))  return 'Stool / saliva samples · symptom surveys';
  if (c.includes('longev') || c.includes('cold')) return 'HRV wearable data · subjective energy logs';
  if (c.includes('wear'))                         return 'Wearable sensor data · self-report logs';
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

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplyPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAnonClient();

  const [expRes, msRes, quizRes] = await Promise.all([
    supabase
      .from('experiments')
      .select('id, title, category, bounty_per_participant, compliance_threshold, duration_weeks, is_remote, region, inclusion_criteria, status, application_deadline')
      .eq('id', id)
      .single(),
    supabase
      .from('study_milestones')
      .select('week_number, title, milestone_type')
      .eq('experiment_id', id)
      .order('week_number')
      .order('sort_order')
      .limit(8),
    supabase
      .from('eligibility_questions')
      .select('id, question_text, expected_answer, weight')
      .eq('experiment_id', id)
      .order('sort_order'),
  ]);

  if (!expRes.data) notFound();

  const raw = expRes.data as Record<string, unknown>;
  const experiment: ApplyExperiment = {
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

  const milestones = (msRes.data ?? []) as ApplyMilestone[];

  const quiz: QuizQuestion[] = (quizRes.data ?? []).map((q) => ({
    id:              q.id as string,
    text:            q.question_text as string,
    expected_answer: (q.expected_answer as string) === 'yes',
    disqualifier:    ((q.weight as number) ?? 0) > 0,
  }));

  return (
    <ApplyFlowClient
      experiment={experiment}
      milestones={milestones}
      quiz={quiz}
    />
  );
}
