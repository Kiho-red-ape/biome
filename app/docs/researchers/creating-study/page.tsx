import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, Callout, DocNav,
} from '../../docs-components';

export default function CreatingStudyPage() {
  return (
    <article>
      <DocLabel text="Researchers" />
      <DocH1>Setting up your study</DocH1>
      <DocLead>
        Once your operations plan is agreed, study setup happens in two parts: the document vault,
        and the study configuration. Everything stays in draft — and fully editable — until launch.
      </DocLead>

      <DocH2>Document vault setup</DocH2>
      <DocP>
        Every study on Biome has a document vault: a secure store for the study&apos;s governing
        documents with clearance-based access. Before your study can launch, the vault must contain:
      </DocP>
      <DocUL items={[
        'Your IRB or ethics approval — uploaded by you; Biome verifies it is on file before launch',
        'Your study protocol',
        'The Biome service agreement and data processing agreement — e-signed directly in the vault',
        'Consent forms — uploaded and version-managed by you; research partners e-sign them during application',
      ]} />
      <Callout>
        Biome does not provide or obtain IRB or ethics approval, and listing a study on Biome does
        not constitute ethical review. The approval you upload comes from your institution or an
        independent board. Biome&apos;s role is to store it securely and confirm it is on file.
      </Callout>
      <DocP>
        Vault access is clearance-based: you control which team members can view or manage each
        document. Signed consent records are retained with the study and included in the final
        compliance export.
      </DocP>

      <DocH2>Study configuration</DocH2>
      <DocP>
        With the vault in place, configure the study itself. The setup form includes the following
        sections:
      </DocP>

      <DocH3>Study basics</DocH3>
      <DocUL items={[
        'Title',
        'Category (Microbiome, Nutrition, Sleep, Wearables, Longevity, Quantified-self)',
        'Study type (Observational, Interventional, Survey-only, Self-experiment)',
        'Description',
        'Duration in weeks',
        'Region (or "Remote / Global")',
        'Task summary (one-line description of what research partners do, max 80 characters)',
      ]} />

      <DocH3>Compensation schedule</DocH3>
      <DocUL items={[
        'Compensation per research partner, paid on completion or staged across milestones',
        'Number of cohort slots',
        'Total compensation budget (auto-calculated) — deposited upfront and held by Biome before launch',
      ]} />

      <DocH3>Screening criteria</DocH3>
      <DocUL items={[
        'Inclusion criteria',
        'Exclusion criteria',
        'Age range (minimum and maximum)',
        'Optional screening questionnaire (up to 10 yes/no questions)',
      ]} />

      <DocH3>Weekly milestones</DocH3>
      <DocP>
        Based on the study duration, the form generates week sections. For each week, you define
        milestones:
      </DocP>
      <DocUL items={[
        'Milestone title (e.g., "Complete baseline survey")',
        'Type: research partner self-reports, or your team confirms',
        'Optional description',
        'Linked sample kit, if the milestone involves a sample (kit dispatch and return are tracked automatically)',
      ]} />
      <DocP>
        You should define 3–8 milestones total depending on study length.
      </DocP>

      <DocH3>Compliance threshold</DocH3>
      <DocUL items={[
        'The share of milestones a research partner must have verified to be eligible for compensation',
        'Set during study setup, shown to applicants before they apply',
      ]} />

      <DocP>
        Draft studies are saved but not visible to research partners. You can return to edit them at
        any time from your researcher dashboard.
      </DocP>

      <DocNav
        prev={{ label: 'For researchers', href: '/docs/researchers' }}
        next={{ label: 'Launch & recruitment', href: '/docs/researchers/publishing' }}
      />
    </article>
  );
}
