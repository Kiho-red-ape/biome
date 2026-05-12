import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocOL, DocUL, DocNav,
} from '../docs-components';

export default function ResearchersPage() {
  return (
    <article>
      <DocLabel text="FOR RESEARCHERS" />
      <DocH1>Getting started as a researcher</DocH1>
      <DocLead>
        Researchers on BIOME represent organizations: labs, startups, research groups, or independent
        investigators. To post studies, you first need to create an experimenter profile.
      </DocLead>

      <DocH2>Estimating study cost</DocH2>
      <DocP>
        Before registering, use the <a href="/run-a-study#estimate" style={{ color: 'var(--green)', textDecoration: 'none' }}>Study Cost Estimator</a> on
        the Run a Study page to get an indicative budget. Enter your study type, participant count,
        geography, and sample types. The estimator shows fully itemised pass-through costs plus a
        Biome operations fee. This is not a quote — final pricing is confirmed in conversation.
      </DocP>

      <DocH2>Creating your organization profile</DocH2>
      <DocP>During registration:</DocP>
      <DocOL items={[
        'Sign in with email or wallet through Privy',
        'Complete basic profile (region)',
        'Select the "Experimenter" or "Both" role',
        'Fill in your organization details: name, website, description, your title, and expertise areas',
        'Accept the Platform Terms of Service',
      ]} />
      <DocP>
        Your organization profile is reviewed before activation. In the current platform version,
        approval is automatic for demonstration purposes. In production, BIOME reviews organization
        profiles manually before granting publishing access.
      </DocP>
      <DocP>
        Once approved, your organization page is publicly visible showing your organization name,
        description, expertise areas, and study history.
      </DocP>


      <DocH2>What you can do as a researcher</DocH2>
      <DocUL items={[
        'Create and publish studies to the BIOME marketplace',
        'Set eligibility criteria and optional screening quiz questions',
        'Screen applicants in the screening dashboard using eligibility signals and reliability scores',
        'Approve, waitlist, or deny applicants',
        'Launch the study and send an onboarding message to enrolled participants',
        'Verify milestone completions during the study',
        'Review compliance scores and coordinate payouts at study completion',
      ]} />

      <DocNav
        prev={{ label: 'Payouts', href: '/docs/participants/payouts' }}
        next={{ label: 'Creating a study', href: '/docs/researchers/creating-study' }}
      />
    </article>
  );
}
