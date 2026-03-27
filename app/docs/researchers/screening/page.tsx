import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocTable, DocNav,
} from '../../docs-components';

export default function ResearcherScreeningPage() {
  return (
    <article>
      <DocLabel text="RESEARCHERS" />
      <DocH1>Screening applicants</DocH1>
      <DocLead>
        The screening dashboard gives you everything you need to review applicants and make informed
        selection decisions — without seeing any personal identifying information.
      </DocLead>

      <DocH2>The screening dashboard</DocH2>
      <DocP>
        When participants apply to your study, their applications appear in your screening dashboard.
        This dashboard is designed to support quick, informed review.
      </DocP>

      <DocH3>What you see for each applicant</DocH3>
      <DocTable
        headers={['Column', 'Description']}
        rows={[
          ['Participant',  'Pseudonym and identicon (anonymous identity)'],
          ['Region',       'Country and region'],
          ['Eligibility',  'Eligible or Not eligible — based on quiz responses and profile match'],
          ['Reliability',  'Track record from previous studies on BIOME (completion history, consistency)'],
          ['Applied',      'Date of application'],
          ['Actions',      'Approve, Waitlist, or Deny'],
        ]}
      />

      <DocH3>Eligibility vs reliability</DocH3>
      <DocP>These are two different signals:</DocP>
      <DocP>
        <strong style={{ color: 'var(--text-bright)' }}>Eligibility</strong> is study-specific. It
        reflects whether the participant&apos;s profile data and quiz responses match your inclusion
        and exclusion criteria.
      </DocP>
      <DocP>
        <strong style={{ color: 'var(--text-bright)' }}>Reliability</strong> is platform-wide. It
        reflects the participant&apos;s completion rate and consistency across all previous studies on
        BIOME. A participant with high reliability has a track record of completing studies and meeting
        compliance thresholds.
      </DocP>

      <DocH3>Slot counting</DocH3>
      <DocP>
        Only approved participants count toward your filled slots. Applied, eligible-but-unapproved,
        and waitlisted participants do not consume slots. If your study has 100 slots and you have
        approved 23 participants, the display reads &quot;23/100 slots filled.&quot;
      </DocP>

      <DocH3>Actions</DocH3>
      <DocTable
        headers={['Action', 'Effect']}
        rows={[
          ['Approve',    'Participant is accepted into the study and consumes a slot'],
          ['Waitlist',   'Participant is placed on standby and notified if a spot opens'],
          ['Deny',       'Participant is not selected for this study'],
        ]}
      />
      <DocP>
        When you click a participant&apos;s pseudonym, a screening card drops down showing their
        demographic data, device capability, sample comfort, language fluency, completion rate, and
        study history. This data is only visible to you and only for participants who have applied to
        your study. You never see their real name, email, phone, or personal contact information.
      </DocP>


      <DocNav
        prev={{ label: 'Publishing & recruitment', href: '/docs/researchers/publishing' }}
        next={{ label: 'Launching a study', href: '/docs/researchers/launching' }}
      />
    </article>
  );
}
