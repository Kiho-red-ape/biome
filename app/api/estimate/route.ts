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

// ── Human-readable label maps ──────────────────────────────────────────────
const STUDY_TYPE_LABEL: Record<string, string> = {
  supplement_novel:     'Supplement (Novel)',
  supplement_existing:  'Supplement (Existing)',
  digital_intervention: 'Digital Intervention',
  biomarker_wearable:   'Biomarker / Wearable',
  lifestyle_behavioral: 'Lifestyle & Behavioral',
  microbiome:           'Microbiome',
  cognitive:            'Cognitive',
  other:                'Other',
};

const GEOGRAPHY_LABEL: Record<string, string> = {
  us:     'United States',
  uk:     'United Kingdom',
  eu:     'European Union',
  au:     'Australia',
  ca:     'Canada',
  global: 'Global / Multi-region',
};

const SAMPLE_LABEL: Record<string, string> = {
  blood:          'Blood draw',
  saliva:         'Saliva',
  urine:          'Urine',
  wearable:       'Wearable device',
  dna:            'DNA / Genetics',
  hair:           'Hair follicle',
  gut_microbiome: 'Gut microbiome',
  stool:          'Stool sample',
  imaging:        'Imaging / Scan',
  survey:         'Survey only',
};

const IRB_LABEL: Record<string, string> = {
  approved:    'IRB Approved',
  in_progress: 'IRB In Progress',
  not_started: 'IRB Not Started',
  exempt:      'IRB Exempt',
  not_needed:  'Not Required',
};

