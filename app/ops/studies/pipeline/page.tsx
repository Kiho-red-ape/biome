import { createServiceClient } from '@/lib/supabase/server';
import { IntakeTriage } from './intake-triage';

const STATUS_COLOR: Record<string, string> = {
  new:       '#ffb300',
  reviewing: '#22d3ee',
  qualified: '#b7ff61',
  nurture:   '#aab8b1',
  declined:  '#4a6050',
  converted: '#b7ff61',
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
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 20 }}>
        // PIPELINE — CLIENT_INTAKES
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a6050' }}>No intakes yet.</p>
        )}
        {rows.map((intake) => (
          <div key={intake.id as string} style={{
            background: '#0b1014', border: '1px solid rgba(255,255,255,0.06)',
            padding: '20px 24px', borderRadius: 2,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f2faf4', marginBottom: 2 }}>
                  {intake.study_title as string}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a6050' }}>
                  {intake.organization as string} · {intake.name as string} · {intake.email as string}
                </p>
              </div>
              <span style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      10,
                color:         STATUS_COLOR[(intake.triage_status as string) ?? 'new'] ?? '#4a6050',
                background:    'rgba(255,255,255,0.04)',
                border:        '1px solid rgba(255,255,255,0.08)',
                padding:       '3px 10px',
                borderRadius:  2,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                {intake.triage_status as string}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
              {[
                ['Type',         intake.study_type as string | null],
                ['Participants', intake.target_participants as number | null],
                ['Budget',       intake.budget_range as string | null],
                ['Geography',    (intake.geography as string[] | null)?.join(', ')],
                ['IRB',          intake.irb_status as string | null],
                ['Submitted',    new Date(intake.created_at as string).toLocaleDateString()],
              ].filter(([, v]) => v).map(([k, v]) => (
                <span key={k as string} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a6050' }}>
                  <span style={{ color: '#7f8e87' }}>{k as string}:</span> {String(v)}
                </span>
              ))}
            </div>

            {!!intake.description && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab8b1', lineHeight: 1.6, marginBottom: 16 }}>
                {intake.description as string}
              </p>
            )}

            <IntakeTriage intakeId={intake.id as string} currentStatus={intake.triage_status as string} currentNotes={intake.triage_notes as string | null} />
          </div>
        ))}
      </div>
    </div>
  );
}
