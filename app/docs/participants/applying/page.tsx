import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocOL, DocTable, Callout, DocNav,
} from '../../docs-components';

export default function ApplyingPage() {
  return (
    <article>
      <DocLabel text="PARTICIPANTS" />
      <DocH1>Applying to a study</DocH1>
      <DocLead>
        Browse open studies, review the requirements, and submit your application. The researcher
        reviews applications and makes the final selection.
      </DocLead>

      <DocH2>Browsing studies</DocH2>
      <DocP>
        The BIOME homepage displays open studies organized by status: recruiting, active, and
        completed. Each study card shows the category, title, sponsoring organization, reward amount,
        enrollment progress, and duration.
      </DocP>
      <DocP>
        You can browse all studies at the Explore page, which includes sorting, filtering by category
        and status, and search.
      </DocP>


      <DocH2>The application flow</DocH2>
      <DocP>When you click &quot;Apply to this study&quot; on a study page:</DocP>
      <DocOL items={[
        'If you are not signed in, you will be prompted to sign in through Privy',
        'If your profile is incomplete (Section 2 not filled), you will be prompted to complete your demographics',
        'If the study includes an eligibility quiz, you will answer the screening questions (up to 10 yes/no questions)',
        'You will see a summary of the study including the title, compact study details, milestones preview, and compliance threshold',
        'You will be asked to read and accept the Participant Study Agreement (displayed in a modal overlay — you will not leave the page)',
        'On submission, your application is sent to the researcher for review',
      ]} />
      <Callout>
        Application received. You will be notified when the researcher reviews your application.
        You can track your application status in your dashboard.
      </Callout>

      <DocH2>Eligibility quiz</DocH2>
      <DocP>
        Some studies include an optional eligibility quiz configured by the researcher. This quiz
        typically contains up to 10 yes/no questions designed to help the researcher evaluate whether
        you match the study requirements.
      </DocP>
      <DocP>
        The quiz is a screening signal. It does not automatically approve or reject you. The researcher
        reviews your quiz responses alongside your profile data and makes the final decision.
      </DocP>
      <DocP>
        Your eligibility status (eligible or not eligible) is displayed to the researcher in their
        screening dashboard.
      </DocP>

      <DocH2>What happens after applying</DocH2>
      <DocP>Your application moves through these states:</DocP>
      <DocTable
        headers={['Status', 'Meaning']}
        rows={[
          ['Under review',  'Your application has been submitted and is awaiting researcher review'],
          ['Accepted',      'The researcher has approved your participation'],
          ['Waitlisted',    'You are on the waitlist — you may be accepted if a spot opens'],
          ['Not selected',  'The researcher did not select your application for this study'],
          ['Enrolled',      'You have completed any required onboarding and are enrolled in the study'],
          ['Active',        'The study has commenced and you are completing milestones'],
          ['Completed',     'You have finished all study requirements'],
        ]}
      />
      <DocP>You will receive a notification when your status changes.</DocP>


      <DocNav
        prev={{ label: 'Getting started as a participant', href: '/docs/participants' }}
        next={{ label: 'Your dashboard', href: '/docs/participants/dashboard' }}
      />
    </article>
  );
}
