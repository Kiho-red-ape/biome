import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { syncEstimateToAirtable } from '@/lib/airtable-sync';

interface EstimateBody {
  email: string;
  organization?: string;
  study_type: string;
  sponsor_type: string;
  participants: number;
  duration: string;
  geography: string[];
  samples: string[];
  irb_status: string;
  estimated_total: number;
  estimated_ops_fee: number;
  estimate_breakdown: {
    recruitment: number;
    samples: number;
    irb: number;
    ops_fee: number;
    total: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json() as EstimateBody;
    if (!b.email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const db = createServiceClient();

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
      estimated_ops_fee:  b.estimated_ops_fee,
      estimate_breakdown: b.estimate_breakdown,
    });

    await syncEstimateToAirtable({
      email:           b.email.toLowerCase(),
      organization:    b.organization ?? '',
      study_type:      b.study_type,
      participants:    b.participants,
      estimated_total: b.estimated_total,
    });

    const bd = b.estimate_breakdown;
    const breakdown = [
      bd.recruitment ? `  Recruitment:   $${bd.recruitment.toLocaleString()}` : '',
      bd.samples     ? `  Sample kits:   $${bd.samples.toLocaleString()}`     : '',
      bd.irb         ? `  IRB support:   $${bd.irb.toLocaleString()}`         : '',
      bd.ops_fee     ? `  Ops fee (8%):  $${bd.ops_fee.toLocaleString()}`     : '',
    ].filter(Boolean).join('\n');

    await sendEmail(
      b.email.toLowerCase(),
      `Your BIOME study estimate — $${b.estimated_total.toLocaleString()}`,
      `Hi${b.organization ? ` ${b.organization}` : ''},\n\nHere's your study estimate:\n\n` +
      `STUDY TYPE:    ${b.study_type}\n` +
      `PARTICIPANTS:  ${b.participants}\n` +
      `DURATION:      ${b.duration}\n` +
      `GEOGRAPHY:     ${b.geography.join(', ')}\n` +
      `SAMPLES:       ${b.samples.join(', ') || 'Survey only'}\n\n` +
      `ESTIMATED TOTAL: $${b.estimated_total.toLocaleString()}\n\n` +
      `BREAKDOWN:\n${breakdown}\n\n` +
      `These are estimates, not binding quotes.\n\n` +
      `Ready to proceed? Submit your full intake at https://biome.to/intake\n\n` +
      `—\nKishore · BIOME\nkishore@biome.to`,
    );

    await sendEmail(
      'kishore@biome.to',
      `New estimate lead — $${b.estimated_total.toLocaleString()} — ${b.organization ?? b.email}`,
      `Email: ${b.email}\nOrg: ${b.organization ?? '—'}\nType: ${b.study_type}\nParticipants: ${b.participants}\nTotal: $${b.estimated_total.toLocaleString()}`,
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/estimate]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
