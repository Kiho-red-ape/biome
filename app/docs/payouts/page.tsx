import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocUL, DocTable, DocNav,
} from '../docs-components';

export default function PayoutsPage() {
  return (
    <article>
      <DocLabel text="PAYOUTS & FEES" />
      <DocH1>Payouts and fees</DocH1>
      <DocLead>
        Payouts are tied to verified study completion. Fees are charged to researchers for platform
        services; a small processing fee applies to participant payouts.
      </DocLead>

      <DocH2>Payout eligibility</DocH2>
      <DocP>A participant becomes eligible for payout when:</DocP>
      <DocUL items={[
        'They are enrolled in a completed study',
        'Their compliance score meets or exceeds the study\'s threshold',
        'No protocol violations have been flagged',
      ]} />

      <DocH2>Payout methods</DocH2>
      <DocP>
        BIOME supports payout methods that may include bank transfer, supported digital payout methods,
        and, where available, cryptocurrency payouts. Method availability depends on recipient country,
        provider support, compliance review, and study configuration.
      </DocP>
      <DocP>
        Payout timing is not guaranteed. Processing time varies based on method, provider, banking
        systems, currency conversion, and compliance checks. If currency conversion is required, the
        payout provider may apply its own exchange rate, spread, and fees.
      </DocP>

      <DocH2>Fee structure</DocH2>
      <DocTable
        headers={['Fee', 'Amount', 'Charged to', 'Description']}
        rows={[
          ['Platform fee',        '2.5% of completed payouts',          'Researcher',    'Charged on successfully completed participant payouts'],
          ['Publish fee',         '$99 per study (first study free)',    'Researcher',    'One-time fee to publish a study to the marketplace'],
          ['BIOME Verified',      '$500–1,000 per study',                'Researcher',    'Optional protocol review by BIOME\'s science team'],
          ['Payout processing',   '0.5% of payout amount',              'Participant',   'Deducted from payout during processing'],
        ]}
      />
      <DocP>
        Third-party fees (banking, PayPal, blockchain network, currency conversion) may also apply
        and are outside BIOME&apos;s control.
      </DocP>

      <DocH2>Deposits</DocH2>
      <DocP>
        Some studies require a participant deposit (typically 1/5th of the reward). Deposits are
        returned on successful completion above the compliance threshold. Deposits may be forfeited if
        the participant withdraws after the first 7 days or fails to meet compliance requirements.
      </DocP>
      <DocP>
        Withdrawal within the first 7 days of study commencement returns the deposit in full.
      </DocP>

      <DocNav
        prev={{ label: 'Study lifecycle', href: '/docs/execution' }}
        next={{ label: 'Agreements & policies', href: '/docs/agreements' }}
      />
    </article>
  );
}
