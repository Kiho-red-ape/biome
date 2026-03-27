import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, DocOL, DocTable, Term, DocNav,
} from '../docs-components';

export default function OverviewPage() {
  return (
    <article>
      <DocLabel text="OVERVIEW" />
      <DocH1>Platform overview</DocH1>
      <DocLead>
        BIOME is a recruitment and screening platform for human research studies. It connects researchers
        who need participants with people who want to participate in paid studies — from microbiome and
        nutrition research to sleep trials and wearable-tracked protocols.
      </DocLead>
      <DocP>
        The platform handles the operational layer between researchers and participants: study listing,
        participant screening, eligibility matching, milestone tracking, compliance scoring, and payout
        coordination.
      </DocP>

      <DocH2>What BIOME is</DocH2>
      <DocP>
        BIOME is infrastructure. It provides the workflow that moves a study from &quot;I need 50
        participants&quot; to &quot;50 screened, enrolled, compliant participants have completed the
        protocol.&quot;
      </DocP>
      <DocP>Specifically, BIOME provides:</DocP>
      <DocUL items={[
        'A marketplace where researchers publish studies and participants discover them',
        'A profile and screening system that helps researchers find participants who actually match their requirements',
        'A milestone-based compliance tracking system so both sides know whether the protocol is being followed',
        'A payout coordination layer that ties participant compensation to verified completion',
      ]} />

      <DocH2>What BIOME is not</DocH2>
      <DocP>
        BIOME is not a sponsor, a clinical research organization, a medical provider, or an ethics board.
        Researchers remain fully responsible for the design, conduct, safety, and regulatory compliance of
        the studies they run through the platform. BIOME provides coordination infrastructure — not clinical
        oversight.
      </DocP>
      <DocP>
        BIOME does not design studies, provide medical advice, guarantee study outcomes, or verify the safety
        of any intervention, supplement, or protocol — including studies that carry the BIOME Verified badge.
        The Verified badge indicates that BIOME&apos;s science team has reviewed the study methodology. It
        does not constitute a safety endorsement.
      </DocP>

      <DocH2>How the platform works</DocH2>
      <DocP>The BIOME lifecycle follows a straightforward sequence:</DocP>
      <DocOL items={[
        'A researcher creates a study in draft mode, defining the protocol, eligibility criteria, milestones, and bounty',
        'The researcher publishes the study to the marketplace with a recruitment deadline',
        'Participants browse open studies, review requirements, and apply',
        'The researcher screens applicants using eligibility data, quiz responses, and reliability scores',
        'Approved participants are enrolled and the study is launched',
        'Participants complete milestones over the study duration while compliance is tracked',
        'On study completion, participants who meet the compliance threshold become eligible for payout',
        'Payouts are coordinated through BIOME\'s payout flow',
      ]} />


      <DocH2>Key concepts</DocH2>
      <Term term="Study" def="A research protocol published on BIOME with defined requirements, milestones, duration, and participant compensation." />
      <Term term="Participant" def="A user who creates a profile, applies to studies, completes milestones, and earns rewards for verified participation." />
      <Term term="Researcher / Experimenter" def="A user who creates and manages studies, screens applicants, verifies milestones, and coordinates payouts." />
      <Term term="Milestone" def="A required task or checkpoint within a study protocol. Milestones are organized by week and form the basis of compliance scoring." />
      <Term term="Compliance score" def="The percentage of verified milestones completed out of total milestones required. This determines payout eligibility." />
      <Term term="Reliability score" def="A participant's track record across all studies on BIOME, reflecting completion history and consistency." />
      <Term term="BIOME Verified" def="An optional badge indicating that BIOME's science team has reviewed the study methodology. It does not guarantee safety or outcomes." />
      <Term term="Participant ID" def="A permanent, anonymized identifier in the format P-XXXX-XXXX assigned to every participant at registration." />
      <Term term="Pseudonym" def="A permanent, randomly generated display name (e.g., SilentOrbit221) used in place of real names across the platform." />

      <DocNav
        next={{ label: 'Getting started as a participant', href: '/docs/participants' }}
      />
    </article>
  );
}
