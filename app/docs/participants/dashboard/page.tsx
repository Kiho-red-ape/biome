import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, Code, DocNav,
} from '../../docs-components';

export default function DashboardPage() {
  return (
    <article>
      <DocLabel text="Research partners" />
      <DocH1>Your dashboard</DocH1>
      <DocLead>
        The dashboard at <Code>/dashboard</Code> is your control center. It shows all your study
        activity, milestone progress, sample-kit status, and compensation status.
      </DocLead>

      <DocH2>Dashboard sections</DocH2>

      <DocH3>Active studies</DocH3>
      <DocP>For each study you are enrolled in, the dashboard shows:</DocP>
      <DocUL items={[
        'Study title and category',
        'Current week of the study (e.g., Week 3 of 8)',
        'Compliance progress bar and percentage',
        'Compensation eligibility status: "On track," "At risk," or "Not eligible"',
        'Milestone checklist organized by week (see Milestones & sample kits)',
        'Sample-kit status for any kits assigned to you (dispatched, delivered, returned, received by lab)',
        'Messages from the research team, delivered under your pseudonym',
      ]} />

      <DocH3>Applications</DocH3>
      <DocP>All studies you have applied to, with current status:</DocP>
      <DocUL items={[
        'Under review — awaiting the research team’s decision',
        'Accepted — you have been selected, awaiting enrollment or study launch',
        'Waitlisted — you may be accepted if a spot opens',
        'Not selected — application was not approved',
      ]} />

      <DocH3>Completed studies</DocH3>
      <DocP>Studies you have finished, showing:</DocP>
      <DocUL items={[
        'Final compliance score',
        'Compensation status (eligible, pending, processed, or not eligible)',
        'Compensation amount if applicable',
      ]} />

      <DocH3>Profile completeness</DocH3>
      <DocP>
        A progress indicator showing which profile sections you have completed, with links to fill
        in remaining sections.
      </DocP>

      <DocNav
        prev={{ label: 'Applying to a study', href: '/docs/participants/applying' }}
        next={{ label: 'Milestones & sample kits', href: '/docs/participants/milestones' }}
      />
    </article>
  );
}
