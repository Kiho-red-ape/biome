import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, Screenshot, DocNav,
} from '../../docs-components';

export default function LaunchingPage() {
  return (
    <article>
      <DocLabel text="RESEARCHERS" />
      <DocH1>Launching a study</DocH1>
      <DocLead>
        After screening is complete, the launch process involves two confirmation steps before the
        study begins and participants start receiving milestones.
      </DocLead>

      <DocH2>After screening</DocH2>
      <DocP>
        Once you have approved your cohort, the launch process involves these steps before the study
        begins.
      </DocP>

      <DocH3>Step 1 — Close screening</DocH3>
      <DocP>
        Click &quot;Close screening and proceed&quot; to stop accepting new applications. This changes
        the study status from screening to the next phase.
      </DocP>

      <DocH3>Step 2 — Funding hold</DocH3>
      <DocP>
        Before launching, you are asked to confirm that your payout pool is funded. The platform
        displays:
      </DocP>
      <DocUL items={[
        'Total payout obligation: reward per participant × number of approved participants',
        'Platform fee estimate',
        'Confirmation button',
      ]} />
      <DocP>
        This step ensures that funds are committed before participants begin the protocol. Full payment
        rail implementation is evolving, but the state model supports this phase from the start.
      </DocP>

      <DocH3>Step 3 — Send onboarding message</DocH3>
      <DocP>
        Before launching, you draft an onboarding message for approved participants. This message is
        sent through BIOME from hello@biome.to (not from your personal email). You define:
      </DocP>
      <DocUL items={[
        'Subject line',
        'Message body',
        'Enrollment or handoff link (must be HTTPS)',
      ]} />
      <DocP>
        Participants see this message in their dashboard when they are accepted. A copy is sent to
        your email.
      </DocP>

      <DocH3>Step 4 — Commence study</DocH3>
      <DocP>Clicking &quot;Launch study&quot; will:</DocP>
      <DocUL items={[
        'Change the study status to Active',
        'Generate milestones for all enrolled participants with due dates calculated from the launch date',
        'Notify all participants that the study has begun',
        'Begin the compliance tracking period',
      ]} />

      <Screenshot caption="Launch flow showing funding hold confirmation and message composer" />

      <DocNav
        prev={{ label: 'Screening applicants', href: '/docs/researchers/screening' }}
        next={{ label: 'Compliance & verification', href: '/docs/researchers/compliance' }}
      />
    </article>
  );
}
