import Link from 'next/link';

export default function PayoutPolicyPage() {
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
          Compensation Policy
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
          color: 'var(--ink)', marginBottom: 8,
        }}>
          Compensation Policy
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 40,
        }}>
          Last updated: March 24, 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <Section title="1. ELIGIBILITY REQUIREMENTS">
            <p>
              To receive compensation for completing a study on Biome, research partners must:
            </p>
            <ul>
              <li>Have a verified Biome research partner account with a completed profile</li>
              <li>Have been formally approved by the researcher for the study</li>
              <li>Have completed all required tasks and submissions by the study end date</li>
              <li>Meet the compliance threshold specified by the researcher (typically 80%+)</li>
              <li>Have a valid payout method on file (bank transfer, PayPal, or wallet address)</li>
            </ul>
            <p>
              Partial completion may result in prorated compensation at the researcher&apos;s discretion.
              All eligibility decisions are subject to Biome&apos;s dispute resolution process.
            </p>
          </Section>

          <Section title="2. COMPENSATION TIMELINE">
            <p>
              Once a study is marked as completed and the researcher confirms research partner
              completion, Biome processes compensation within <strong>14 business days</strong>.
            </p>
            <p>
              For crypto payouts (USDC, ETH, or other supported tokens), transfers are typically
              processed within 3 business days. For bank transfers and PayPal, allow up to 14
              business days depending on your country and banking institution.
            </p>
            <p>
              You will receive an in-platform notification when your compensation is initiated. If you
              have not received your compensation after 14 business days, please contact support.
            </p>
          </Section>

          <Section title="3. PAYOUT METHODS">
            <p>
              Biome offers payout methods that may include bank transfer, supported digital payout
              methods, and, where available, crypto payouts. Payout method availability depends on
              recipient country, provider support, compliance review, and study configuration.
            </p>
            <p>
              Payout timing is not guaranteed and may vary based on payout method, provider
              processing, banking delays, compliance checks, and recipient account issues.
            </p>
            <p>
              If currency conversion is required, the payout provider may apply its own exchange
              rate, spread, and fees. Biome does not guarantee mid-market exchange rates.
            </p>
          </Section>

          <Section title="4. PLATFORM FEE">
            <p>
              Biome&apos;s platform fee is charged to researchers under Biome&apos;s researcher
              pricing terms. Biome does not currently deduct its platform fee directly from the
              research partner reward listed on the study page.
            </p>
            <p>
              Third-party payout, conversion, banking, PayPal, or blockchain/network fees may still
              apply and may reduce the final amount received by the research partner.
            </p>
            <p>
              A small research partner payout processing fee applies: <strong>0.5% of the total payout
              amount</strong>.
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              Note: Payment structure is not the current implementation priority. All payout UI and
              policy text is written to accommodate upcoming payment integration work.
            </p>
          </Section>

          <Section title="5. DEPOSIT POLICY (RESEARCHERS)">
            <p>
              Researchers must deposit the full compensation pool (total_bounty_pool) plus the 2.5%
              platform fee before their study can be listed as &quot;Recruiting&quot; on Biome.
            </p>
            <p>
              Deposits are held in escrow by Biome until study completion. Funds are not released
              to Biome until after research partners are confirmed as completed.
            </p>
            <p>
              If a study is cancelled by the researcher before any research partners complete, a full
              refund (minus a 1% administration fee) is issued within 14 business days.
            </p>
          </Section>

          <Section title="6. WITHDRAWAL POLICY">
            <p>
              Once a research partner submits a compensation request, there is a <strong>7-day review window</strong> during
              which the researcher may flag a compliance issue.
            </p>
            <p>
              After the 7-day window, the compensation is locked and processed. Withdrawal requests
              cannot be cancelled once processing has begun.
            </p>
            <p>
              Research partners who withdraw from a study before completion forfeit their right to
              compensation. Partial completion payouts are at the researcher&apos;s sole discretion.
            </p>
          </Section>

          <Section title="7. DISPUTE PROCESS">
            <p>
              If you believe your compensation is incorrect or has been incorrectly withheld, you may
              open a dispute through the Biome platform within <strong>30 days</strong> of the
              study end date.
            </p>
            <p>
              Biome will review the dispute and make a binding determination within 14 business
              days. Both parties will be notified of the outcome. Biome&apos;s decision is final in
              cases of compliance disputes.
            </p>
            <p>
              To open a dispute, go to your research partner dashboard and select the relevant study,
              then click &quot;Report an issue.&quot;
            </p>
          </Section>

          <Section title="8. FRAUD PROTECTION">
            <p>
              Biome uses device fingerprinting, duplicate detection, and behavioural analysis to
              detect fraudulent participation. Accounts found to be submitting false data,
              participating under multiple identities, or otherwise defrauding researchers will
              be permanently banned and any pending compensation forfeited.
            </p>
            <p>
              Biome reserves the right to withhold compensation pending fraud investigation. If fraud
              is not confirmed, the compensation is released within 5 business days of investigation
              completion.
            </p>
          </Section>

          <Section title="9. CONTACT">
            <p>
              For compensation-related queries, contact Biome at:
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal-dark)' }}>
              payouts@biome.to
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
