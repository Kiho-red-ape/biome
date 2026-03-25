import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, DocTable, Screenshot, Code, DocNav,
} from '../../docs-components';

export default function MilestonesPage() {
  return (
    <article>
      <DocLabel text="PARTICIPANTS" />
      <DocH1>Milestones and compliance</DocH1>
      <DocLead>
        Milestones are the checkpoints that define what you need to complete during a study.
        Your compliance score — calculated from verified milestones — determines payout eligibility.
      </DocLead>

      <DocH2>How milestones work</DocH2>
      <DocP>
        Each study defines a set of milestones organized by week. A milestone represents a required
        task, checkpoint, or submission within the study protocol. Examples include:
      </DocP>
      <DocUL items={[
        'Complete a baseline intake survey',
        'Ship a stool sample',
        'Log symptoms daily for one week',
        'Complete a midpoint questionnaire',
        'Confirm wearable data sync',
      ]} />
      <DocP>
        Milestones are not generated in your dashboard until the study commences. Once the researcher
        launches the study, your milestone checklist appears with due dates calculated from the study
        start date.
      </DocP>

      <DocH2>Milestone types</DocH2>
      <DocP>There are two types of milestones:</DocP>
      <DocP>
        <Code>Self-report</Code> — You mark the milestone as completed. The researcher then reviews
        and verifies your submission. Until the researcher verifies it, the milestone shows as
        &quot;Submitted — awaiting verification.&quot;
      </DocP>
      <DocP>
        <Code>Experimenter-confirm</Code> — The researcher marks this milestone as completed (e.g.,
        they confirm they received your sample kit). You will see &quot;Waiting for confirmation&quot;
        until it is verified.
      </DocP>

      <DocH2>Milestone statuses</DocH2>
      <DocTable
        headers={['Status', 'Meaning']}
        rows={[
          ['Pending',    'Not yet due or not yet started'],
          ['Submitted',  'You have marked it complete, awaiting researcher verification'],
          ['Verified',   'The researcher has confirmed completion'],
          ['Rejected',   'The researcher did not accept your submission — you may need to redo it'],
          ['Overdue',    'Past due date but not yet missed'],
          ['Missed',     'More than 7 days overdue — counts against your compliance'],
        ]}
      />

      <DocH2>Compliance scoring</DocH2>
      <DocP>Your compliance score for a study is calculated as:</DocP>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 13,
        color: 'var(--green)', background: 'rgba(77,255,128,0.06)',
        border: '1px solid rgba(77,255,128,0.15)',
        padding: '14px 18px', borderRadius: 3, marginBottom: 14,
      }}>
        compliance = verified milestones ÷ total milestones × 100
      </div>
      <DocP>
        There are no weights. Each milestone counts equally. The score is binary per milestone:
        verified counts as complete, everything else does not.
      </DocP>
      <DocP>
        Each study has a compliance threshold set by the researcher (typically 80%). Your payout
        eligibility depends on meeting this threshold.
      </DocP>

      <DocH2>Reminders</DocH2>
      <DocP>BIOME sends reminders for upcoming and overdue milestones:</DocP>
      <DocUL items={[
        '2 days before a milestone is due: in-app notification',
        '1 day after a milestone is overdue: in-app notification and warning in dashboard',
        '7 days overdue: milestone automatically marked as "missed"',
      ]} />
      <DocP>
        If you have enabled email notifications in your settings, you will also receive email reminders.
      </DocP>

      <Screenshot caption="Milestone checklist in participant dashboard showing verified, submitted, pending, and overdue milestones with week headers" />

      <DocNav
        prev={{ label: 'Your dashboard', href: '/docs/participants/dashboard' }}
        next={{ label: 'Payouts', href: '/docs/participants/payouts' }}
      />
    </article>
  );
}
