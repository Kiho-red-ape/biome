import { createServiceClient } from '@/lib/supabase/server';
import { OpsPageHeader, OpsStats } from '../_components/ui';
import { EstimateLeadRow } from './lead-row';

export default async function EstimateLeadsPage() {
  const db = createServiceClient();
  const { data: leads } = await db
    .from('estimate_leads')
    .select('*')
    .order('created_at', { ascending: false });

  const rows = (leads ?? []) as Record<string, unknown>[];
  const notContacted = rows.filter(r => !r.contacted).length;

  return (
    <div>
      <OpsPageHeader
        label="Estimate Leads"
        title="Estimate Leads"
        subtitle="Contacts who used the pricing estimator"
      />

      <OpsStats items={[
        { label: 'Total leads',     value: rows.length, accent: true },
        { label: 'Not contacted',   value: notContacted },
        { label: 'Contacted',       value: rows.length - notContacted },
      ]} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>No leads yet.</p>
        )}
        {rows.map(lead => (
          <EstimateLeadRow key={lead.id as string} lead={lead} />
        ))}
      </div>
    </div>
  );
}
