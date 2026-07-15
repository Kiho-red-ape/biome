import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocOL, DocTable, Callout, DocNav,
} from '../../docs-components';

export default function ApplyingPage() {
  return (
    <article>
      <DocLabel text="Research partners" />
      <DocH1>Applying to a study</DocH1>
      <DocLead>
        Browse open studies, review the requirements, and submit your application. The research
        team reviews applications and makes the final selection.
      </DocLead>

      <DocH2>Browsing studies</DocH2>
      <DocP>
        The Biome homepage displays open studies organized by status: recruiting, active, and
        completed. Each study card shows the category, title, the research organization, the
        compensation amount, enrollment progress, and duration.
      </DocP>
      <DocP>
        You can browse all studies on the Explore page, which includes sorting, filtering by
        category and status, and search.
      </DocP>

      <DocH2>The application flow</DocH2>
      <DocP>When you click &quot;Apply to this study&quot; on a study page:</DocP>
      <DocOL items={[
        'If you are not signed in, you will be prompted to sign in',
        'If your profile is incomplete (Section 2 not filled), you will be prompted to complete your demographics',
        'If the study includes a screening questionnaire, you will answer the questions (up to 10 yes/no questions)',
        'You will see a summary of the study: title, compact study details, milestones preview, sample-kit requirements, and the compliance threshold',
        'You will be asked to read and e-sign the study’s consent form, which the research team manages in the study’s document vault (displayed in an overlay — you will not leave the page)',
        'On submission, your application is sent to the research team for review',
      ]} />
      <Callout>
        Application received. You will be notified when the research team reviews your application.
        You can track your application status in your dashboard.
      </Callout>

      <DocH2>Screening questionnaire</DocH2>
      <DocP>
        Some studies include a screening questionnaire configured by the research team. It typically
        contains up to 10 yes/no questions designed to help the team evaluate whether you match the
        study&apos;s screening criteria.
      </DocP>
      <DocP>
        The questionnaire is a screening signal. It does not automatically approve or reject you.
        The research team reviews your responses alongside your profile data and makes the final
        decision.
      </DocP>
      <DocP>
        Your eligibility status (eligible or not eligible) is displayed to the research team in
        their screening dashboard.
      </DocP>

      <DocH2>What happens after applying</DocH2>
      <DocP>Your application moves through these states:</DocP>
      <DocTable
        headers={['Status', 'Meaning']}
        rows={[
          ['Under review',  'Your application has been submitted and is awaiting review by the research team'],
          ['Accepted',      'The research team has approved your participation'],
          ['Waitlisted',    'You are on the waitlist — you may be accepted if a spot opens'],
          ['Not selected',  'The research team did not select your application for this study'],
          ['Enrolled',      'You have completed any required onboarding and are enrolled in the study'],
          ['Active',        'The study has commenced and you are completing milestones'],
          ['Completed',     'You have finished all study requirements'],
        ]}
      />
      <DocP>You will receive a notification when your status changes.</DocP>

      <DocNav
        prev={{ label: 'For research partners', href: '/docs/participants' }}
        next={{ label: 'Your dashboard', href: '/docs/participants/dashboard' }}
      />
    </article>
  );
}
