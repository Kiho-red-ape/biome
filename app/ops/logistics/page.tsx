import { createServiceClient } from '@/lib/supabase/server';
import { OpsPageHeader, OpsCard, OpsBadge } from '../_components/ui';
import { KitStatusUpdater } from './kit-status-updater';

function isOverdue(kit: Record<string, unknown>): boolean {
  if (kit.collection_status === 'collected') return false;
  if (!kit.collection_due_date) return false;
  return new Date(kit.collection_due_date as string) < new Date();
}

export default async function OpsLogistics({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const db = createServiceClient();

  let query = db
    .from('sample_kits')
    .select('*, experiments(title)')
    .order('created_at', { ascending: false });

  if (status === 'pending')    query = query.eq('ship_status', 'pending');
  if (status === 'awaiting')   query = query.eq('collection_status', 'awaiting');
  if (status === 'in_transit') query = query.eq('return_status', 'in_transit');

  const { data: kits } = await query;
  let rows = (kits ?? []) as Record<string, unknown>[];
  if (status === 'overdue') rows = rows.filter(isOverdue);

  const title = status === 'pending'    ? 'Pending Shipment'
    : status === 'awaiting'   ? 'Awaiting Collection'
    : status === 'in_transit' ? 'In Transit to Lab'
    : status === 'overdue'    ? 'Overdue Kits'
    : 'All Kits';

  return (
    <div>
      <OpsPageHeader label="Logistics" title={title} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>No kits found.</p>
        )}
        {rows.map((kit) => {
          const overdue = isOverdue(kit);
          const exp = kit.experiments as { title: string } | null;
          return (
            <OpsCard key={kit.id as string} style={{ padding: '16px 20px', border: overdue ? '1px solid rgba(217,119,6,0.25)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {kit.kit_type as string} kit · {kit.participant_id as string}
                    {overdue && <OpsBadge tone="amber">⚠ Overdue</OpsBadge>}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                    {exp?.title ?? 'Unknown study'} · Created {new Date(kit.created_at as string).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Status pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {[
                  ['Ship', kit.ship_status as string],
                  ['Collect', kit.collection_status as string],
                  ['Return', kit.return_status as string],
                ].map(([label, val]) => (
                  <span key={label} style={{
                    fontFamily:    'var(--font-mono)',
                    fontSize:      10,
                    padding:       '3px 10px',
                    background:    'var(--bg-page)',
                    border:        '1px solid var(--border-soft)',
                    color:         'var(--muted)',
                    borderRadius:  'var(--radius-sm)',
                    letterSpacing: '0.5px',
                  }}>
                    {label}: <span style={{ color: 'var(--ink)' }}>{val}</span>
                  </span>
                ))}
              </div>

              <KitStatusUpdater kitId={kit.id as string} />
            </OpsCard>
          );
        })}
      </div>
    </div>
  );
}
