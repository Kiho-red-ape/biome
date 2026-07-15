'use client';

import Link from 'next/link';
import { OpsPageHeader, OpsCard } from '../_components/ui';

export default function OpsRecruitmentPage() {
  return (
    <div>
      <OpsPageHeader
        label="Operations"
        title="Recruitment (Stage 0)"
        subtitle="How BIOME maps outreach targets when a study opens recruiting"
      />

      <OpsCard style={{ padding: '24px 28px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.7, margin: '0 0 16px' }}>
          When a launch request is confirmed and a study flips to <strong style={{ color: 'var(--ink)' }}>recruiting</strong>,
          BIOME queues the <strong style={{ color: 'var(--ink)' }}>Stage 0 find agent</strong>. The agent maps where the right
          people and partners are — online communities, forums, advocacy and patient groups, clinics, hospitals, doctor
          networks, registries and more — and scores each target for fit, accessibility, and trust.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.7, margin: '0 0 16px' }}>
          Per-study results are viewable from each study. Confirm pending deposits in{' '}
          <Link href="/ops/launch-requests" style={{ color: 'var(--teal-dark)', textDecoration: 'none', borderBottom: '1px solid var(--teal-soft)' }}>
            Launch Requests
          </Link>
          , then open the study to review its outreach map.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', margin: 0 }}>
          Tip: the researcher view lives at <span style={{ color: 'var(--slate)' }}>/dashboard/experiments/[id]/recruitment</span>.
        </p>
      </OpsCard>
    </div>
  );
}
