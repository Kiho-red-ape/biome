import Link from 'next/link';

export default function PayoutPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Back link */}
        <Link href="/" style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '2px',
          color: '#4a7055', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← Back
        </Link>

        {/* Title */}
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
          textTransform: 'uppercase', color: '#f59e0b', marginBottom: 8,
        }}>
          // PAYOUT_POLICY
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700,
          color: '#eef4f0', marginBottom: 8,
        }}>
          Payout Policy
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', marginBottom: 40,
        }}>
          Last updated: March 24, 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <Section title="1. ELIGIBILITY REQUIREMENTS">
            <p>
              To receive a payout for completing a study on BIOME, participants must:
            </p>
            <ul>
              <li>Have a verified BIOME participant account with a completed profile</li>
              <li>Have been formally approved by the experimenter for the study</li>
              <li>Have completed all required tasks and submissions by the study end date</li>
              <li>Meet the compliance threshold specified by the experimenter (typically 80%+)</li>
              <li>Have a valid payout method on file (bank transfer, PayPal, or wallet address)</li>
            </ul>
            <p>
              Partial completion may result in a prorated payout at the experimenter&apos;s discretion.
              All eligibility decisions are subject to BIOME&apos;s dispute resolution process.
            </p>
          </Section>

          <Section title="2. PAYOUT TIMELINE">
            <p>
              Once a study is marked as completed and the experimenter confirms participant
              completion, BIOME processes payouts within <strong>14 business days</strong>.
            </p>
            <p>
              For crypto payouts (USDC, ETH, or other supported tokens), transfers are typically
              processed within 3 business days. For bank transfers and PayPal, allow up to 14
              business days depending on your country and banking institution.
            </p>
            <p>
              You will receive an in-platform notification when your payout is initiated. If you
              have not received your payout after 14 business days, please contact support.
            </p>
          </Section>

          <Section title="3. PAYOUT METHODS">
            <p>
              BIOME offers payout methods that may include bank transfer, supported digital payout
              methods, and, where available, crypto payouts. Payout method availability depends on
              recipient country, provider support, compliance review, and study configuration.
            </p>
            <p>
              Payout timing is not guaranteed and may vary based on payout method, provider
              processing, banking delays, compliance checks, and recipient account issues.
            </p>
            <p>
              If currency conversion is required, the payout provider may apply its own exchange
              rate, spread, and fees. BIOME does not guarantee mid-market exchange rates.
            </p>
          </Section>

          <Section title="4. PLATFORM FEE">
            <p>
              BIOME&apos;s platform fee is charged to experimenters under BIOME&apos;s experimenter
              pricing terms. BIOME does not currently deduct its platform fee directly from the
              participant reward listed on the study page.
            </p>
            <p>
              Third-party payout, conversion, banking, PayPal, or blockchain/network fees may still
              apply and may reduce the final amount received by the participant.
            </p>
            <p>
              A small participant payout processing fee applies: <strong>0.5% of the total payout
              amount</strong>.
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055', marginTop: 4 }}>
              Note: Payment structure is not the current implementation priority. All payout UI and
              policy text is written to accommodate upcoming payment integration work.
            </p>
          </Section>

          <Section title="5. DEPOSIT POLICY (EXPERIMENTERS)">
            <p>
              Experimenters must deposit the full bounty pool (total_bounty_pool) plus the 2.5%
              platform fee before their study can be listed as &quot;Recruiting&quot; on BIOME.
            </p>
            <p>
              Deposits are held in escrow by BIOME until study completion. Funds are not released
              to BIOME until after participants are confirmed as completed.
            </p>
            <p>
              If a study is cancelled by the experimenter before any participants complete, a full
              refund (minus a 1% administration fee) is issued within 14 business days.
            </p>
          </Section>

          <Section title="6. WITHDRAWAL POLICY">
            <p>
              Once a participant submits a payout request, there is a <strong>7-day review window</strong> during
              which the experimenter may flag a compliance issue.
            </p>
            <p>
              After the 7-day window, the payout is locked and processed. Withdrawal requests
              cannot be cancelled once processing has begun.
            </p>
            <p>
              Participants who withdraw from a study before completion forfeit their right to a
              payout. Partial completion payouts are at the experimenter&apos;s sole discretion.
            </p>
          </Section>

          <Section title="7. DISPUTE PROCESS">
            <p>
              If you believe your payout is incorrect or has been incorrectly withheld, you may
              open a dispute through the BIOME platform within <strong>30 days</strong> of the
              study end date.
            </p>
            <p>
              BIOME will review the dispute and make a binding determination within 14 business
              days. Both parties will be notified of the outcome. BIOME&apos;s decision is final in
              cases of compliance disputes.
            </p>
            <p>
              To open a dispute, go to your participant dashboard and select the relevant study,
              then click &quot;Report an issue.&quot;
            </p>
          </Section>

          <Section title="8. FRAUD PROTECTION">
            <p>
              BIOME uses device fingerprinting, duplicate detection, and behavioural analysis to
              detect fraudulent participation. Accounts found to be submitting false data,
              participating under multiple identities, or otherwise defrauding experimenters will
              be permanently banned and any pending payouts forfeited.
            </p>
            <p>
              BIOME reserves the right to withhold payout pending fraud investigation. If fraud
              is not confirmed, the payout is released within 5 business days of investigation
              completion.
            </p>
          </Section>

          <Section title="9. CONTACT">
            <p>
              For payout-related queries, contact BIOME at:
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f59e0b' }}>
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
        textTransform: 'uppercase', color: '#4a7055', marginBottom: 12,
      }}>
        // {title}
      </p>
      <div style={{
        fontFamily: 'var(--font-heading)', fontSize: 15, color: '#94a3b8',
        lineHeight: 1.75,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {children}
      </div>
    </div>
  );
}
