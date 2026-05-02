import { createServiceClient } from '@/lib/supabase/server';
import { EstimateLeadRow } from './lead-row';

export default async function EstimateLeadsPage() {
  const db = createServiceClient();
  const { data: leads } = await db
    .from('estimate_leads')
    .select('*')
    .order('created_at', { ascending: false });

  const rows = (leads ?? []) as Record<string, unknown>[];

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 20 }}>
        // ESTIMATE_LEADS
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a', marginBottom: 32 }}>
        {rows.length} total · {rows.filter(r => !r.contacted).length} not yet contacted
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a' }}>No leads yet.</p>
        )}
        {rows.map(lead => (
          <EstimateLeadRow key={lead.id as string} lead={lead} />
        ))}
      </div>
    </div>
  );
}
