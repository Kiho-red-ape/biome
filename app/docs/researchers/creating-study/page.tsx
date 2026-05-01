import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, DocNav,
} from '../../docs-components';

export default function CreatingStudyPage() {
  return (
    <article>
      <DocLabel text="RESEARCHERS" />
      <DocH1>Creating a study</DocH1>
      <DocLead>
        All studies begin in draft mode. While in draft, everything is editable. The study is not
        visible on the marketplace until you publish it.
      </DocLead>

      <DocH2>Draft mode</DocH2>
      <DocP>
        To create a study, navigate to &quot;Run a Study&quot; from the navigation bar. The study
        creation form includes the following sections:
      </DocP>

      <DocH3>Study basics</DocH3>
      <DocUL items={[
        'Title',
        'Category (Microbiome, Nutrition, Sleep, Wearables, Longevity, Quantified-self)',
        'Study type (Observational, Interventional, Survey-only, Self-experiment)',
        'Description',
        'Duration in weeks',
        'Region (or "Remote / Global")',
        'Task summary (one-line description of what participants do, max 80 characters)',
      ]} />

      <DocH3>Bounty</DocH3>
      <DocUL items={[
        'Reward per participant (USD)',
        'Number of participant slots',
        'Total bounty pool (auto-calculated)',
      ]} />

      <DocH3>Eligibility</DocH3>
      <DocUL items={[
        'Inclusion criteria',
        'Exclusion criteria',
        'Age range (minimum and maximum)',
        'Optional eligibility quiz (up to 10 yes/no screening questions)',
      ]} />

      <DocH3>Weekly milestones</DocH3>
      <DocP>
        Based on the study duration, the form generates week sections. For each week, you define
        milestones:
      </DocP>
      <DocUL items={[
        'Milestone title (e.g., "Complete baseline survey")',
        'Type: participant reports or you confirm',
        'Optional description',
      ]} />
      <DocP>
        You should define 3–8 milestones total depending on study length.
      </DocP>

      <DocH3>Dropout prevention (optional)</DocH3>
      <DocUL items={[
        'Toggle to require a participant deposit',
        'Deposit amount defaults to 1/5th of the reward, editable',
        'Participants are informed that deposits improve completion but may slow recruitment',
      ]} />

      <DocH3>Compliance threshold</DocH3>
      <DocUL items={[
        'Default: 80%',
        'Participants must verify this percentage of milestones to be eligible for payout',
      ]} />

      <DocH3>Approval status</DocH3>
      <DocUL items={[
        'Informational field: Ethics approved, IRB pending, Self-governed, or Not required',
      ]} />

      <DocH3>BIOME Verified (optional)</DocH3>
      <DocUL items={[
        'Checkbox to apply for the BIOME Verified badge',
        'Review by BIOME\'s science team at additional cost',
      ]} />

      <DocP>
        Draft studies are saved but not visible on the marketplace. You can return to edit them at
        any time from your experimenter dashboard.
      </DocP>


      <DocNav
        prev={{ label: 'Getting started as a researcher', href: '/docs/researchers' }}
        next={{ label: 'Publishing & recruitment', href: '/docs/researchers/publishing' }}
      />
    </article>
  );
}
