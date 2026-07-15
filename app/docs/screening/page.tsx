import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocOL, DocUL, DocNav,
} from '../docs-components';

export default function ScreeningPage() {
  return (
    <article>
      <DocLabel text="Screening" />
      <DocH1>How screening works</DocH1>
      <DocLead>
        Screening on Biome is designed to give research teams better signal with less manual work,
        while ensuring applicants are evaluated fairly and pseudonymously.
      </DocLead>

      <DocH2>The screening process</DocH2>
      <DocOL items={[
        'A research partner applies to a study',
        'Biome calculates an eligibility status based on the applicant\'s profile data and questionnaire responses (if the study includes a screening questionnaire)',
        'Biome surfaces the applicant\'s reliability score based on their platform-wide track record',
        'The research team reviews the application in their screening dashboard',
        'The research team makes the final decision: approve, waitlist, or deny',
      ]} />
      <DocP>
        Screening is researcher-driven. Biome provides signals but does not auto-approve or
        auto-reject anyone.
      </DocP>

      <DocH2>Eligibility</DocH2>
      <DocP>
        Eligibility is study-specific. It compares the applicant&apos;s profile against the
        study&apos;s inclusion criteria, exclusion criteria, age range, and screening questionnaire
        responses.
      </DocP>
      <DocP>
        An applicant marked as &quot;Eligible&quot; matches the defined criteria. An applicant
        marked as &quot;Not eligible&quot; has one or more mismatches. In both cases, the research
        team makes the final call — eligibility is advisory, not binding.
      </DocP>

      <DocH2>Reliability</DocH2>
      <DocP>
        Reliability is platform-wide. It reflects the applicant&apos;s behavior across all studies
        they have taken part in on Biome:
      </DocP>
      <DocUL items={[
        'How many studies they have completed',
        'Their average compliance score',
        'Whether they have withdrawals, no-shows, or violations in their history',
      ]} />
      <DocP>
        The score weights completion rate most heavily, with an additional component for the volume
        of completed studies. An applicant needs at least 3 completed studies for their reliability
        score to be meaningful; until then it is shown as provisional.
      </DocP>

      <DocH2>Pseudonymity in screening</DocH2>
      <DocP>
        Research teams see the applicant&apos;s pseudonym, identicon, region, age range, device
        capability, sample comfort, language fluency, and study history. They never see the
        applicant&apos;s real name, email address, phone number, or government identification. All
        screening is conducted through pseudonymised profiles.
      </DocP>

      <DocNav
        prev={{ label: 'Compliance & reporting', href: '/docs/researchers/compliance' }}
        next={{ label: 'Study lifecycle', href: '/docs/execution' }}
      />
    </article>
  );
}
