import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocOL, DocUL, DocLink, DocNav, Callout,
} from '../docs-components';

export default function ResearchersPage() {
  return (
    <article>
      <DocLabel text="For researchers" />
      <DocH1>For researchers</DocH1>
      <DocLead>
        Researchers on Biome represent organizations: labs, startups, research groups, or
        independent investigators. You bring a ready study — Biome runs the operations so you can
        run your research independently, on your terms.
      </DocLead>

      <DocH2>Step 1 — Request an estimate</DocH2>
      <DocP>
        Every study starts with an intake. From the{' '}
        <DocLink href="/run-a-study">Run a Study</DocLink> page, describe your study scope: cohort
        size, sample types, duration, and geographies. Pricing on Biome is a per-study operations
        quote based on that scope — there are no listing fees or publishing fees.
      </DocP>
      <DocP>
        You will receive a transparent, line-item breakdown of the estimated operations cost before
        committing to anything. You can also reach the team directly at{' '}
        <a href="mailto:contact@biome.to" style={{ color: 'var(--teal-dark)', fontWeight: 550 }}>contact@biome.to</a>.
      </DocP>

      <DocH2>Step 2 — Scoping call and operations plan</DocH2>
      <DocP>
        After intake, you have a scoping call with the Biome team to confirm the operational
        details: recruitment targets, screening approach, kit logistics, milestone structure, and
        the compensation schedule. The output is an operations plan and a final line-item quote.
        Compensation budgets are deposited upfront and held by Biome; Biome charges an operations
        fee for running the study.
      </DocP>
      <Callout>
        Biome does not provide or obtain IRB or ethics approval. You bring your own approval —
        Biome stores it in your document vault and verifies it is on file before your study can
        launch.
      </Callout>

      <DocH2>Creating your organization profile</DocH2>
      <DocP>During registration:</DocP>
      <DocOL items={[
        'Sign in with your email',
        'Complete your basic profile (region)',
        'Select the researcher role',
        'Fill in your organization details: name, website, description, your title, and expertise areas',
        'Accept the Platform Terms of Service',
      ]} />
      <DocP>
        Your organization profile is reviewed by Biome before your studies can go live. Once
        approved, your organization page is publicly visible, showing your organization name,
        description, expertise areas, and study history.
      </DocP>

      <DocH2>What you can do as a researcher</DocH2>
      <DocUL items={[
        'Set up your study: document vault, milestones, screening criteria, and compensation schedule',
        'Launch recruitment and reach Biome\'s research-partner pool',
        'Screen applicants in the screening dashboard using eligibility signals and reliability scores',
        'Approve, waitlist, or deny applicants',
        'Run live operations: kit logistics with chain-of-custody, milestone verification, pseudonymised messaging, and dropout-risk alerts',
        'Release compensation payouts against verified completion, with a full audit trail',
        'Export the complete compliance record and final report at study close',
      ]} />

      <DocNav
        prev={{ label: 'Compensation', href: '/docs/participants/payouts' }}
        next={{ label: 'Setting up your study', href: '/docs/researchers/creating-study' }}
      />
    </article>
  );
}
