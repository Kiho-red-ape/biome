import { createServiceClient } from '@/lib/supabase/server';
import { ReportGenerator } from './report-generator';

export default async function OpsReports() {
  const db = createServiceClient();
  const { data: studies } = await db
    .from('experiments')
    .select('id, title, experiment_code, status')
    .order('created_at', { ascending: false });

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 20 }}>
        // SPONSOR_REPORTS
      </p>
      <ReportGenerator studies={(studies ?? []) as { id: string; title: string; experiment_code: string | null; status: string }[]} />
    </div>
  );
}
