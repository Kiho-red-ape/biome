import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, Callout, DocNav,
} from '../../docs-components';

export default function PublishingPage() {
  return (
    <article>
      <DocLabel text="Researchers" />
      <DocH1>Launch and recruitment</DocH1>
      <DocLead>
        When your study setup is complete, the launch flow walks you through a pre-launch checklist
        before recruitment opens. There is no publishing fee — your study goes live once the
        checklist is satisfied.
      </DocLead>

      <DocH2>Pre-launch checklist</DocH2>
      <DocP>Biome verifies the following before recruitment can open:</DocP>
      <DocUL items={[
        'IRB/ethics approval is on file in the document vault',
        'The study protocol is on file in the document vault',
        'The service agreement and data processing agreement have been e-signed',
        'Consent forms are uploaded and ready for research partners to e-sign',
        'The compensation budget has been deposited and is held by Biome',
      ]} />
      <Callout>
        The compensation budget is committed before anyone enrolls. This guarantees research
        partners that funds for their compensation exist before they begin the protocol.
      </Callout>

      <DocH2>The launch flow</DocH2>

      <DocH3>Step 1 — Final review</DocH3>
      <DocP>
        Review all study details in a read-only preview format: basics, milestones, screening
        criteria, and the compensation schedule. Confirm everything is correct before proceeding.
      </DocP>

      <DocH3>Step 2 — Recruitment window</DocH3>
      <DocP>
        Set how long applications should remain open. The maximum recruitment window is 90 days.
        The application deadline is calculated from the launch date.
      </DocP>

      <DocH3>Step 3 — Confirm and go live</DocH3>
      <DocP>
        On confirmation, your study listing becomes visible to research partners and applications
        open. The launch date and application deadline are recorded and displayed on the study page.
      </DocP>

      <DocH2>The live study listing</DocH2>
      <DocP>Once recruitment is open, your study page displays:</DocP>
      <DocUL items={[
        'Study title, description, category, and organization',
        'Compensation schedule, cohort size, and duration',
        'Compact summary: format, duration, compliance threshold, inputs, devices, sample types, visit requirements',
        'Weekly milestone schedule',
        'Screening criteria (who is eligible, who is not eligible, what is collected)',
        'Q&A section for applicant questions',
        'Application deadline with countdown',
      ]} />

      <DocH2>During recruitment</DocH2>
      <DocP>
        Applications flow into your screening dashboard as they arrive — you can begin screening
        immediately rather than waiting for the window to close. Recruitment progress (applications
        received, slots approved) is visible on your researcher dashboard, and Biome flags early if
        application volume looks unlikely to fill your cohort so the plan can be adjusted.
      </DocP>

      <DocNav
        prev={{ label: 'Setting up your study', href: '/docs/researchers/creating-study' }}
        next={{ label: 'Screening applicants', href: '/docs/researchers/screening' }}
      />
    </article>
  );
}
