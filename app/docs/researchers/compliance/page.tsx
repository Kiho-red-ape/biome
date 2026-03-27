import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocUL, DocTable, DocNav,
} from '../../docs-components';

export default function ResearcherCompliancePage() {
  return (
    <article>
      <DocLabel text="RESEARCHERS" />
      <DocH1>Compliance and verification</DocH1>
      <DocLead>
        Once your study is active, you track participant progress, verify milestone submissions, and
        manage payout eligibility from your compliance view.
      </DocLead>

      <DocH2>Tracking participant compliance</DocH2>
      <DocP>
        Once your study is active, the compliance view shows each enrolled participant&apos;s progress:
      </DocP>
      <DocUL items={[
        'Compliance percentage (verified milestones / total milestones)',
        'Milestone breakdown (completed, pending, submitted, overdue, missed)',
        'Current study week',
      ]} />

      <DocH2>Verifying milestones</DocH2>
      <DocP>
        The pending verifications queue shows all milestones that participants have submitted and are
        awaiting your review. For each submission:
      </DocP>
      <DocUL items={[
        'Review the participant\'s submission',
        'Click "Verify" to confirm the milestone is complete',
        'Click "Reject" to return it to the participant with a reason',
      ]} />
      <DocP>
        You are expected to process milestone verifications within 5 business days of submission, as
        specified in the Experimenter Study Agreement.
      </DocP>

      <DocH2>Flagging violations</DocH2>
      <DocP>
        If a participant violates the study protocol, you can flag a violation from the compliance
        view. This:
      </DocP>
      <DocUL items={[
        'Records the violation reason',
        'Disqualifies the participant from payout regardless of compliance score',
        'Notifies the participant',
      ]} />
      <DocP>
        The participant has 7 days to raise a dispute if they believe the flag is unfair.
      </DocP>

      <DocH2>Payout summary</DocH2>
      <DocP>After study completion, the payout summary shows:</DocP>
      <DocTable
        headers={['Column', 'Description']}
        rows={[
          ['Participant',  'Pseudonym'],
          ['Compliance',   'Final percentage'],
          ['Eligible',     'Whether they met the compliance threshold'],
          ['Amount',       'Payout amount'],
          ['Status',       'Pending, processing, paid, or forfeited'],
        ]}
      />
      <DocP>
        The &quot;Export CSV&quot; button downloads a payout-ready file with participant IDs,
        compliance scores, eligibility status, and amounts. This file is used to process payouts.
      </DocP>


      <DocNav
        prev={{ label: 'Launching a study', href: '/docs/researchers/launching' }}
        next={{ label: 'How screening works', href: '/docs/screening' }}
      />
    </article>
  );
}
