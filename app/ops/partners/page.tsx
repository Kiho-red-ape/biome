import { createServiceClient } from '@/lib/supabase/server';
import Image from 'next/image';
import { OpsPageHeader, OpsCard, OpsBadge } from '../_components/ui';
import { PartnerActions } from './partner-actions';

type PartnerTone = 'teal' | 'green' | 'amber' | 'red' | 'slate' | 'blue';

function partnerTone(status: string): PartnerTone {
  if (status === 'approved') return 'green';
  if (status === 'rejected') return 'slate';
  return 'amber';
}

export default async function OpsPartners({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const db = createServiceClient();

  const filterStatus = status ?? 'pending';

  const { data: partners } = await db
    .from('partner_applications')
    .select('*')
    .eq('status', filterStatus)
    .order('created_at', { ascending: false });

  const rows = (partners ?? []) as Record<string, unknown>[];
  const title = filterStatus === 'approved' ? 'Approved Partners' : 'Partner Applications';

  return (
    <div>
      <OpsPageHeader
        label="Partners"
        title={title}
        subtitle={`${rows.length} ${filterStatus} application${rows.length === 1 ? '' : 's'}`}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {rows.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
            No {filterStatus} partner applications.
          </p>
        )}
        {rows.map((p) => (
          <OpsCard key={p.id as string} style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {(p.logo_url as string | null) && (
                <div style={{
                  flexShrink: 0, width: 56, height: 56,
                  background: 'var(--bg-page)', border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Image src={p.logo_url as string} alt={p.name as string} width={56} height={56} style={{ objectFit: 'contain' }} />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>
                      {p.name as string}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                      {p.category as string} · {(p.region as string | null) ?? 'Region not specified'} · {p.email as string}
                    </p>
                  </div>
                  <OpsBadge tone={partnerTone(p.status as string)}>{p.status as string}</OpsBadge>
                </div>

                {(p.description as string | null) && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', lineHeight: 1.6, marginBottom: 12 }}>
                    {p.description as string}
                  </p>
                )}

                <PartnerActions
                  partnerId={p.id as string}
                  currentStatus={p.status as string}
                  displayOnHomepage={p.display_on_homepage as boolean}
                />
              </div>
            </div>
          </OpsCard>
        ))}
      </div>
    </div>
  );
}
