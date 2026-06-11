import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, DocOL, DocNav,
} from '../docs-components';

export default function ParticipantsPage() {
  return (
    <article>
      <DocLabel text="For research partners" />
      <DocH1>For research partners</DocH1>
      <DocLead>
        As a research partner, you take part in real research studies and receive compensation for
        verified participation. Create a profile, browse open studies, and apply to the ones that
        match your availability and interest.
      </DocLead>

      <DocH2>Creating your profile</DocH2>
      <DocP>
        To apply to studies on Biome, you first need to create a profile. Registration uses your
        email address.
      </DocP>
      <DocP>During registration, you will:</DocP>
      <DocOL items={[
        'Sign in with your email',
        'Choose a display name and region',
        'Accept the Biome Platform Terms of Service',
      ]} />
      <DocP>On completion, Biome assigns you two permanent identifiers:</DocP>
      <DocUL items={[
        'A Participant ID in the format P-XXXX-XXXX (e.g., P-8X4M-29Q7)',
        'A Pseudonym generated from a word pair plus a number (e.g., SilentOrbit221)',
      ]} />
      <DocP>
        These identifiers cannot be changed. They are used across the platform in place of your real
        name. Your identity remains pseudonymous to research teams and to other research partners —
        all messaging and screening happens under your pseudonym.
      </DocP>

      <DocH2>Completing your profile</DocH2>
      <DocP>
        Your profile is filled in progressively across four sections. Only the first section is
        required at registration. The remaining sections can be completed at any time, but Section 2
        (demographics) must be completed before you can apply to any study.
      </DocP>

      <DocH3>Section 1 — Account verification (at registration)</DocH3>
      <DocUL items={[
        'Email (verified)',
        'Phone number and verification',
        'Country',
      ]} />

      <DocH3>Section 2 — Demographics (required before first application)</DocH3>
      <DocUL items={[
        'Year of birth',
        'Sex assigned at birth',
        'Gender identity (optional)',
        'Ethnicity (optional)',
        'Nationality',
        'State or region',
        'Urbanicity (urban, suburban, rural)',
      ]} />
      <DocP>
        These fields are permanent. Once submitted, year of birth, sex assigned at birth, ethnicity,
        and nationality cannot be changed. You will see a warning before confirming.
      </DocP>

      <DocH3>Section 3 — Participation capability (optional)</DocH3>
      <DocUL items={[
        'Smartphone OS',
        'Wearable devices (Oura, Whoop, Apple Watch, Fitbit, Garmin, or none)',
        'Internet reliability',
        'Ability to receive sample kits by mail',
        'Sample comfort (stool, saliva, blood prick, urine, hair)',
        'Language fluency',
        'Weekly availability in hours',
      ]} />

      <DocH3>Section 4 — Research history (optional)</DocH3>
      <DocUL items={[
        'Previous study participation count',
        'Recent interventions (e.g., current supplements, recent antibiotics)',
        'Washout sensitivity',
      ]} />
      <DocP>
        Completing more sections improves your match quality for studies and increases your
        visibility to research teams during screening.
      </DocP>

      <DocH2>Your public profile</DocH2>
      <DocP>When other users see your profile, they see only:</DocP>
      <DocUL items={[
        'Your identicon (a geometric avatar generated from your Participant ID)',
        'Your pseudonym',
        'Your Participant ID',
        'Country and region',
        'Age range (displayed as a bracket like 25–30, not your exact year of birth)',
        'Participation stats: studies completed, completion rate, total compensation received, reputation badge',
      ]} />
      <DocP>
        Your real name, email, phone number, and detailed demographic data are never visible
        publicly. Research teams see additional screening data only for people who have applied to
        their specific study.
      </DocP>

      <DocNav
        prev={{ label: 'Platform overview', href: '/docs/overview' }}
        next={{ label: 'Applying to a study', href: '/docs/participants/applying' }}
      />
    </article>
  );
}
