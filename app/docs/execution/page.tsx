import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocTable, DocNav, Code,
} from '../docs-components';
import Link from 'next/link';

export default function ExecutionPage() {
  return (
    <article>
      <DocLabel text="STUDY LIFECYCLE" />
      <DocH1>Study lifecycle</DocH1>
      <DocLead>
        A study on BIOME moves through a defined sequence of states from creation to completion.
        Both researchers and participants have corresponding states that track their position in
        the lifecycle.
      </DocLead>

      <DocH2>Study states</DocH2>
      <DocTable
        headers={['State', 'Description']}
        rows={[
          ['Draft',             'Study is being created. All fields editable. Not visible on marketplace.'],
          ['Published',         'Study is live on the marketplace. Participants can apply.'],
          ['Screening',         'Applications are being reviewed by the researcher.'],
          ['Screening closed',  'Researcher has finished reviewing. No new applications accepted.'],
          ['Funding hold',      'Payout pool funding is being confirmed before launch.'],
          ['Ready to launch',   'Funding confirmed. Onboarding message drafted. Ready to commence.'],
          ['Active',            'Study is in progress. Milestones are being completed.'],
          ['Completed',         'All milestones resolved. Payout eligibility determined.'],
          ['Cancelled',         'Study was cancelled before completion.'],
        ]}
      />

      <DocH2>Participant states within a study</DocH2>
      <DocTable
        headers={['State', 'Description']}
        rows={[
          ['Applied',      'Application submitted, under review'],
          ['Accepted',     'Approved by researcher, awaiting enrollment or study launch'],
          ['Waitlisted',   'On standby, may be accepted if a spot opens'],
          ['Not selected', 'Application was not approved'],
          ['Enrolled',     'Onboarding complete, awaiting study launch'],
          ['Active',       'Study launched, completing milestones'],
          ['Completed',    'All milestones resolved'],
          ['Withdrawn',    'Participant withdrew from the study'],
        ]}
      />

      <DocH2>Milestones</DocH2>
      <DocP>
        Milestones are generated for each enrolled participant when the study launches. Due dates are
        calculated from the study launch date based on the week number assigned to each milestone.
      </DocP>
      <DocP>
        For a detailed explanation of milestone types, statuses, and compliance scoring, see{' '}
        <Link href="/docs/participants/milestones" style={{ color: 'var(--green)' }}>
          Milestones and Compliance
        </Link>.
      </DocP>

      <DocNav
        prev={{ label: 'How screening works', href: '/docs/screening' }}
        next={{ label: 'Payouts & fees', href: '/docs/payouts' }}
      />
    </article>
  );
}
