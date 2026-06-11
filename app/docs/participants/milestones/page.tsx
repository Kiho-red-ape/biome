import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocUL, DocOL, DocTable, Code, DocCodeBlock, DocNav,
} from '../../docs-components';

export default function MilestonesPage() {
  return (
    <article>
      <DocLabel text="Research partners" />
      <DocH1>Milestones and sample kits</DocH1>
      <DocLead>
        Milestones are the checkpoints that define what you need to complete during a study. Your
        compliance score — calculated from verified milestones — determines your compensation
        eligibility. For studies that involve samples, kits are shipped to you and tracked end to end.
      </DocLead>

      <DocH2>How milestones work</DocH2>
      <DocP>
        Each study defines a set of milestones organized by week. A milestone represents a required
        task, checkpoint, or submission within the study protocol. Examples include:
      </DocP>
      <DocUL items={[
        'Complete a baseline intake survey',
        'Return a stool sample kit',
        'Log symptoms daily for one week',
        'Complete a midpoint questionnaire',
        'Confirm wearable data sync',
      ]} />
      <DocP>
        Milestones are not generated in your dashboard until the study commences. Once the research
        team launches the study, your milestone checklist appears with due dates calculated from the
        study start date.
      </DocP>

      <DocH2>Milestone types</DocH2>
      <DocP>There are two types of milestones:</DocP>
      <DocP>
        <Code>Self-report</Code> — You mark the milestone as completed. The research team then
        reviews and verifies your submission. Until it is verified, the milestone shows as
        &quot;Submitted — awaiting verification.&quot;
      </DocP>
      <DocP>
        <Code>Team-confirm</Code> — The research team marks this milestone as completed (e.g., the
        lab confirms it received your sample kit). You will see &quot;Waiting for confirmation&quot;
        until it is verified.
      </DocP>

      <DocH2>Milestone statuses</DocH2>
      <DocTable
        headers={['Status', 'Meaning']}
        rows={[
          ['Pending',    'Not yet due or not yet started'],
          ['Submitted',  'You have marked it complete, awaiting verification by the research team'],
          ['Verified',   'The research team has confirmed completion'],
          ['Rejected',   'The research team did not accept your submission — you may need to redo it'],
          ['Overdue',    'Past due date but not yet missed'],
          ['Missed',     'More than 7 days overdue — counts against your compliance'],
        ]}
      />

      <DocH2>Sample kits</DocH2>
      <DocP>
        If your study involves samples (e.g., stool, saliva, blood prick), Biome handles the kit
        logistics. A typical kit flow looks like this:
      </DocP>
      <DocOL items={[
        'A kit is dispatched to your address — you can track it from your dashboard',
        'You collect the sample following the instructions included with the kit',
        'You return the kit using the prepaid return packaging (drop-off or scheduled pickup, depending on your region)',
        'The lab confirms receipt, and the linked milestone is verified',
      ]} />
      <DocP>
        Every kit is tracked with a chain-of-custody record from dispatch to lab receipt, so both
        you and the research team can always see where a sample is. Kits are labeled with your
        Participant ID — never your name.
      </DocP>

      <DocH2>Compliance scoring</DocH2>
      <DocP>Your compliance score for a study is calculated as:</DocP>
      <DocCodeBlock>compliance = verified milestones ÷ total milestones</DocCodeBlock>
      <DocP>
        There are no weights. Each milestone counts equally. The score is binary per milestone:
        verified counts as complete, everything else does not.
      </DocP>
      <DocP>
        Each study has a compliance threshold set by the research team during study setup. Your
        compensation eligibility depends on meeting this threshold.
      </DocP>

      <DocH2>Reminders</DocH2>
      <DocP>Biome sends reminders for upcoming and overdue milestones:</DocP>
      <DocUL items={[
        '2 days before a milestone is due: in-app notification',
        '1 day after a milestone is overdue: in-app notification and warning in dashboard',
        '7 days overdue: milestone automatically marked as "missed"',
      ]} />
      <DocP>
        If you have enabled email notifications in your settings, you will also receive email
        reminders.
      </DocP>

      <DocNav
        prev={{ label: 'Your dashboard', href: '/docs/participants/dashboard' }}
        next={{ label: 'Compensation', href: '/docs/participants/payouts' }}
      />
    </article>
  );
}
