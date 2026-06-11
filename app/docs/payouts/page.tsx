import {
  DocLabel, DocH1, DocH2, DocP, DocLead,
  DocUL, DocNav,
} from '../docs-components';

export default function PayoutsPage() {
  return (
    <article>
      <DocLabel text="Payouts & fees" />
      <DocH1>Payouts and fees</DocH1>
      <DocLead>
        Compensation payouts are tied to verified study completion. Platform fees are charged to
        researchers; research partners receive their agreed compensation directly.
      </DocLead>

      <DocH2>Compensation eligibility</DocH2>
      <DocP>A research partner becomes eligible for compensation when:</DocP>
      <DocUL items={[
        'They are enrolled in a completed study',
        'Their compliance score meets or exceeds the study\'s stated threshold',
        'No protocol violations have been flagged against their record',
      ]} />

      <DocH2>Compensation methods</DocH2>
      <DocP>
        Biome supports compensation methods including bank transfer and supported digital payout
        methods. Method availability depends on recipient country, provider support, compliance
        review, and study configuration.
      </DocP>
      <DocP>
        Compensation timing varies based on method, provider, banking systems, and compliance checks.
        If currency conversion is required, the payout provider may apply its own exchange rate and
        processing fee.
      </DocP>

      <DocH2>Researcher fees</DocH2>
      <DocP>
        Researchers are charged a platform fee as part of the agreed operations plan. Fees are quoted
        transparently in advance — there are no hidden charges. The compensation budget is deposited
        upfront and held by Biome before the study goes live, guaranteeing funds exist before research
        partners begin the protocol.
      </DocP>

      <DocNav
        prev={{ label: 'Study lifecycle', href: '/docs/execution' }}
        next={{ label: 'Agreements & policies', href: '/docs/agreements' }}
      />
    </article>
  );
}
