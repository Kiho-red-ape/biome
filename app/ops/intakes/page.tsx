import { createServiceClient } from '@/lib/supabase/server';
import { IntakeTriage } from '../studies/pipeline/intake-triage';
import { OpsPageHeader, OpsCard, OpsBadge } from '../_components/ui';

type BadgeTone = 'teal' | 'green' | 'amber' | 'red' | 'slate' | 'blue';

const STATUS_TONE: Record<string, BadgeTone> = {
  new: 'amber', reviewing: 'blue', qualified: 'green',
  nurture: 'slate', declined: 'red', converted: 'teal',
};

export default async function OpsIntakes({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const db = createServiceClient();

  const filterStatus = status ?? 'new';

  const { data: intakes } = await db
    .from('client_intakes')
    .select('*')
    .eq('triage_status', filterStatus)
    .order('created_at', { ascending: false });

  const rows = (intakes ?? []) as Record<string, unknown>[];
  const title = filterStatus === 'qualified' ? 'Qualified Intakes' : filterStatus === 'declined' ? 'Declined Intakes' : 'New Intakes';

  return (
    <div>
      <OpsPageHeader
        label="Intakes"
        title={title}
        subtitle={`${rows.length} intake${rows.length === 1 ? '' : 's'} with status: ${filterStatus}`}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {rows.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>No intakes with status: {filterStatus}</p>
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
                ['Submitted',    new Date(intake.created_at as string).toLocaleDateString()],
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
