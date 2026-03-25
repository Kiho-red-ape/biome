import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocOL, DocNav,
} from '../docs-components';

export default function ScreeningPage() {
  return (
    <article>
      <DocLabel text="SCREENING" />
      <DocH1>How screening works</DocH1>
      <DocLead>
        Screening on BIOME is designed to give researchers better signal with less manual work, while
        ensuring participants are evaluated fairly and anonymously.
      </DocLead>

      <DocH2>The screening process</DocH2>
      <DocOL items={[
        'A participant applies to a study',
        'BIOME calculates an eligibility status based on the participant\'s profile data and quiz responses (if the study includes a quiz)',
        'BIOME surfaces the participant\'s reliability score based on their platform-wide track record',
        'The researcher reviews the application in their screening dashboard',
        'The researcher makes the final decision: approve, waitlist, or deny',
      ]} />
      <DocP>
        Screening is researcher-driven. BIOME provides signals but does not auto-approve or
        auto-reject anyone.
      </DocP>

      <DocH2>Eligibility</DocH2>
      <DocP>
        Eligibility is study-specific. It compares the participant&apos;s profile against the
        study&apos;s inclusion criteria, exclusion criteria, age range, and eligibility quiz responses.
      </DocP>
      <DocP>
        A participant marked as &quot;Eligible&quot; matches the defined criteria. A participant marked
        as &quot;Not eligible&quot; has one or more mismatches. In both cases, the researcher makes the
        final call — eligibility is advisory, not binding.
      </DocP>

      <DocH2>Reliability</DocH2>
      <DocP>
        Reliability is platform-wide. It reflects the participant&apos;s behavior across all studies
        they have participated in on BIOME:
      </DocP>
      <DocP>
        — How many studies they have completed
        <br />— Their average compliance score
        <br />— Whether they have withdrawals, no-shows, or violations in their history
      </DocP>
      <DocP>The reliability score uses a weighted formula:</DocP>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        color: 'var(--green)', background: 'rgba(77,255,128,0.06)',
        border: '1px solid rgba(77,255,128,0.15)',
        padding: '14px 18px', borderRadius: 3, marginBottom: 14,
        whiteSpace: 'pre-wrap',
      }}>
        {`reliability = (completion_rate × 0.6)\n           + (min(studies_completed, 20) / 20 × 100 × 0.4)`}
      </div>
      <DocP>
        A participant needs at least 3 completed studies for their reliability score to be meaningful.
      </DocP>

      <DocH2>Anonymity in screening</DocH2>
      <DocP>
        Researchers see the participant&apos;s pseudonym, identicon, region, age range, device
        capability, sample comfort, language fluency, and study history. They never see the
        participant&apos;s real name, email address, phone number, or government identification. All
        screening is conducted through anonymized profiles.
      </DocP>

      <DocNav
        prev={{ label: 'Compliance & verification', href: '/docs/researchers/compliance' }}
        next={{ label: 'Study lifecycle', href: '/docs/execution' }}
      />
    </article>
  );
}
