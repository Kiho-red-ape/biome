import type { ApplicantRow, PP, HistRow } from '@/components/screening/screening-dashboard';

// ─── Eligibility quiz ───────────────────────────────────────────────────────

export type QuizQuestion = {
  id: string;
  text: string;
  expected_answer: boolean; // true = yes, false = no
  weight: number;           // 0–1 signal weight for screener
  disqualifier: boolean;    // if true, wrong answer = not_eligible
};

// ─── BIOME Org ─────────────────────────────────────────────────────────────

export const BIOME_ORG = {
  id:                   'biome-org-demo',
  org_name:             'BIOME Research',
  org_description:      'BIOME\'s own internal research programme — validating platform mechanics, participant experience, and screening infrastructure. All experiments here are live demonstrations of the full end-to-end BIOME flow.',
  expertise_areas:      ['Sleep Science', 'Nutrition', 'Longevity', 'Behavioral Research'],
  verified_experiments: 2,
  experiments_posted:   3,
  screening_status:     'approved',
};

// ─── Experiment type ────────────────────────────────────────────────────────

export type DemoExperiment = {
  id: string;
  title: string;
  short_description: string;
  category: string;
  status: string;
  bounty_per_participant: number;
  total_bounty_pool: number;
  slots_total: number;
  slots_filled: number;
  duration_weeks: number;
  region: string;
  is_remote: boolean;
  is_verified: boolean;
  verification_level: string;
  inclusion_criteria: string;
  exclusion_criteria: string;
  created_at: string;
  // Optional fields for richer display
  application_deadline?: string;       // ISO date string
  eligibility_quiz?: QuizQuestion[];   // up to 10 yes/no questions
  // Compact collection summary (shown on detail + apply flow)
  inputs?: string;        // e.g. "wearable data, daily sleep logs"
  devices_tools?: string; // e.g. "wearable device, mobile app"
  sample_type?: string;   // e.g. "none", "stool", "saliva"
  visits?: string;        // e.g. "Remote only", "US in-person"
};

