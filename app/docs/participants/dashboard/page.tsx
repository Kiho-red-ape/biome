import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, Screenshot, DocNav,
} from '../../docs-components';

export default function DashboardPage() {
  return (
    <article>
      <DocLabel text="PARTICIPANTS" />
      <DocH1>Your dashboard</DocH1>
      <DocLead>
        The participant dashboard at <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--green)' }}>/dashboard</code> is
        your control center. It shows all your study activity, compliance progress, and payout status.
      </DocLead>

      <DocH2>Dashboard sections</DocH2>

      <DocH3>Active studies</DocH3>
      <DocP>For each study you are enrolled in, the dashboard shows:</DocP>
      <DocUL items={[
        'Study title and category',
        'Current week of the study (e.g., Week 3 of 8)',
        'Compliance progress bar and percentage',
        'Payout eligibility status: "On track," "At risk," or "Not eligible"',
        'Milestone checklist organized by week (see Milestones & Compliance)',
      ]} />

      <DocH3>Applications</DocH3>
      <DocP>All studies you have applied to, with current status:</DocP>
      <DocUL items={[
        'Under review — awaiting researcher decision',
        'Accepted — you have been selected, awaiting enrollment or study launch',
        'Waitlisted — you may be accepted if a spot opens',
        'Not selected — application was not approved',
      ]} />

      <DocH3>Completed studies</DocH3>
      <DocP>Studies you have finished, showing:</DocP>
      <DocUL items={[
        'Final compliance score',
        'Payout status (eligible, pending, paid, or not eligible)',
        'Payout amount if applicable',
      ]} />

      <DocH3>Profile completeness</DocH3>
      <DocP>
        A progress indicator showing which profile sections you have completed, with links to fill
        in remaining sections.
      </DocP>

      <Screenshot caption="Participant dashboard showing active study with milestone checklist, compliance bar, and an application under review" />

      <DocNav
        prev={{ label: 'Applying to a study', href: '/docs/participants/applying' }}
        next={{ label: 'Milestones & compliance', href: '/docs/participants/milestones' }}
      />
    </article>
  );
}
