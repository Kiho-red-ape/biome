import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocUL, DocTable, DocNav,
} from '../../docs-components';

export default function ResearcherCompliancePage() {
  return (
    <article>
      <DocLabel text="Researchers" />
      <DocH1>Compliance and reporting</DocH1>
      <DocLead>
        Once your study is active, you track progress, verify milestone submissions, and manage
        compensation eligibility from your compliance view. At study close, you release payouts and
        export the complete compliance record.
      </DocLead>

      <DocH2>Tracking compliance</DocH2>
      <DocP>
        The compliance view shows each enrolled research partner&apos;s progress:
      </DocP>
      <DocUL items={[
        'Compliance score (verified milestones out of total milestones)',
        'Milestone breakdown (completed, pending, submitted, overdue, missed)',
        'Sample-kit status and chain-of-custody position, where applicable',
        'Current study week',
        'Dropout-risk flag, if engagement signals suggest someone may not complete',
      ]} />

      <DocH2>Verifying milestones</DocH2>
      <DocP>
        The pending verifications queue shows all milestones that research partners have submitted
        and are awaiting your review. For each submission:
      </DocP>
      <DocUL items={[
        'Review the submission',
        'Click "Verify" to confirm the milestone is complete',
        'Click "Reject" to return it with a reason',
      ]} />
      <DocP>
        You are expected to process milestone verifications within 5 business days of submission, as
        specified in the service agreement.
      </DocP>

      <DocH2>Flagging violations</DocH2>
      <DocP>
        If a research partner violates the study protocol, you can flag a violation from the
        compliance view. This:
      </DocP>
      <DocUL items={[
        'Records the violation reason',
        'Removes compensation eligibility regardless of compliance score',
        'Notifies the research partner',
      ]} />
      <DocP>
        The research partner has 7 days to raise a dispute if they believe the flag is unfair.
      </DocP>

      <DocH2>Releasing compensation payouts</DocH2>
      <DocP>After study completion, the payout summary shows:</DocP>
      <DocTable
        headers={['Column', 'Description']}
        rows={[
          ['Research partner', 'Pseudonym and Participant ID'],
          ['Compliance',       'Final score against the threshold'],
          ['Eligible',         'Whether they met the compliance threshold'],
          ['Amount',           'Compensation amount per the study\'s schedule'],
          ['Status',           'Pending, processing, processed, or not eligible'],
        ]}
      />
      <DocP>
        You confirm the eligibility list, and Biome releases payouts from the compensation budget
        held on deposit. Every payout carries a full audit trail: eligibility determination,
        approval, initiation, and delivery, each timestamped and attributable.
      </DocP>

      <DocH2>Compliance export and final report</DocH2>
      <DocP>
        At study close, you can export the complete operational record of the study from the
        document vault:
      </DocP>
      <DocUL items={[
        'Signed consent records for every enrolled research partner',
        'Milestone logs with verification timestamps',
        'Chain-of-custody records for every sample kit',
        'Messaging logs (pseudonymised)',
        'Compensation payout audit trail',
      ]} />
      <DocP>
        Biome also prepares a final report summarising recruitment, screening outcomes, compliance,
        retention, and payouts — ready to file alongside your study documentation or share with your
        institution.
      </DocP>

      <DocNav
        prev={{ label: 'Live operations', href: '/docs/researchers/launching' }}
        next={{ label: 'How screening works', href: '/docs/screening' }}
      />
    </article>
  );
}
