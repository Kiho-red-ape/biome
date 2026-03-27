import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, DocNav,
} from '../../docs-components';

export default function PublishingPage() {
  return (
    <article>
      <DocLabel text="RESEARCHERS" />
      <DocH1>Publishing and recruitment</DocH1>
      <DocLead>
        When your study is ready, the publish flow walks you through a final confirmation before your
        study goes live on the marketplace.
      </DocLead>

      <DocH2>The publish flow</DocH2>

      <DocH3>Step 1 — Final review</DocH3>
      <DocP>
        Review all study details in a read-only preview format. Confirm everything is correct before
        proceeding.
      </DocP>

      <DocH3>Step 2 — Recruitment timeline</DocH3>
      <DocP>
        Set how long applications should remain open. The maximum recruitment window is 90 days. The
        application deadline is calculated from the publish date.
      </DocP>

      <DocH3>Step 3 — Publish payment</DocH3>
      <DocP>
        Your first study on BIOME is free to publish. Subsequent studies require a one-time $99
        publish fee. You will also review and accept the Experimenter Study Agreement at this step.
      </DocP>

      <DocH3>Step 4 — Confirm</DocH3>
      <DocP>
        On confirmation, your study becomes visible on the marketplace. The publish date and application
        deadline are recorded and displayed on the study page.
      </DocP>

      <DocH2>Published study page</DocH2>
      <DocP>Once published, your study page displays:</DocP>
      <DocUL items={[
        'Study title, description, category, and organization',
        'Reward amount, slot count, duration',
        'Compact summary: format, duration, compliance minimum, inputs, devices, sample types, visit requirements',
        'Weekly milestone schedule',
        'Eligibility criteria (who is eligible, who is not eligible, what is collected)',
        'Q&A section for participant questions',
        'Application deadline with countdown',
        'BIOME Verified badge if applicable',
      ]} />


      <DocNav
        prev={{ label: 'Creating a study', href: '/docs/researchers/creating-study' }}
        next={{ label: 'Screening applicants', href: '/docs/researchers/screening' }}
      />
    </article>
  );
}
