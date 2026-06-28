import { createServiceClient } from '@/lib/supabase/server';
import { OpsPageHeader, OpsCard, OpsBadge } from '../../_components/ui';
import { IntakeTriage } from './intake-triage';
import { IntakeInvite } from './intake-invite';

type BadgeTone = 'teal' | 'green' | 'amber' | 'red' | 'slate' | 'blue';

const STATUS_TONE: Record<string, BadgeTone> = {
  new: 'amber', reviewing: 'blue', qualified: 'green',
  nurture: 'slate', declined: 'red', converted: 'teal',
};

export default async function OpsPipeline() {
  const db = createServiceClient();
  const { data: intakes } = await db
    .from('client_intakes')
    .select('*')
    .order('created_at', { ascending: false });

  const rows = (intakes ?? []) as Record<string, unknown>[];

  return (
    <div>
      <OpsPageHeader
        label="Studies"
        title="Client Intake Pipeline"
        subtitle={`${rows.length} intake${rows.length === 1 ? '' : 's'} total`}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>No intakes yet.</p>
        )}
        {rows.map((intake) => (
          <OpsCard key={intake.id as string} style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>
                  {intake.study_title as string}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                  {intake.organization as string} · {intake.name as string} · {intake.email as string}
                </p>
              </div>
              <OpsBadge tone={STATUS_TONE[intake.triage_status as string] ?? 'slate'}>
                {intake.triage_status as string}
              </OpsBadge>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              {[
                ['Type',         intake.study_type as string | null],
                ['Participants', intake.target_participants as number | null],
                ['Budget',       intake.budget_range as string | null],
                ['Geography',    (intake.geography as string[] | null)?.join(', ')],
                ['IRB',          intake.irb_status as string | null],
                ['Submitted',    new Date(intake.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
              ].filter(([, v]) => v).map(([k, v]) => (
                <span key={k as string} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
                  <span style={{ color: 'var(--muted)' }}>{k as string}:</span> {String(v)}
                </span>
              ))}
            </div>

            {!!intake.description && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', lineHeight: 1.6, marginBottom: 16 }}>
                {intake.description as string}
              </p>
            )}

            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-soft)' }}>
              <IntakeInvite
                intakeId={intake.id as string}
                email={(intake.email as string | null) ?? null}
                invited={!!intake.org_invite_id}
                converted={(intake.triage_status as string) === 'converted'}
              />
            </div>

            <IntakeTriage
              intakeId={intake.id as string}
              currentStatus={intake.triage_status as string}
              currentNotes={intake.triage_notes as string | null}
            />
          </OpsCard>
        ))}
      </div>
    </div>
  );
}