export const DEMO_EXPERIMENTS: DemoExperiment[] = [
  {
    id:                     'demo-exp-sleep',
    title:                  'Magnesium Glycinate & Sleep Architecture',
    short_description:      'Does 400mg nightly magnesium glycinate improve deep sleep and morning HRV in adults with self-reported poor sleep?',
    category:               'Sleep',
    status:                 'recruiting',
    bounty_per_participant: 85,
    total_bounty_pool:      8500,
    slots_total:            100,
    slots_filled:           23,
    duration_weeks:         8,
    region:                 'Global',
    is_remote:              true,
    is_verified:            true,
    verification_level:     'biome',
    inclusion_criteria:     'Age: 22–55\nSelf-reported poor sleep (≥3 nights/week)\nOwns wearable device (Oura, Fitbit, Whoop, or Garmin)',
    exclusion_criteria:     'Diagnosed sleep disorder (insomnia, apnea, narcolepsy)\nCurrently taking sleep medication or melatonin\nPregnant or nursing\nSevere kidney disease',
    created_at:             '2026-03-01T00:00:00Z',
    application_deadline:   '2026-04-30T00:00:00Z',
    inputs:                 'Wearable sleep data · daily sleep logs · morning HRV readings',
    devices_tools:          'Wearable device required (Oura / Fitbit / Whoop / Garmin)',
    sample_type:            'None',
    visits:                 'Remote only',
    eligibility_quiz: [
      { id: 'q1', text: 'Are you between 22 and 55 years old?',                                       expected_answer: true,  weight: 1.0, disqualifier: true  },
      { id: 'q2', text: 'Do you experience poor sleep on 3 or more nights per week?',                 expected_answer: true,  weight: 1.0, disqualifier: true  },
      { id: 'q3', text: 'Do you own a wearable device (Oura, Fitbit, Whoop, or Garmin)?',             expected_answer: true,  weight: 0.9, disqualifier: true  },
      { id: 'q4', text: 'Have you been diagnosed with insomnia, sleep apnea, or narcolepsy?',         expected_answer: false, weight: 1.0, disqualifier: true  },
      { id: 'q5', text: 'Are you currently taking sleep medication or melatonin supplements?',        expected_answer: false, weight: 0.8, disqualifier: true  },
      { id: 'q6', text: 'Are you pregnant or currently nursing?',                                     expected_answer: false, weight: 1.0, disqualifier: true  },
      { id: 'q7', text: 'Do you have severe kidney disease or significantly impaired kidney function?', expected_answer: false, weight: 1.0, disqualifier: true  },
      { id: 'q8', text: 'Are you able to commit approximately 4–6 hours per week to study tasks?',    expected_answer: true,  weight: 0.6, disqualifier: false },
      { id: 'q9', text: 'Are you willing to take a daily supplement for 8 weeks as instructed?',     expected_answer: true,  weight: 0.5, disqualifier: false },
    ],
  },
  {
    id:                     'demo-exp-cold',
    title:                  'Cold Exposure & Morning HRV Recovery',
    short_description:      '10 weeks of daily cold showers (2 min, ≤15°C) vs. control — effect on HRV, subjective energy, and recovery markers.',
    category:               'Longevity',
    status:                 'recruiting',
    bounty_per_participant: 55,
    total_bounty_pool:      2750,
    slots_total:            50,
    slots_filled:           11,
    duration_weeks:         10,
    region:                 'Global',
    is_remote:              true,
    is_verified:            false,
    verification_level:     'none',
    inclusion_criteria:     'Age: 18–45\nOwns HRV-capable wearable (Polar, Garmin, Oura, Apple Watch)\nNo cardiovascular conditions',
    exclusion_criteria:     'Heart conditions or arrhythmia\nRaynaud\'s disease\nEczema or severe skin conditions\nPregnant',
    created_at:             '2026-03-10T00:00:00Z',
    application_deadline:   '2026-05-15T00:00:00Z',
    inputs:                 'HRV wearable data · subjective energy logs · cold session logs',
    devices_tools:          'HRV-capable wearable (Polar / Garmin / Oura / Apple Watch)',
    sample_type:            'None',
    visits:                 'Remote only',
    eligibility_quiz: [
      { id: 'q1', text: 'Are you between 18 and 45 years old?',                                  expected_answer: true,  weight: 1.0, disqualifier: true  },
      { id: 'q2', text: 'Do you own an HRV-capable wearable (Polar, Garmin, Oura, or Apple Watch)?', expected_answer: true, weight: 0.9, disqualifier: true  },
      { id: 'q3', text: 'Do you have any diagnosed heart conditions or arrhythmia?',              expected_answer: false, weight: 1.0, disqualifier: true  },
      { id: 'q4', text: 'Do you have Raynaud\'s disease or severe cold sensitivity?',            expected_answer: false, weight: 0.9, disqualifier: true  },
      { id: 'q5', text: 'Are you pregnant?',                                                     expected_answer: false, weight: 1.0, disqualifier: true  },
      { id: 'q6', text: 'Are you able to take a cold shower (≤15°C) for 2 minutes daily?',      expected_answer: true,  weight: 0.7, disqualifier: false },
    ],
  },
  {
    id:                     'demo-exp-tre',
    title:                  '8-Week Time-Restricted Eating & Metabolic Markers',
    short_description:      '16:8 TRE vs. standard eating window — effect on fasting glucose, triglycerides, and subjective satiety over 8 weeks.',
    category:               'Nutrition',
    status:                 'active',
    bounty_per_participant: 120,
    total_bounty_pool:      9600,
    slots_total:            80,
    slots_filled:           73,
    duration_weeks:         8,
    region:                 'United States',
    is_remote:              false,
    is_verified:            true,
    verification_level:     'biome',
    inclusion_criteria:     'Age: 28–60\nBMI 22–33\nNo diagnosed metabolic conditions\nUS residents only',
    exclusion_criteria:     'Type 1 or 2 diabetes\nEating disorder history\nCurrent use of metabolic medications\nPregnant or nursing',
    created_at:             '2026-02-01T00:00:00Z',
    inputs:                 'Food / fasting window logs · weekly survey responses · biometric check-ins',
    devices_tools:          'Mobile app · home glucose test kit',
    sample_type:            'Blood (finger prick)',
    visits:                 'United States — home collection kit',
  },
];

