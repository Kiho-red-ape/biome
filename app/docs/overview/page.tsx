import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocUL, DocOL, Term, DocNav, Callout,
} from '../docs-components';

export default function OverviewPage() {
  return (
    <article>
      <DocLabel text="Overview" />
      <DocH1>Platform overview</DocH1>
      <DocLead>
        Biome is a self-serve clinical operations platform for research teams. You bring a ready
        study — Biome runs the operational layer: recruitment, screening, sample-kit logistics,
        milestone and compliance tracking, a document vault, and compensation payouts. Everything
        you need to run your study independently, on your terms.
      </DocLead>
      <DocP>
        Research teams get a single place to manage the full operational lifecycle of a human
        research study, with a complete audit trail from first applicant to final report.
      </DocP>

      <DocH2>What Biome is</DocH2>
      <DocP>
        Biome is operations infrastructure. It moves a study from &quot;we need a screened
        cohort&quot; to &quot;our cohort has completed the protocol, every sample is accounted for,
        and every payout is documented.&quot;
      </DocP>
      <DocP>Specifically, Biome provides:</DocP>
      <DocUL items={[
        'Recruitment and screening: applicant sourcing, eligibility screening, and cohort selection tools',
        'A document vault: IRB/ethics approval, study protocol, agreements, and consent forms stored with clearance-based access, with contracts e-signed in place',
        'Sample-kit logistics: kit dispatch, returns, and chain-of-custody tracking for every sample',
        'Milestone and compliance tracking: a per-person checklist of protocol checkpoints with verification and dropout-risk alerts',
        'Compensation infrastructure: budgets deposited upfront and held, payouts released against verified completion, with a full audit trail',
        'Compliance export: a complete record bundle and final report at study close',
      ]} />

      <DocH2>What Biome is not</DocH2>
      <DocP>
        Biome is not a sponsor, a medical provider, or an ethics board. Researchers remain fully
        responsible for the design, conduct, safety, and regulatory compliance of their studies.
        Biome provides operational infrastructure — not clinical oversight.
      </DocP>
      <Callout>
        Biome does not provide or obtain IRB or ethics approval. You bring your own approval from
        your institution or an independent board. Biome stores it in your study&apos;s document
        vault and verifies it is on file before your study can launch.
      </Callout>
      <DocP>
        Biome also does not design studies, provide medical advice, or guarantee study outcomes.
      </DocP>

      <DocH2>How a study runs on Biome</DocH2>
      <DocP>The researcher flow follows a defined sequence:</DocP>
      <DocOL items={[
        'Request an estimate — submit an intake describing your study scope (cohort size, sample types, duration, geographies)',
        'Scoping call and operations plan — review a transparent, line-item quote and agree the ops plan before committing',
        'Document vault setup — upload your IRB/ethics approval, study protocol, and agreements; e-sign the service contract; consent forms are managed with clearance-based access',
        'Study setup — define milestones, screening criteria, and the compensation schedule',
        'Recruitment and screening — applicants apply, are screened against your criteria, and you select your cohort',
        'Live operations — kit logistics with chain-of-custody, milestone tracking, pseudonymised messaging with research partners, and dropout-risk alerts',
        'Compensation payouts — released against verified completion, with a full audit trail',
        'Compliance export and final report — a complete record bundle at study close',
      ]} />

      <DocH2>Key concepts</DocH2>
      <Term term="Study" def="A research protocol run on Biome with defined milestones, screening criteria, duration, and a compensation schedule." />
      <Term term="Research partner" def="A person who applies to studies, completes milestones, and receives compensation for verified participation." />
      <Term term="Researcher" def="A member of a research team who sets up and manages studies, screens applicants, verifies milestones, and oversees payouts." />
      <Term term="Document vault" def="The secure store for each study's IRB/ethics approval, protocol, agreements, and consent forms, with clearance-based access and in-place e-signing." />
      <Term term="Milestone" def="A required task or checkpoint within a study protocol. Milestones are organized by week and form the basis of compliance scoring." />
      <Term term="Compliance score" def="The share of verified milestones completed out of total milestones required. This determines compensation eligibility." />
      <Term term="Chain of custody" def="The tracked record of every sample kit from dispatch, through collection and transit, to lab receipt." />
      <Term term="Operations fee" def="Biome's fee for running your study, quoted per study as part of a transparent line-item estimate." />
      <Term term="Participant ID" def="A permanent, anonymized identifier in the format P-XXXX-XXXX assigned to every research partner at registration." />
      <Term term="Pseudonym" def="A permanent, randomly generated display name (e.g., SilentOrbit221) used in place of real names across the platform." />

      <DocNav
        next={{ label: 'For research partners', href: '/docs/participants' }}
      />
    </article>
  );
}
