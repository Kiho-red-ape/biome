import { createServiceClient } from '@/lib/supabase/server';
import { OpsPageHeader } from '../_components/ui';
import { ReportGenerator } from './report-generator';

export default async function OpsReports() {
  const db = createServiceClient();
  const { data: studies } = await db
    .from('experiments')
    .select('id, title, experiment_code, status')
    .order('created_at', { ascending: false });

  return (
    <div>
      <OpsPageHeader
        label="Reports"
        title="Sponsor Reports"
        subtitle="Generate weekly reports for study sponsors. Downloads as Markdown."
      />
      <ReportGenerator studies={(studies ?? []) as { id: string; title: string; experiment_code: string | null; status: string }[]} />
    </div>
  );
}
