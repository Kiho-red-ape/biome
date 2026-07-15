import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocTable, DocNav, DocLink,
} from '../docs-components';

export default function ExecutionPage() {
  return (
    <article>
      <DocLabel text="Study lifecycle" />
      <DocH1>Study lifecycle</DocH1>
      <DocLead>
        A study on Biome moves through a defined sequence of states from intake to final report.
        Research partners have corresponding states that track their position in the lifecycle.
      </DocLead>

      <DocH2>Study states</DocH2>
      <DocTable
        headers={['State', 'Description']}
        rows={[
          ['Intake',            'Estimate requested. Scope (cohort size, sample types, duration, geographies) under review.'],
          ['Scoping',           'Scoping call held; operations plan and line-item quote being agreed.'],
          ['Setup',             'Document vault being populated and study configured. All fields editable. Not visible to research partners.'],
          ['Recruiting',        'Pre-launch checklist passed; listing is live and applications are open.'],
          ['Screening closed',  'Research team has finished reviewing. No new applications accepted.'],
          ['Ready to commence', 'Compensation budget confirmed on deposit. Onboarding message drafted.'],
          ['Active',            'Study is in progress. Milestones, kit logistics, and compliance tracking are live.'],
          ['Completed',         'All milestones resolved. Compensation eligibility determined and payouts released.'],
          ['Closed',            'Compliance export delivered and final report issued.'],
          ['Cancelled',         'Study was cancelled before completion.'],
        ]}
      />

      <DocH2>Research partner states within a study</DocH2>
      <DocTable
        headers={['State', 'Description']}
        rows={[
          ['Applied',      'Application submitted, under review'],
          ['Accepted',     'Approved by the research team, awaiting enrollment or study commencement'],
          ['Waitlisted',   'On standby, may be accepted if a spot opens'],
          ['Not selected', 'Application was not approved'],
          ['Enrolled',     'Onboarding complete, awaiting study commencement'],
          ['Active',       'Study commenced, completing milestones'],
          ['Completed',    'All milestones resolved'],
          ['Withdrawn',    'Withdrew from the study'],
        ]}
      />

      <DocH2>Milestones</DocH2>
      <DocP>
        Milestones are generated for each enrolled research partner when the study commences. Due
        dates are calculated from the commencement date based on the week number assigned to each
        milestone.
      </DocP>
      <DocP>
        For a detailed explanation of milestone types, statuses, sample kits, and compliance
        scoring, see{' '}
        <DocLink href="/docs/participants/milestones">Milestones and sample kits</DocLink>.
      </DocP>

      <DocNav
        prev={{ label: 'How screening works', href: '/docs/screening' }}
        next={{ label: 'Pricing & payouts', href: '/docs/payouts' }}
      />
    </article>
  );
}
