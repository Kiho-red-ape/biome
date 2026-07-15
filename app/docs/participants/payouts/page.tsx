import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocUL, DocTable, DocNav,
} from '../../docs-components';

export default function ParticipantPayoutsPage() {
  return (
    <article>
      <DocLabel text="Research partners" />
      <DocH1>Compensation</DocH1>
      <DocLead>
        Research partners receive compensation for completing a study above its compliance
        threshold. Compensation is processed through Biome after the research team confirms study
        completion, and every step is recorded in an audit trail.
      </DocLead>

      <DocH2>Compensation eligibility</DocH2>
      <DocP>You become eligible for compensation when all three conditions are met:</DocP>
      <DocUL items={[
        'You are enrolled in the study and the study has been completed',
        'Your compliance score meets or exceeds the study\'s compliance threshold',
        'No protocol violations have been flagged against your participation',
      ]} />
      <DocP>
        If any of these conditions are not met, you will not be eligible for compensation for that
        study.
      </DocP>

      <DocH2>Compensation amount</DocH2>
      <DocP>
        Your compensation follows the schedule listed on the study page — either a single amount on
        completion or staged amounts tied to specific milestones, depending on how the research team
        configured the study.
      </DocP>
      <DocP>
        The research team deposits the full compensation budget with Biome before the study
        launches, so the funds for your compensation are committed and held before you begin the
        protocol. Third-party processing fees may apply depending on your compensation method.
      </DocP>

      <DocH2>Compensation methods</DocH2>
      <DocP>
        Biome supports compensation methods that may include bank transfer and supported digital
        payout methods. Availability depends on your country, provider support, and compliance
        checks.
      </DocP>
      <DocP>
        Timing is not guaranteed. Processing time may vary depending on the method, banking systems,
        currency conversion, compliance review, and recipient account status. If currency conversion
        is required, the provider may apply its own exchange rate and fees. Biome does not guarantee
        mid-market exchange rates.
      </DocP>

      <DocH2>Compensation status</DocH2>
      <DocP>You can track your compensation status in your dashboard:</DocP>
      <DocTable
        headers={['Status', 'Meaning']}
        rows={[
          ['Not applicable', 'Study is still in progress'],
          ['Pending',        'Study is complete, compensation is being prepared'],
          ['Processing',     'Compensation has been initiated'],
          ['Processed',      'Compensation has been delivered'],
          ['Not eligible',   'Compliance below threshold or violation flagged'],
        ]}
      />

      <DocH2>Audit trail</DocH2>
      <DocP>
        Every compensation event — eligibility determination, initiation, delivery, and any
        adjustment — is recorded with a timestamp and is visible in your dashboard. If you believe a
        decision was made unfairly, you can raise a dispute (see Agreements &amp; policies) or
        contact <a href="mailto:contact@biome.to" style={{ color: 'var(--teal-dark)', fontWeight: 550 }}>contact@biome.to</a>.
      </DocP>

      <DocNav
        prev={{ label: 'Milestones & sample kits', href: '/docs/participants/milestones' }}
        next={{ label: 'For researchers', href: '/docs/researchers' }}
      />
    </article>
  );
}
