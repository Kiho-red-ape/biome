import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocUL, DocTable, Screenshot, DocNav,
} from '../../docs-components';

export default function ParticipantPayoutsPage() {
  return (
    <article>
      <DocLabel text="PARTICIPANTS" />
      <DocH1>Payouts</DocH1>
      <DocLead>
        Participants receive payment upon completing a study above the compliance threshold. Payouts
        are coordinated through BIOME after the researcher confirms study completion.
      </DocLead>

      <DocH2>Payout eligibility</DocH2>
      <DocP>You become eligible for payout when all three conditions are met:</DocP>
      <DocUL items={[
        'You are enrolled in the study and the study has been completed',
        'Your compliance score meets or exceeds the study\'s compliance threshold',
        'No protocol violations have been flagged against your participation',
      ]} />
      <DocP>
        If any of these conditions are not met, you will not be eligible for payout for that study.
      </DocP>

      <DocH2>Payout amount</DocH2>
      <DocP>
        The payout amount is the per-participant reward listed on the study page. BIOME&apos;s platform
        fee is charged to the researcher, not deducted from your reward. However, third-party fees may
        apply depending on your payout method.
      </DocP>
      <DocP>
        A participant payout processing fee of 0.5% of the total payout amount applies.
      </DocP>

      <DocH2>Payout methods</DocH2>
      <DocP>
        BIOME supports payout methods that may include bank transfer, supported digital payout methods,
        and, where available, cryptocurrency payouts. Availability depends on your country, provider
        support, and compliance checks.
      </DocP>
      <DocP>
        Payout timing is not guaranteed. Processing time may vary depending on the payout method,
        banking systems, currency conversion, compliance review, and recipient account status. If
        currency conversion is required, the payout provider may apply its own exchange rate and fees.
        BIOME does not guarantee mid-market exchange rates.
      </DocP>

      <DocH2>Payout status</DocH2>
      <DocP>You can track your payout status in your dashboard:</DocP>
      <DocTable
        headers={['Status', 'Meaning']}
        rows={[
          ['Not applicable', 'Study is still in progress'],
          ['Pending',        'Study is complete, payout is being processed'],
          ['Processing',     'Payout has been initiated'],
          ['Paid',           'Payout has been delivered'],
          ['Not eligible',   'Compliance below threshold or violation flagged'],
        ]}
      />

      <DocH2>Deposits</DocH2>
      <DocP>
        Some studies may require a participation deposit. This is a small amount (typically 1/5th of
        the reward) that you commit when enrolling. The deposit is returned to you upon successful
        completion above the compliance threshold. If you withdraw after the first 7 days or fail to
        meet the compliance threshold, the deposit may be forfeited.
      </DocP>
      <DocP>
        Withdrawal within the first 7 days of study commencement returns your deposit in full
        regardless of compliance status.
      </DocP>

      <Screenshot caption="Participant dashboard showing completed study with 'Paid $45.00' status" />

      <DocNav
        prev={{ label: 'Milestones & compliance', href: '/docs/participants/milestones' }}
        next={{ label: 'Getting started as a researcher', href: '/docs/researchers' }}
      />
    </article>
  );
}