// ─── Participant profiles ───────────────────────────────────────────────────

function pp(overrides: Partial<PP> & Pick<PP, 'user_id' | 'participant_id' | 'pseudonym' | 'country' | 'reliability_score' | 'previous_study_count'>): PP {
  return {
    year_of_birth:            null,
    sex_assigned_at_birth:    null,
    gender_identity:          null,
    smartphone_os:            null,
    wearable_devices:         null,
    internet_reliability:     'high',
    can_receive_kits:         true,
    sample_comfort:           ['saliva'],
    language_fluency:         ['English'],
    weekly_availability_hours: 4,
    completion_rate:          null,
    recent_interventions:     null,
    washout_sensitive:        false,
    onboarding_step:          5,
    verification_status:      'phone_verified',
    ...overrides,
  };
}

const PARTICIPANTS: PP[] = [
  pp({
    user_id:               'user-bionimad',
    participant_id:        'P-7734-KILO',
    pseudonym:             'BioNomad_88',
    country:               'United States',
    year_of_birth:         1993,
    sex_assigned_at_birth: 'male',
    gender_identity:       'male',
    smartphone_os:         'iOS',
    wearable_devices:      ['oura', 'apple_watch'],
    sample_comfort:        ['saliva', 'blood_prick', 'urine'],
    language_fluency:      ['English', 'Spanish'],
    weekly_availability_hours: 6,
    previous_study_count:  7,
    completion_rate:       94,
    reliability_score:     91.2,
    recent_interventions:  'Omega-3 (ended 3mo ago)',
    washout_sensitive:     false,
  }),
  pp({
    user_id:               'user-kelp',
    participant_id:        'P-4421-REED',
    pseudonym:             'kelp.forest',
    country:               'United States',
    year_of_birth:         1997,
    sex_assigned_at_birth: 'female',
    gender_identity:       'female',
    smartphone_os:         'Android',
    wearable_devices:      ['fitbit'],
    sample_comfort:        ['saliva'],
    language_fluency:      ['English'],
    weekly_availability_hours: 5,
    previous_study_count:  3,
    completion_rate:       82,
    reliability_score:     78.4,
    recent_interventions:  null,
    washout_sensitive:     false,
  }),
  pp({
    user_id:               'user-nightowl',
    participant_id:        'P-8812-VEGA',
    pseudonym:             'NightOwl_Kira',
    country:               'United Kingdom',
    year_of_birth:         1983,
    sex_assigned_at_birth: 'female',
    gender_identity:       'female',
    smartphone_os:         'Android',
    wearable_devices:      ['none'],
    sample_comfort:        ['saliva'],
    language_fluency:      ['English', 'French'],
    weekly_availability_hours: 3,
    previous_study_count:  1,
    completion_rate:       66,
    reliability_score:     65.1,
    recent_interventions:  'L-theanine (ongoing)',
    washout_sensitive:     true,
  }),
  pp({
    user_id:               'user-zerog',
    participant_id:        'P-2290-ALTO',
    pseudonym:             'ZeroG_Mateus',
    country:               'Brazil',
    year_of_birth:         1999,
    sex_assigned_at_birth: 'male',
    gender_identity:       'male',
    smartphone_os:         'Android',
    wearable_devices:      ['garmin'],
    sample_comfort:        ['saliva', 'urine'],
    language_fluency:      ['Portuguese', 'English'],
    weekly_availability_hours: 8,
    previous_study_count:  0,
    completion_rate:       null,
    reliability_score:     50.0,
    recent_interventions:  null,
    washout_sensitive:     false,
  }),
  pp({
    user_id:               'user-qsjo',
    participant_id:        'P-3301-NOVA',
    pseudonym:             'QuantifiedSelf_Jo',
    country:               'Canada',
    year_of_birth:         1990,
    sex_assigned_at_birth: 'female',
    gender_identity:       'non-binary',
    smartphone_os:         'iOS',
    wearable_devices:      ['oura', 'garmin', 'whoop'],
    sample_comfort:        ['saliva', 'blood_prick', 'stool', 'urine'],
    language_fluency:      ['English', 'French'],
    weekly_availability_hours: 10,
    previous_study_count:  12,
    completion_rate:       97,
    reliability_score:     94.5,
    recent_interventions:  'Creatine 5g/day (ongoing)',
    washout_sensitive:     true,
  }),
  pp({
    user_id:               'user-protocol',
    participant_id:        'P-6650-APEX',
    pseudonym:             'ProtocolAlpha',
    country:               'Germany',
    year_of_birth:         1987,
    sex_assigned_at_birth: 'male',
    gender_identity:       'male',
    smartphone_os:         'Android',
    wearable_devices:      ['oura', 'polar'],
    sample_comfort:        ['saliva', 'blood_prick'],
    language_fluency:      ['German', 'English'],
    weekly_availability_hours: 7,
    previous_study_count:  5,
    completion_rate:       89,
    reliability_score:     86.7,
    recent_interventions:  null,
    washout_sensitive:     false,
  }),
  pp({
    user_id:               'user-mitsu',
    participant_id:        'P-5512-HANA',
    pseudonym:             'mitsu_bio',
    country:               'Japan',
    year_of_birth:         1994,
    sex_assigned_at_birth: 'female',
    gender_identity:       'female',
    smartphone_os:         'iOS',
    wearable_devices:      ['apple_watch'],
    sample_comfort:        ['saliva'],
    language_fluency:      ['Japanese', 'English'],
    weekly_availability_hours: 4,
    previous_study_count:  4,
    completion_rate:       79,
    reliability_score:     72.3,
    recent_interventions:  'Vitamin D (ended 6wk ago)',
    washout_sensitive:     false,
  }),
  pp({
    user_id:               'user-rhythmic',
    participant_id:        'P-9987-LUNA',
    pseudonym:             'RhythmicLena',
    country:               'Australia',
    year_of_birth:         2001,
    sex_assigned_at_birth: 'female',
    gender_identity:       'female',
    smartphone_os:         'Android',
    wearable_devices:      ['garmin'],
    sample_comfort:        ['saliva', 'urine'],
    language_fluency:      ['English'],
    weekly_availability_hours: 5,
    previous_study_count:  2,
    completion_rate:       91,
    reliability_score:     82.1,
    recent_interventions:  null,
    washout_sensitive:     false,
  }),
];

