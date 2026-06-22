import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { syncEstimateToAirtable } from '@/lib/airtable-sync';

interface InternalBreakdown {
  recruitmentCost:     number;
  sampleCost:          number;
  compensationCost:    number;
  passThroughCost:     number;
  serviceFee:          number;
  recruitTarget:       number;
  estimatedActualCost: number;
  estimatedMargin:     number;
  riskFlags:           string[];
}

interface EstimateBody {
  email:           string;
  organization?:   string;
  study_type:      string;
  sponsor_type:    string;
  participants:    number;
  duration:        string;
  geography:       string[];
  samples:         string[];
  irb_status:      string;
  estimated_total: number;
  estimate_breakdown: {
    buckets: {
      recruitmentAndScreening: number;
      operationsAndLogistics:  number;
      participantCompensation: number;
    };
    cro_low:  number;
    cro_high: number;
    internal: InternalBreakdown;
  };
}

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

export async function POST(req: NextRequest) {
  try {
    const b = await req.json() as EstimateBody;
    if (!b.email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const db = createServiceClient();
    const bd = b.estimate_breakdown;
    const internal = bd?.internal;

    // Store the FULL internal breakdown in estimate_leads.estimate_breakdown (jsonb).
    await db.from('estimate_leads').insert({
      email:              b.email.toLowerCase(),
      organization:       b.organization ?? null,
      study_type:         b.study_type,
      sponsor_type:       b.sponsor_type,
      participants:       b.participants,
      duration:           b.duration,
      geography:          b.geography ?? [],
      samples:            b.samples ?? [],
      irb_status:         b.irb_status,
      estimated_total:    b.estimated_total,
      estimated_ops_fee:  internal?.serviceFee ?? null,
      estimate_breakdown: bd,
    });

    // Sync to Airtable — client-facing total only, never internal margin.
    await syncEstimateToAirtable({
      email:           b.email.toLowerCase(),
      organization:    b.organization ?? '',
      study_type:      b.study_type,
      participants:    b.participants,
      estimated_total: b.estimated_total,
    });

    // Lead confirmation email — clean 3-bucket summary, NO internal numbers.
    const buckets = bd?.buckets;
    const clientBreakdown = buckets ? [
      `  Recruitment & screening:   ${money(buckets.recruitmentAndScreening)}`,
      `  Operations & logistics:    ${money(buckets.operationsAndLogistics)}`,
      `  Participant compensation:  ${money(buckets.participantCompensation)}`,
    ].join('\n') : '';

    await sendEmail(
      b.email.toLowerCase(),
      `Your Biome study estimate — ${money(b.estimated_total)}`,
      `Hi${b.organization ? ` ${b.organization}` : ''},\n\n` +
      `Here's your indicative study estimate:\n\n` +
      `STUDY TYPE:    ${b.study_type}\n` +
      `PARTICIPANTS:  ${b.participants}\n` +
      `DURATION:      ${b.duration.replace('_', '–').replace('plus', '+')} weeks\n` +
      `GEOGRAPHY:     ${b.geography.join(', ')}\n` +
      `SAMPLES:       ${b.samples.join(', ') || 'Survey only'}\n\n` +
      `ESTIMATED INVESTMENT: ${money(b.estimated_total)}\n\n` +
      `${clientBreakdown}\n\n` +
      `This is an indicative estimate based on your inputs — not a binding quote.\n` +
      `Final scope and pricing are confirmed in a brief consultation.\n\n` +
      `Ready to talk? Reply here or start your intake at https://biome.to/intake\n\n` +
      `—\nThe Biome team\ncontact@biome.to`,
    );

    // Operator notification — FULL internal economics for Kishore only.
    const internalLines = internal ? [
      `Client total:        ${money(b.estimated_total)}`,
      ``,
      `Recruitment (risk+dropout): ${money(internal.recruitmentCost)}`,
      `Samples (kits+ship+lab):    ${money(internal.sampleCost)}`,
      `Compensation:               ${money(internal.compensationCost)}`,
      `Pass-through subtotal:      ${money(internal.passThroughCost)}`,
      `Service fee (margin):       ${money(internal.serviceFee)}`,
      ``,
      `Est. actual cost to deliver: ${money(internal.estimatedActualCost)}`,
      `Est. gross margin:           ${internal.estimatedMargin}%`,
      `Recruit target (30% buffer): ${internal.recruitTarget} participants`,
      `Risk flags:                  ${internal.riskFlags.join(', ') || 'none'}`,
    ].join('\n') : '';

    const internalSubject = `New estimate lead — ${money(b.estimated_total)} — ${b.organization ?? b.email}`;
    const internalBody =
      `Email: ${b.email}\nOrg: ${b.organization ?? '—'}\nType: ${b.study_type}\n` +
      `Participants: ${b.participants}\nDuration: ${b.duration}\n` +
      `Geography: ${b.geography.join(', ')}\nSamples: ${b.samples.join(', ') || 'none'}\n\n` +
      `── INTERNAL BREAKDOWN (operator only) ──\n${internalLines}`;

    await Promise.all([
      sendEmail('kishore@biome.to', internalSubject, internalBody),
      sendEmail('hello@biome.to',   internalSubject, internalBody),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/estimate]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
