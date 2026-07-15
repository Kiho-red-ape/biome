import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, DocNav,
} from '../../docs-components';

export default function LaunchingPage() {
  return (
    <article>
      <DocLabel text="Researchers" />
      <DocH1>Live operations</DocH1>
      <DocLead>
        After screening, you commence the study and move into live operations: kit logistics,
        milestone verification, pseudonymised messaging, and dropout-risk monitoring — all from a
        single operations view.
      </DocLead>

      <DocH2>Commencing the study</DocH2>

      <DocH3>Step 1 — Close screening</DocH3>
      <DocP>
        Click &quot;Close screening and proceed&quot; to stop accepting new applications. This
        changes the study status from screening to the pre-launch phase.
      </DocP>

      <DocH3>Step 2 — Compensation budget check</DocH3>
      <DocP>
        Biome confirms that the compensation budget on deposit covers your approved cohort: the
        compensation schedule multiplied by the number of approved research partners. Because the
        budget was deposited during the pre-launch checklist, this is normally a confirmation — if
        you approved more people than originally scoped, you top up the difference here.
      </DocP>

      <DocH3>Step 3 — Send onboarding message</DocH3>
      <DocP>
        Before commencing, you draft an onboarding message for approved research partners. The
        message is delivered pseudonymously through Biome from contact@biome.to — you never see
        recipients&apos; email addresses, and they never see yours. You define:
      </DocP>
      <DocUL items={[
        'Subject line',
        'Message body',
        'Enrollment or handoff link (must be HTTPS)',
      ]} />
      <DocP>
        Research partners see this message in their dashboard when they are accepted. A copy is sent
        to your email.
      </DocP>

      <DocH3>Step 4 — Commence study</DocH3>
      <DocP>Clicking &quot;Commence study&quot; will:</DocP>
      <DocUL items={[
        'Change the study status to Active',
        'Generate milestones for all enrolled research partners, with due dates calculated from the commencement date',
        'Trigger dispatch of the first round of sample kits, if your study uses them',
        'Notify everyone enrolled that the study has begun',
        'Begin the compliance tracking period',
      ]} />

      <DocH2>Running the study</DocH2>

      <DocH3>Kit logistics and chain of custody</DocH3>
      <DocP>
        For studies with samples, Biome manages kit dispatch, returns, and lab hand-off. Every kit
        carries a chain-of-custody record — dispatched, delivered, collected, in transit, received
        by lab — visible to both you and the research partner. Kits are labeled with Participant
        IDs, never names.
      </DocP>

      <DocH3>Milestone tracking</DocH3>
      <DocP>
        The operations view shows each enrolled research partner&apos;s milestone checklist in real
        time: completed, submitted, pending, overdue. Submissions awaiting your verification appear
        in a queue (see Compliance &amp; reporting).
      </DocP>

      <DocH3>Pseudonymised messaging</DocH3>
      <DocP>
        You can message individuals or the whole cohort through the platform. All messaging is
        pseudonymous — addressed to pseudonyms and Participant IDs — preserving the privacy wall
        between your team and research partners while keeping a complete message log with the study
        record.
      </DocP>

      <DocH3>Dropout-risk alerts</DocH3>
      <DocP>
        Biome monitors engagement signals — overdue milestones, unreturned kits, inactivity — and
        flags research partners who look at risk of dropping out, so you can intervene early with a
        reminder or a check-in message instead of losing them from the cohort.
      </DocP>

      <DocNav
        prev={{ label: 'Screening applicants', href: '/docs/researchers/screening' }}
        next={{ label: 'Compliance & reporting', href: '/docs/researchers/compliance' }}
      />
    </article>
  );
}