const ppMap = new Map(PARTICIPANTS.map((p) => [p.user_id, p]));

// ─── Application history snippets ──────────────────────────────────────────

function hist(participantId: string, items: HistRow[]): HistRow[] { return items; }

const HIST: Record<string, HistRow[]> = {
  'user-bionimad': hist('user-bionimad', [
    { participant_id: 'user-bionimad', status: 'completed', applied_at: '2025-08-10T00:00:00Z', experiments: { id: 'h1', title: 'Omega-3 & Inflammation Markers', category: 'Nutrition' } },
    { participant_id: 'user-bionimad', status: 'completed', applied_at: '2025-11-02T00:00:00Z', experiments: { id: 'h2', title: 'Blue Light Blocking & Sleep Onset', category: 'Sleep' } },
    { participant_id: 'user-bionimad', status: 'approved',  applied_at: '2026-01-15T00:00:00Z', experiments: { id: 'h3', title: 'Creatine & Cognitive Performance', category: 'Cognitive' } },
  ]),
  'user-kelp': hist('user-kelp', [
    { participant_id: 'user-kelp', status: 'completed', applied_at: '2025-09-20T00:00:00Z', experiments: { id: 'h4', title: 'Fermented Foods & Gut Diversity', category: 'Microbiome' } },
    { participant_id: 'user-kelp', status: 'withdrawn',  applied_at: '2025-12-01T00:00:00Z', experiments: { id: 'h5', title: '30-Day Cold Shower Challenge', category: 'Longevity' } },
  ]),
  'user-nightowl': hist('user-nightowl', [
    { participant_id: 'user-nightowl', status: 'completed', applied_at: '2025-10-05T00:00:00Z', experiments: { id: 'h6', title: 'Evening Screen-Free Hour & Sleep Latency', category: 'Sleep' } },
  ]),
  'user-qsjo': hist('user-qsjo', [
    { participant_id: 'user-qsjo', status: 'completed', applied_at: '2025-05-01T00:00:00Z', experiments: { id: 'h7', title: 'Sauna Frequency & HRV Adaptation', category: 'Longevity' } },
    { participant_id: 'user-qsjo', status: 'completed', applied_at: '2025-07-10T00:00:00Z', experiments: { id: 'h8', title: 'Ashwagandha & Cortisol Response', category: 'Stress' } },
    { participant_id: 'user-qsjo', status: 'completed', applied_at: '2025-10-18T00:00:00Z', experiments: { id: 'h9', title: 'Ketogenic Diet & Cognitive Clarity', category: 'Nutrition' } },
  ]),
  'user-protocol': hist('user-protocol', [
    { participant_id: 'user-protocol', status: 'completed', applied_at: '2025-06-12T00:00:00Z', experiments: { id: 'ha', title: 'Zone 2 Training & VO2 Max', category: 'Fitness' } },
    { participant_id: 'user-protocol', status: 'completed', applied_at: '2025-09-01T00:00:00Z', experiments: { id: 'hb', title: 'Periodic Fasting & Autophagy Markers', category: 'Longevity' } },
  ]),
  'user-mitsu': hist('user-mitsu', [
    { participant_id: 'user-mitsu', status: 'completed', applied_at: '2025-08-20T00:00:00Z', experiments: { id: 'hc', title: 'Fermented Foods & Gut Diversity', category: 'Microbiome' } },
    { participant_id: 'user-mitsu', status: 'approved',  applied_at: '2025-12-10T00:00:00Z', experiments: { id: 'hd', title: 'Matcha vs. Coffee — Alertness Trial', category: 'Cognitive' } },
  ]),
  'user-rhythmic': hist('user-rhythmic', [
    { participant_id: 'user-rhythmic', status: 'completed', applied_at: '2025-11-05T00:00:00Z', experiments: { id: 'he', title: 'Morning Sunlight & Circadian Rhythm', category: 'Sleep' } },
  ]),
};

