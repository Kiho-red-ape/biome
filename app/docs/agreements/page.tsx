import Link from 'next/link';
import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocTable, DocUL, DocNav,
} from '../docs-components';

export default function AgreementsPage() {
  return (
    <article>
      <DocLabel text="Agreements" />
      <DocH1>Agreements and policies</DocH1>
      <DocLead>
        Biome uses three agreements and two policy documents to establish the legal framework between
        the platform, research partners, and researchers.
      </DocLead>

      <DocH2>When agreements are required</DocH2>
      <DocTable
        headers={['Document', 'When shown', 'Acceptance required']}
        rows={[
          ['Platform Terms of Service',       'During account registration',     'Yes — scroll-to-accept with checkbox'],
          ['Research Partner Study Agreement', 'When applying to a specific study', 'Yes — scroll-to-accept with checkbox'],
          ['Researcher Study Agreement',       'When launching a study',          'Yes — scroll-to-accept with checkbox'],
        ]}
      />
      <DocP>
        When an agreement appears during a workflow (application, publishing, onboarding), it opens
        in a modal overlay. Your form state is preserved. You will not be navigated away from the
        page. The agreement text must be scrolled to the bottom before the acceptance checkbox becomes
        active.
      </DocP>

      <DocH2>Read-only reference</DocH2>
      <DocP>
        All agreements and policies are also available as read-only reference documents from the footer:
      </DocP>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Terms of Service',        href: '/legal/tos' },
          { label: 'Privacy Policy',          href: '/privacy' },
          { label: 'Participant Agreement',   href: '/legal/participant-agreement/view' },
          { label: 'Experimenter Agreement',  href: '/legal/experimenter-agreement/view' },
          { label: 'Payout Policy',           href: '/payout-policy' },
        ].map((link) => (
          <Link key={link.href} href={link.href} style={{
            fontFamily: 'var(--font-body)', fontSize: 14,
            color: 'var(--teal-dark)', textDecoration: 'none',
          }}>
            {link.label} →
          </Link>
        ))}
      </div>
      <DocP>
        Footer links open the full document text on a dedicated page. These pages do not include
        acceptance checkboxes — they are for reference only.
      </DocP>

      <DocH2>Dispute resolution</DocH2>
      <DocP>
        If you believe a decision was made unfairly — such as a milestone rejection, violation flag,
        or payout denial — you may raise a dispute within 7 days of the event.
      </DocP>
      <DocP>
        The first 3 disputes per account are free. Subsequent disputes incur a $10 dispute fee.
      </DocP>
      <DocP>
        To raise a dispute, use the &quot;Report an Issue&quot; link in the footer or the dispute
        button in your dashboard. You will need to provide:
      </DocP>
      <DocUL items={[
        'Study ID',
        'Description of the issue',
        'Any supporting evidence (file upload, max 5MB)',
      ]} />
      <DocP>
        Biome reviews disputes and responds within 72 hours. Both parties can communicate through
        the dispute thread. Resolutions are final unless escalated.
      </DocP>
      <DocP>
        For the full dispute resolution process, see the{' '}
        <Link href="/legal/tos" style={{ color: 'var(--teal-dark)' }}>
          Platform Terms of Service
        </Link>.
      </DocP>

      <DocNav
        prev={{ label: 'Payouts & fees', href: '/docs/payouts' }}
      />
    </article>
  );
}
