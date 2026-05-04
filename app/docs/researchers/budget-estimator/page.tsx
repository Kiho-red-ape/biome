import Link from 'next/link';
import {
  DocLabel, DocH1, DocH2, DocH3, DocP, DocLead,
  DocUL, DocTable, Callout, DocNav,
} from '../../docs-components';

export default function BudgetEstimatorPage() {
  return (
    <article>
      <DocLabel text="RESEARCHERS / BUDGET ESTIMATOR" />
      <DocH1>Budget estimator</DocH1>
      <DocLead>
        BIOME&apos;s budget estimator produces a realistic line-item cost breakdown for your study
        before you commit. Estimates cover recruitment, sample logistics, lab analysis, participant
        compensation, and a fixed Biome operations fee.
      </DocLead>

      <Callout>
        Estimates are indicative only. They are not quotes or binding offers. Final scope and
        pricing are confirmed in a conversation with the BIOME team before engagement.
      </Callout>

      <DocH2>How to use the estimator</DocH2>
      <DocP>
        Go to{' '}
        <Link href="/estimate" style={{ color: 'var(--green)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          biome.to/estimate
        </Link>{' '}
        and fill in five inputs:
      </DocP>
      <DocUL items={[
        'Study type — determines recruitment difficulty tier',
        'Enrolled participant count — number of screened, consented participants you need',
        'Study duration — affects participant compensation',
        'Regions — each additional country beyond the first increases recruitment cost by 15%',
        'Sample and data collection — kits, return shipping, phlebotomy, and lab analysis are added per selection',
      ]} />
      <DocP>
        After submitting, enter your email to unlock the full breakdown. A copy is sent to your
        inbox. Results appear immediately in the browser — no waiting.
      </DocP>

      <DocH2>What&apos;s included in the estimate</DocH2>

      <DocH3>Recruitment</DocH3>
      <DocP>
        Recruitment cost is quoted per enrolled participant — not per lead. &quot;Enrolled&quot; means
        the participant has been screened, passed eligibility, and consented. This is the number that
        matters for your study.
      </DocP>
      <DocTable
        headers={['Difficulty tier', 'Study types', 'Rate range']}
        rows={[
          ['Common',    'Survey, behavioral, consumer product, cognitive',    '$120–$250 per enrolled participant'],
          ['Moderate',  'Observational, device, supplement, wearable',        '$220–$450 per enrolled participant'],
          ['Rare',      'Biomarker, condition-specific cohort',               '$400–$700 per enrolled participant'],
          ['Very rare', 'Rare disease, genetic subpopulations',               '$600–$1,200 per enrolled participant'],
        ]}
      />
      <DocP>
        Multi-region studies add 15% to recruitment cost per additional country beyond the first.
        A UK + US + India + EU study (4 regions) applies a 1.45× multiplier to the base rate.
      </DocP>

      <DocH3>Sample collection kits</DocH3>
      <DocTable
        headers={['Kit type', 'Cost per kit']}
        rows={[
          ['Saliva',              '$20'],
          ['Urine',               '$15'],
          ['Dried blood spot (DBS)', '$25'],
          ['Stool / microbiome',  '$30'],
          ['Combination kit',     '$55'],
        ]}
      />
      <DocP>
        Kit cost includes the collection device, packaging, and outbound shipping to the participant.
        Return shipping is quoted separately.
      </DocP>

      <DocH3>Return shipping</DocH3>
      <DocP>
        Samples returned from a single country: $15/participant (domestic).
        Cross-border return: $45/participant (international ambient).
        Multi-region studies always use the international rate.
      </DocP>

      <DocH3>Mobile phlebotomy</DocH3>
      <DocP>
        Only applies when &quot;Venous blood draw&quot; is selected. Dried blood spot (DBS) does not
        require phlebotomy — participants self-collect via finger prick.
      </DocP>
      <DocTable
        headers={['Region', 'Rate per participant']}
        rows={[
          ['India', '$20'],
          ['UK',    '$95'],
          ['EU',    '$100'],
          ['US',    '$120'],
        ]}
      />
      <DocP>
        The estimate uses the most expensive selected region&apos;s rate as a conservative proxy.
      </DocP>

      <DocH3>Lab analysis</DocH3>
      <DocTable
        headers={['Test', 'India', 'UK', 'US']}
        rows={[
          ['Microbiome 16S sequencing', '$65', '$120', '$130'],
          ['Blood panel',               '$40', '$120', '$150'],
          ['DBS panel',                 '$30', '$70',  '$80' ],
        ]}
      />
      <DocP>
        Lab rates vary by country. The estimator applies the lowest-cost lab geography available
        in your selected regions to give a conservative baseline. Final lab selection is confirmed
        during engagement.
      </DocP>

      <DocH3>Participant compensation</DocH3>
      <DocTable
        headers={['Burden tier', '2–4 wks', '4–8 wks', '8–12 wks', '12–24 wks', '24+ wks']}
        rows={[
          ['Survey / digital only', '$30', '$50', '$70',  '$100', '$150'],
          ['Light samples (saliva, urine, wearable)', '$50', '$75', '$100', '$150', '$200'],
          ['Heavy samples (stool, blood draw, DBS)',  '$80', '$120','$160', '$220', '$300'],
        ]}
      />
      <DocP>
        These are suggested minimums. You may offer higher compensation. Higher compensation
        typically improves recruitment speed and completion rates.
      </DocP>

      <DocH2>Coordination margin</DocH2>
      <DocP>
        All pass-through costs (recruitment, kits, shipping, lab, compensation) are totalled and
        a 50% coordination margin is applied. This covers partner management, procurement, logistics
        coordination, currency conversion, and buffer for rate variance.
      </DocP>
      <DocP>
        The coordination-adjusted pass-through subtotal is shown as its own line in the estimate.
        Nothing is hidden.
      </DocP>

      <DocH2>Biome operations fee</DocH2>
      <DocP>
        A fixed operations fee covers platform access, compliance tracking, participant screening,
        data delivery, and project management.
      </DocP>
      <DocP>
        The standard fee is <strong style={{ color: 'var(--text-bright)' }}>$8,000–$10,000</strong> per
        study. This is negotiable for high-volume or multi-study engagements. The estimator
        applies the appropriate fee automatically.
      </DocP>
      <DocP>
        The operations fee is entirely separate from pass-through costs. Every dollar of pass-through
        cost is fully disclosed. BIOME does not mark up pass-throughs — the coordination margin
        covers logistics only.
      </DocP>

      <DocH2>IRB and ethics review</DocH2>
      <DocP>
        IRB / ethics review is the researcher&apos;s responsibility. BIOME does not provide IRB
        services and does not include any IRB cost in estimates. If you are unsure about requirements
        in your jurisdiction, the estimator will flag a warning and we can connect you with
        independent IRB partners on request.
      </DocP>

      <DocH2>Minimum study total</DocH2>
      <DocP>
        BIOME does not run studies with an all-in budget below $15,000. This threshold reflects
        the minimum viable coordination overhead for any multi-participant study, regardless of
        simplicity. Estimates will not go below this floor.
      </DocP>

      <DocH2>Example outputs</DocH2>
      <DocH3>Simple study: 30 participants, survey only, India, 4 weeks</DocH3>
      <DocUL items={[
        'Recruitment: 30 × $180 = $5,400',
        'Compensation (survey, 2–4 wks): 30 × $30 = $900',
        'Pass-through subtotal × 1.5: ~$9,450',
        'Operations fee: $8,000',
        'Total: ~$17,450',
      ]} />

      <DocH3>Complex study: 50 participants, cognitive/behavioral, DBS, UK/US/India/EU, 2–4 weeks</DocH3>
      <DocUL items={[
        'Recruitment: 50 × $180 × 1.45 (4 regions) = ~$13,050',
        'DBS kits: 50 × $25 = $1,250',
        'Return shipping (international): 50 × $45 = $2,250',
        'DBS lab analysis (US rates): 50 × $80 = $4,000',
        'Compensation (heavy samples, 2–4 wks): 50 × $80 = $4,000',
        'Pass-through subtotal × 1.5: ~$36,825',
        'Operations fee: $10,000',
        'Total: ~$46,825',
      ]} />

      <Callout>
        A single-country 5-person pilot study costs less than the minimum. If you are exploring
        feasibility, speak to the team — we can advise on a scoped pilot structure.
      </Callout>

      <DocNav
        prev={{ label: 'Compliance & verification',  href: '/docs/researchers/compliance' }}
        next={{ label: 'Payouts & fees',             href: '/docs/payouts'               }}
      />
    </article>
  );
}
