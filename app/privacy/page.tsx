import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Back link */}
        <Link href="/" style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '2px',
          color: 'var(--teal-dark)', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← Back
        </Link>

        {/* Title */}
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
          textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
        }}>
          Privacy Policy
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
          color: 'var(--ink)', marginBottom: 8,
        }}>
          Privacy Policy
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 40,
        }}>
          Last updated: March 24, 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <Section title="1. DATA COLLECTION">
            <p>
              Biome collects the following information when you use the platform:
            </p>
            <ul>
              <li>Email address or wallet address (used for account creation and authentication)</li>
              <li>Display name, bio, and region (optional profile fields)</li>
              <li>Study participation history (studies applied for, approved, completed)</li>
              <li>Payout information (bank details, PayPal, or wallet address for compensation disbursement)</li>
              <li>Device and browser metadata for security and fraud prevention</li>
              <li>Communications within the platform (comments, Q&amp;A threads)</li>
            </ul>
            <p>
              For research partners who complete the full verification process, we may also collect:
              year of birth, country of residence, and health-relevant eligibility answers. These
              are stored with strict access controls and are never sold to third parties.
            </p>
          </Section>

          <Section title="2. DATA STORAGE">
            <p>
              All data is stored on Supabase (hosted on AWS infrastructure). Your data is encrypted
              at rest and in transit. Biome uses row-level security policies to ensure you can only
              access your own data — researchers cannot see research partner personal details beyond
              what is needed for study coordination.
            </p>
            <p>
              Authentication is handled by Privy. Biome does not store your private keys if you
              log in with a wallet. Privy&apos;s privacy policy governs authentication data.
            </p>
          </Section>

          <Section title="3. DATA SHARING">
            <p>Biome does not sell your personal data. We may share limited information in the following circumstances:</p>
            <ul>
              <li>With the researcher running a study you have applied to — only your pseudonym, region, and eligibility status are shared, never your email or full name unless you explicitly consent</li>
              <li>With payment processors (bank transfer intermediaries, PayPal, or on-chain networks) to fulfil compensation obligations</li>
              <li>With law enforcement or regulatory bodies if required by law</li>
              <li>With third-party service providers (hosting, analytics) bound by data processing agreements</li>
            </ul>
          </Section>

          <Section title="4. DATA RETENTION">
            <p>
              We retain your account data for as long as your account is active. If you request
              account deletion, your personal data is anonymised or deleted within 30 days, except
              where retention is required by law (e.g., financial records must be kept for 7 years
              under applicable regulations).
            </p>
            <p>
              Participation records (pseudonymised) may be retained for research integrity purposes
              even after account deletion. These records cannot be linked back to you.
            </p>
          </Section>

          <Section title="5. YOUR RIGHTS">
            <p>
              As a user of Biome, you have the following rights with respect to your personal data:
            </p>
            <ul>
              <li><strong>Access</strong> — request a copy of all personal data we hold about you</li>
              <li><strong>Correction</strong> — request correction of inaccurate data</li>
              <li><strong>Deletion</strong> — request deletion of your account and personal data</li>
              <li><strong>Portability</strong> — request your data in a machine-readable format</li>
              <li><strong>Objection</strong> — object to processing of your data for certain purposes</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at privacy@biome.to. We will respond within 30 days.
            </p>
          </Section>

          <Section title="6. COOKIES">
            <p>
              Biome uses essential cookies for session management and authentication. We do not use
              tracking cookies or third-party advertising cookies. You can disable cookies in your
              browser settings, but this may prevent you from logging in.
            </p>
          </Section>

          <Section title="7. THIRD-PARTY SERVICES">
            <p>Biome integrates with the following third-party services:</p>
            <ul>
              <li><strong>Supabase</strong> — database and authentication infrastructure</li>
              <li><strong>Privy</strong> — wallet and email authentication</li>
              <li><strong>Netlify</strong> — hosting and deployment</li>
            </ul>
            <p>
              Each of these services has its own privacy policy. We encourage you to review them.
              Biome is not responsible for the data practices of third-party services.
            </p>
          </Section>

          <Section title="8. GOVERNING LAW">
            <p>
              This Privacy Policy is governed by the laws of India. Any disputes arising from this
              policy will be resolved under the jurisdiction of the courts of India. If you are
              based in the European Union, you also have rights under the General Data Protection
              Regulation (GDPR) and may lodge a complaint with your local data protection authority.
            </p>
          </Section>

          <Section title="9. CONTACT">
            <p>
              For any privacy-related questions or requests, contact Biome at:
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal-dark)' }}>
              privacy@biome.to
            </p>
          </Section>

        </div>

      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px',
        textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12,
      }}>
        {title}
      </p>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)',
        lineHeight: 1.75,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {children}
      </div>
    </div>
  );
}