function humanStudyType(raw: string): string {
  return STUDY_TYPE_LABEL[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function humanGeo(arr: string[]): string {
  return arr.map(g => GEOGRAPHY_LABEL[g] ?? g.toUpperCase()).join(', ');
}
function humanSamples(arr: string[]): string {
  if (!arr.length) return 'Survey only';
  return arr.map(s => SAMPLE_LABEL[s] ?? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ');
}
function humanDuration(raw: string): string {
  return raw.replace('_', '–').replace('plus', '+') + ' weeks';
}
function humanIrb(raw: string): string {
  return IRB_LABEL[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── HTML email template ────────────────────────────────────────────────────
function buildEstimateHtml(b: EstimateBody, buckets: EstimateBody['estimate_breakdown']['buckets'] | undefined): string {
  const teal    = '#0e7490';
  const tealBg  = '#f0f9fb';
  const ink     = '#0f172a';
  const muted   = '#64748b';
  const border  = '#e2e8f0';
  const total   = money(b.estimated_total);
  const org     = b.organization ?? '';

  const bucketRows = buckets ? `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${border};color:${muted};font-size:14px;">Recruitment &amp; screening</td>
      <td style="padding:10px 0;border-bottom:1px solid ${border};text-align:right;font-weight:600;color:${ink};font-size:14px;">${money(buckets.recruitmentAndScreening)}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${border};color:${muted};font-size:14px;">Operations &amp; logistics</td>
      <td style="padding:10px 0;border-bottom:1px solid ${border};text-align:right;font-weight:600;color:${ink};font-size:14px;">${money(buckets.operationsAndLogistics)}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;color:${muted};font-size:14px;">Participant compensation</td>
      <td style="padding:10px 0;text-align:right;font-weight:600;color:${ink};font-size:14px;">${money(buckets.participantCompensation)}</td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid ${border};overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:${teal};padding:32px 40px;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">BIOME</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Study Estimate</div>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0;font-size:16px;color:${ink};line-height:1.6;">
              Hi${org ? ` ${org}` : ''},
            </p>
            <p style="margin:16px 0 0;font-size:15px;color:#475569;line-height:1.6;">
              Thanks for using the Biome estimate calculator. Here's an indicative cost breakdown for your study.
            </p>
          </td>
        </tr>

        <!-- Total highlight -->
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:${tealBg};border:1px solid #bae6fd;border-radius:10px;padding:20px 24px;display:flex;align-items:center;">
              <div>
                <div style="font-size:12px;color:${muted};text-transform:uppercase;letter-spacing:1px;font-weight:600;">Estimated Total Investment</div>
                <div style="font-size:32px;font-weight:700;color:${teal};margin-top:6px;letter-spacing:-1px;">${total}</div>
              </div>
            </div>
          </td>
        </tr>

        <!-- Study details -->
        <tr>
          <td style="padding:28px 40px 0;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${muted};margin-bottom:14px;">Study Parameters</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid ${border};font-size:14px;color:${muted};width:48%;">Study type</td>
                <td style="padding:9px 0;border-bottom:1px solid ${border};font-size:14px;font-weight:500;color:${ink};">${humanStudyType(b.study_type)}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid ${border};font-size:14px;color:${muted};">Participants</td>
                <td style="padding:9px 0;border-bottom:1px solid ${border};font-size:14px;font-weight:500;color:${ink};">${b.participants.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid ${border};font-size:14px;color:${muted};">Duration</td>
                <td style="padding:9px 0;border-bottom:1px solid ${border};font-size:14px;font-weight:500;color:${ink};">${humanDuration(b.duration)}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid ${border};font-size:14px;color:${muted};">Geography</td>
                <td style="padding:9px 0;border-bottom:1px solid ${border};font-size:14px;font-weight:500;color:${ink};">${humanGeo(b.geography)}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid ${border};font-size:14px;color:${muted};">Data / samples</td>
                <td style="padding:9px 0;border-bottom:1px solid ${border};font-size:14px;font-weight:500;color:${ink};">${humanSamples(b.samples)}</td>
              </tr>
              <tr>
                <td style="padding:9px 0;font-size:14px;color:${muted};">IRB status</td>
                <td style="padding:9px 0;font-size:14px;font-weight:500;color:${ink};">${humanIrb(b.irb_status)}</td>
              </tr>
            </table>
          </td>
        </tr>

        ${buckets ? `<!-- Cost breakdown -->
        <tr>
          <td style="padding:28px 40px 0;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${muted};margin-bottom:14px;">Cost Breakdown</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${bucketRows}
            </table>
          </td>
        </tr>` : ''}

        <!-- Disclaimer -->
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:#fafafa;border-left:3px solid ${border};border-radius:0 6px 6px 0;padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:${muted};line-height:1.6;">
                This is an <strong>indicative estimate</strong> based on your inputs — not a binding quote. Final scope and pricing are confirmed in a brief consultation with the Biome team.
              </p>
            </div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
              Ready to move forward? Book a 20-minute consultation or start your intake directly.
            </p>
            <a href="https://biome.to/intake" style="display:inline-block;background:${teal};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 28px;border-radius:8px;letter-spacing:0.3px;">
              Start your intake →
            </a>
            <p style="margin:16px 0 0;font-size:13px;color:${muted};">
              Or simply reply to this email and we'll be in touch.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid ${border};padding:20px 40px;">
            <p style="margin:0;font-size:12px;color:${muted};line-height:1.6;">
              The Biome team &nbsp;·&nbsp;
              <a href="mailto:hello@biome.to" style="color:${teal};text-decoration:none;">hello@biome.to</a>
              &nbsp;·&nbsp;
              <a href="https://biome.to" style="color:${teal};text-decoration:none;">biome.to</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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
    const clientBreakdown = buckets
      ? `\nCost breakdown:\n` +
        `  Recruitment & screening:   ${money(buckets.recruitmentAndScreening)}\n` +
        `  Operations & logistics:    ${money(buckets.operationsAndLogistics)}\n` +
        `  Participant compensation:  ${money(buckets.participantCompensation)}\n`
      : '';

    const plainText =
      `Hi${b.organization ? ` ${b.organization}` : ''},\n\n` +
      `Here's your indicative study estimate:\n\n` +
      `Study type:   ${humanStudyType(b.study_type)}\n` +
      `Participants: ${b.participants.toLocaleString()}\n` +
      `Duration:     ${humanDuration(b.duration)}\n` +
      `Geography:    ${humanGeo(b.geography)}\n` +
      `Samples:      ${humanSamples(b.samples)}\n` +
      `IRB status:   ${humanIrb(b.irb_status)}\n\n` +
      `Estimated total investment: ${money(b.estimated_total)}\n` +
      clientBreakdown +
      `\nThis is an indicative estimate — not a binding quote.\n` +
      `Final scope and pricing are confirmed in a brief consultation.\n\n` +
      `Ready to talk? Reply here or start your intake at https://biome.to/intake\n\n` +
      `— The Biome team\nhello@biome.to`;

    await sendEmail(
      b.email.toLowerCase(),
      `Your Biome study estimate — ${money(b.estimated_total)}`,
      plainText,
      buildEstimateHtml(b, buckets),
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