// ─── Helper: build an applicant row ────────────────────────────────────────

let _appSeq = 1;
function app(userId: string, expId: string, status: string, appliedDaysAgo: number): ApplicantRow {
  const profile = ppMap.get(userId) ?? null;
  return {
    id:                 `app-${expId}-${_appSeq++}`,
    participant_id:     userId,
    status,
    applied_at:         new Date(Date.now() - appliedDaysAgo * 86_400_000).toISOString(),
    approved_at:        status === 'approved' ? new Date(Date.now() - (appliedDaysAgo - 1) * 86_400_000).toISOString() : null,
    payout_status:      'pending',
    participantProfile: profile,
    applicationHistory: HIST[userId] ?? [],
  };
}

// ─── Applicants per experiment ─────────────────────────────────────────────

export const DEMO_APPLICANTS_MAP: Record<string, ApplicantRow[]> = {
  'demo-exp-sleep': [
    app('user-qsjo',     'demo-exp-sleep', 'applied',    2),
    app('user-bionimad', 'demo-exp-sleep', 'applied',    3),
    app('user-protocol', 'demo-exp-sleep', 'applied',    4),
    app('user-rhythmic', 'demo-exp-sleep', 'applied',    5),
    app('user-kelp',     'demo-exp-sleep', 'applied',    6),
    app('user-mitsu',    'demo-exp-sleep', 'applied',    8),
    app('user-nightowl', 'demo-exp-sleep', 'applied',   10),
    app('user-zerog',    'demo-exp-sleep', 'applied',   12),
  ],
  'demo-exp-cold': [
    app('user-bionimad', 'demo-exp-cold', 'applied',    1),
    app('user-protocol', 'demo-exp-cold', 'applied',    3),
    app('user-qsjo',     'demo-exp-cold', 'applied',    4),
    app('user-zerog',    'demo-exp-cold', 'applied',    7),
    app('user-rhythmic', 'demo-exp-cold', 'applied',    9),
  ],
  'demo-exp-tre': [
    app('user-bionimad', 'demo-exp-tre', 'approved',    18),
    app('user-kelp',     'demo-exp-tre', 'applied',      2),
  ],
};
