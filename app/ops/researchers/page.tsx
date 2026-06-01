import { createServiceClient } from '@/lib/supabase/server';

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

export default async function ResearchersPage() {
  const db = createServiceClient();

  const { data: pending } = await db
    .from('experimenter_profiles')
    .select('id, user_id, org_name, org_website, org_description, role_title, expertise_areas, review_status, created_at')
    .order('created_at', { ascending: false });

  const rows = (pending ?? []) as ResearcherRow[];

  const pendingRows = rows.filter(r => r.review_status === 'pending_review');
  const activeRows  = rows.filter(r => r.review_status === 'active');
  const rejectedRows = rows.filter(r => r.review_status === 'rejected');

  return (
    <div style={{ maxWidth: 900 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 8 }}>
        // RESEARCHER_APPROVALS
      </p>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#f8fafc', marginBottom: 32 }}>
        Experimenter profiles
      </h1>

      {pendingRows.length > 0 ? (
        <section style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 16 }}>
            Pending review ({pendingRows.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingRows.map(r => (
              <ResearcherCard key={r.id} row={r} />
            ))}
          </div>
        </section>
      ) : (
        <div style={{ padding: '24px 0', marginBottom: 32 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#475569' }}>
            No pending applications.
          </p>
        </div>
      )}

      {activeRows.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 16 }}>
            Active ({activeRows.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeRows.map(r => (
              <ResearcherCard key={r.id} row={r} compact />
            ))}
          </div>
        </section>
      )}

      {rejectedRows.length > 0 && (
        <section>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px', color: '#475569', textTransform: 'uppercase', marginBottom: 16 }}>
            Rejected ({rejectedRows.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rejectedRows.map(r => (
              <ResearcherCard key={r.id} row={r} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ResearcherCard({ row, compact = false }: { row: ResearcherRow; compact?: boolean }) {
  const statusColor =
    row.review_status === 'pending_review' ? '#38bdf8' :
    row.review_status === 'active'         ? '#f59e0b' : '#475569';

  return (
    <div style={{
      background:   '#0b1014',
      border:       `1px solid ${row.review_status === 'pending_review' ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 2,
      padding:      compact ? '12px 16px' : '20px 24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#f8fafc', marginBottom: 2 }}>
            {row.org_name}
          </p>
          {row.role_title && !compact && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#475569' }}>{row.role_title}</p>
          )}
          {row.org_website && !compact && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#475569', marginTop: 4 }}>
              {row.org_website}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1px',
            textTransform: 'uppercase', color: statusColor,
            border: `1px solid ${statusColor}44`, padding: '2px 8px', borderRadius: 2,
          }}>
            {row.review_status.replace('_', ' ')}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#475569' }}>
            {new Date(row.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {!compact && row.org_description && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7f8e87', marginTop: 12, lineHeight: 1.7 }}>
          {row.org_description}
        </p>
      )}

      {!compact && row.expertise_areas && row.expertise_areas.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {row.expertise_areas.map(a => (
            <span key={a} style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.5px',
              color: '#475569', border: '1px solid rgba(255,255,255,0.08)',
              padding: '2px 8px', borderRadius: 2,
            }}>
              {a}
            </span>
          ))}
        </div>
      )}

      {row.review_status === 'pending_review' && !compact && (
        <ApprovalActions userId={row.user_id} />
      )}
    </div>
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
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '1px',
          textTransform: 'uppercase', padding: '6px 16px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
          color: '#f59e0b', borderRadius: 2, cursor: 'pointer',
        }}
      >
        ✓ Approve
      </button>
      <button
        name="action" value="rejected"
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '1px',
          textTransform: 'uppercase', padding: '6px 16px',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
          color: '#475569', borderRadius: 2, cursor: 'pointer',
        }}
      >
        ✕ Reject
      </button>
    </form>
  );
}
