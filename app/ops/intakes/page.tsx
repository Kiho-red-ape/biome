import { createServiceClient } from '@/lib/supabase/server';
import { IntakeTriage } from '../studies/pipeline/intake-triage';

const STATUS_COLOR: Record<string, string> = {
  new: '#ffb300', reviewing: '#38bdf8', qualified: '#f59e0b',
  nurture: '#94a3b8', declined: '#475569', converted: '#f59e0b',
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
  const title = filterStatus === 'qualified' ? 'QUALIFIED_INTAKES' : filterStatus === 'declined' ? 'DECLINED_INTAKES' : 'NEW_INTAKES';

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 20 }}>
        // {title}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {rows.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#475569' }}>No intakes with status: {filterStatus}</p>
        )}
        {rows.map((intake) => (
          <div key={intake.id as string} style={{
            background: '#0b1014', border: '1px solid rgba(255,255,255,0.06)',
            padding: '20px 24px', borderRadius: 2,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f8fafc', marginBottom: 2 }}>
                  {intake.study_title as string}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#475569' }}>
                  {intake.organization as string} · {intake.name as string} · {intake.email as string}
                </p>
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: STATUS_COLOR[(intake.triage_status as string)] ?? '#475569',
                padding: '3px 10px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2,
                letterSpacing: '1px', textTransform: 'uppercase',
              }}>
                {intake.triage_status as string}
              </span>
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
                <span key={k as string} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#475569' }}>
                  <span style={{ color: '#7f8e87' }}>{k as string}:</span> {String(v)}
                </span>
              ))}
            </div>

            {!!intake.description && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
                {intake.description as string}
              </p>
            )}

            <IntakeTriage
              intakeId={intake.id as string}
              currentStatus={intake.triage_status as string}
              currentNotes={intake.triage_notes as string | null}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
