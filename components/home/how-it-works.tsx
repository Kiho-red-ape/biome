'use client';

import { StepsCarousel, type CarouselStep } from '@/components/ui/steps-carousel';

const STEPS: CarouselStep[] = [
  {
    num: '01', label: 'RECRUIT', scene: 'recruit',
    headline: 'The right people,\nnot just any people.',
    desc: [
      'Targeted recruitment built per study.',
      'Eligibility screening against your exact criteria.',
      'Verified enrolment with consent capture.',
    ],
  },
  {
    num: '02', label: 'COLLECT', scene: 'collect',
    headline: 'Samples shipped.\nTracked. Logged.',
    desc: [
      'Kits dispatched to participants globally.',
      'Stool, saliva, blood spot, urine, wearable data.',
      'Partner phlebotomy for blood draws.',
    ],
  },
  {
    num: '03', label: 'TRACK', scene: 'track',
    headline: 'Compliance monitored.\nDropouts flagged.',
    desc: [
      'Milestone-based protocol adherence tracking.',
      'Automated reminders and real-time dropout alerts.',
      'Weekly sponsor reports with compliance rates.',
    ],
  },
  {
    num: '04', label: 'PAY', scene: 'pay',
    headline: 'Compliant payouts.\nFull audit trail.',
    desc: [
      'Compliance-gated participant payouts.',
      'Payments gate on milestone completion.',
      'Full line-item transparency on all costs.',
    ],
  },
  {
    num: '05', label: 'DELIVER', scene: 'deliver',
    headline: 'Clean data out.\nAudit bundle included.',
    desc: [
      'Structured export with chain-of-custody log.',
      'Consent records, comms log, payout summary.',
      'Compliance bundle ready for sponsor archive.',
    ],
  },
];

export function HowItWorks() {
  return <StepsCarousel steps={STEPS} sectionLabel="HOW_IT_WORKS" />;
}
