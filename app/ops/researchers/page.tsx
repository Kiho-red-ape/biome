import { createServiceClient } from '@/lib/supabase/server';
import { OpsPageHeader, OpsCard, OpsBadge, OpsButton } from '../_components/ui';

type ResearcherRow = {
  id: string;
  user_id: string;
  org_name: string;
  org_website: string | null;
  org_description: string | null;
  role_title: string | null;
  expertise_areas: string[] | null;
  review_status: string;
  created_at: string;
};

type ReviewTone = 'teal' | 'green' | 'amber' | 'red' | 'slate' | 'blue';

function reviewTone(s: string): ReviewTone {
  if (s === 'active')         return 'green';
  if (s === 'pending_review') return 'amber';
  if (s === 'rejected')       return 'red';
  return 'slate';
}

export default async function ResearchersPage() {
  const db = createServiceClient();

  const { data: pending } = await db
    .from('experimenter_profiles')
    .select('id, user_id, org_name, org_website, org_description, role_title, expertise_areas, review_status, created_at')
    .order('created_at', { ascending: false });

  const rows = (pending ?? []) as ResearcherRow[];

  const pendingRows  = rows.filter(r => r.review_status === 'pending_review');
  const activeRows   = rows.filter(r => r.review_status === 'active');
  const rejectedRows = rows.filter(r => r.review_status === 'rejected');

  return (
    <div>
      <OpsPageHeader
        label="Researchers"
        title="Experimenter Profiles"
        subtitle={`${pendingRows.length} pending review · ${activeRows.length} active`}
      />

      {pendingRows.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal-dark)', marginBottom: 14 }}>
            Pending review ({pendingRows.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingRows.map(r => (
              <ResearcherCard key={r.id} row={r} />
            ))}
          </div>
        </section>
      )}

      {pendingRows.length === 0 && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>
          No pending applications.
        </p>
      )}

      {activeRows.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
            Active ({activeRows.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeRows.map(r => <ResearcherCard key={r.id} row={r} compact />)}
          </div>
        </section>
      )}

      {rejectedRows.length > 0 && (
        <section>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
            Rejected ({rejectedRows.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rejectedRows.map(r => <ResearcherCard key={r.id} row={r} compact />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ResearcherCard({ row, compact = false }: { row: ResearcherRow; compact?: boolean }) {
  return (
    <OpsCard style={{ padding: compact ? '12px 16px' : '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compact ? 13 : 15, color: 'var(--ink)', marginBottom: 2 }}>
            {row.org_name}
          </p>
          {row.role_title && !compact && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>{row.role_title}</p>
          )}
          {row.org_website && !compact && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal-dark)', marginTop: 4 }}>
              {row.org_website}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <OpsBadge tone={reviewTone(row.review_status)}>
            {row.review_status.replace('_', ' ')}
          </OpsBadge>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
            {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {!compact && row.org_description && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', marginTop: 12, lineHeight: 1.7 }}>
          {row.org_description}
        </p>
      )}

      {!compact && row.expertise_areas && row.expertise_areas.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {row.expertise_areas.map(a => (
            <OpsBadge key={a} tone="slate">{a}</OpsBadge>
          ))}
        </div>
      )}

      {row.review_status === 'pending_review' && !compact && (
        <ApprovalActions userId={row.user_id} />
      )}
    </OpsCard>
  );
}

function ApprovalActions({ userId }: { userId: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server';
        const action = formData.get('action') as 'active' | 'rejected';
        const db = createServiceClient();
        await db
          .from('experimenter_profiles')
          .update({ review_status: action })
          .eq('user_id', userId);
      }}
      style={{ display: 'flex', gap: 10, marginTop: 16 }}
    >
      <button
        name="action" value="active"
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      11,
          fontWeight:    600,
          letterSpacing: '0.5px',
          padding:       '8px 16px',
          background:    'var(--teal)',
          border:        '1px solid var(--teal)',
          color:         '#fff',
          borderRadius:  'var(--radius-sm)',
          cursor:        'pointer',
        }}
      >
        Approve
      </button>
      <button
        name="action" value="rejected"
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      11,
          fontWeight:    600,
          letterSpacing: '0.5px',
          padding:       '8px 16px',
          background:    'transparent',
          border:        '1px solid rgba(220,38,38,0.3)',
          color:         '#b91c1c',
          borderRadius:  'var(--radius-sm)',
          cursor:        'pointer',
        }}
      >
        Reject
      </button>
    </form>
  );
}
