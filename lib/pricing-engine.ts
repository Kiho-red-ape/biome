// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL PRICING ENGINE — never expose raw config or internal numbers to client
//
// This file contains the REAL cost model. The client only ever sees the final
// grouped 3-bucket estimate produced by calculateEstimate(). The raw recruitment
// cost, sample cost, service fee, and margin are NEVER rendered client-facing.
// Operator console (/ops) is the only surface allowed to read `_internal`.
// ─────────────────────────────────────────────────────────────────────────────

const COST_MODEL = {
  // Real recruitment cost per enrolled participant (what it actually costs us).
  // No participant pool exists — every participant is bought via paid channels.
  recruitmentBase: {
    healthy_easy:      320,  // behavioral, survey, supplement
    healthy_moderate:  480,  // specific demographics, device
    condition_common:  850,  // diabetes, hypertension, IBS
    condition_specific: 1400, // specific diagnosis, biomarker subtype
    condition_rare:    3000, // rare conditions
  },

  // Recruitment is unpredictable. This buffer covers the risk that actual
  // cost-per-enrolled exceeds estimate. Built into the number, never shown.
  recruitmentRiskBuffer: 1.25,

  // Dropout: we must recruit ~30% more than the target to land the target.
  dropoutBuffer: 1.30,

  // Multi-country adds real cost (new ad accounts, regs, shipping, labs).
  geoMultiplierPerCountry: 0.22,

  // Sample kit costs (retail — no volume discounts yet).
  kits: {
    stool: 40, saliva: 28, dried_blood_spot: 32, urine: 22, multi: 70,
  },

  returnShipping: { domestic: 22, international: 65 },

  phlebotomy: { india: 25, us: 145, uk: 115, eu: 125 },

  labAnalysis: {
    stool_india: 85, stool_us: 160, stool_uk: 145,
    blood_india: 55, blood_us: 180, blood_uk: 150,
    dbs_india: 45, dbs_us: 110, dbs_uk: 95,
  },

  // Participant compensation (cold recruitment needs higher bounty to attract).
  compensation: {
    survey:  { '2_4': 45,  '4_8': 70,  '8_12': 100, '12_24': 150, '24_plus': 220 },
    light:   { '2_4': 70,  '4_8': 110, '8_12': 150, '12_24': 210, '24_plus': 300 },
    heavy:   { '2_4': 110, '4_8': 170, '8_12': 230, '12_24': 320, '24_plus': 420 },
    cohort:  { '2_4': 150, '4_8': 230, '8_12': 320, '12_24': 450, '24_plus': 600 },
  },

  wearableSetup: 1000,

  // MARGIN — this is where the business makes money. Never exposed.
  // Applied to the total internal cost to reach the client price.
  // 0.58 margin means client pays internal_cost / (1 - 0.58) ≈ internal_cost × 2.38
  targetGrossMargin: 0.58,

  // Floors — protect against underpricing.
  minServiceFee:  14000, // our operational fee floor (time, platform, PM)
  minStudyTotal:  28000, // never quote below this

  // Operational service fee as % of pass-through (this IS the margin engine),
  // but presented to client bundled — never as a separate "ops fee".
  // At 0.65, blended gross margin lands ~48% (margin = (0.15 + ratio)/(1 + ratio)
  // given the 0.85 cost-to-deliver factor). For a true ~55% margin, ratio ≈ 0.89.
  serviceFeeRatio: 0.65,
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATED OUTPUTS (computed from this exact model — not estimates).
// Verified against a real Postgres-independent run of calculateEstimate():
//
//   A) 50p cognitive/behavioral, 2-4wk, UK+US+India+EU, survey + DBS
//      → total $127,611 · $2,552/participant · ~48% margin · CRO $510K-$890K
//   B) 30p observational, 4-8wk, India only, stool
//      → total $54,302 · $1,810/participant · ~48% margin · CRO $220K-$380K
//   C) 200p biomarker, 12-24wk, US+UK+India, stool + blood draw + wearable
//      → total $1,277,430 · $6,387/participant · ~48% margin · CRO $5.11M-$8.94M
//
// In all cases the 3 client buckets sum exactly to the total. The original
// spec's "$70-90K / 55-60%" notes for A were rough guesses; the figures above
// are the model's true output. geoMultiplierPerCountry stays 0.22 — multi-
// country cost is real and should not be discounted to hit a guessed target.
// ─────────────────────────────────────────────────────────────────────────────

export interface EstimateInput {
  studyType:    string;
  participants: number;   // target enrollment
  duration:     string;
  geography:    string[];
  samples:      string[];
  irbStatus:    string;
}

export interface EstimateBuckets {
  recruitmentAndScreening:  number;
  operationsAndLogistics:   number;
  participantCompensation:  number;
}

export interface EstimateInternal {
  recruitmentCost:     number;
  sampleCost:          number;
  compensationCost:    number;
  passThroughCost:     number;
  serviceFee:          number;
  recruitTarget:       number;
  estimatedActualCost: number;
  estimatedMargin:     number;  // percent
  riskFlags:           string[];
}

export interface EstimateResult {
  total:          number;
  perParticipant: number;
  buckets:        EstimateBuckets;
  participants:   number;
  duration:       string;
  croLow:         number;
  croHigh:        number;
  // Internal only — for operator console, NOT shown on the public estimate.
  _internal:      EstimateInternal;
}

// Map study type to recruitment difficulty.
function getRecruitmentTier(studyType: string): keyof typeof COST_MODEL.recruitmentBase {
  const map: Record<string, keyof typeof COST_MODEL.recruitmentBase> = {
    behavioral:           'healthy_easy',
    survey:               'healthy_easy',
    consumer_product:     'healthy_easy',
    observational:        'healthy_moderate',
    device:               'healthy_moderate',
    supplement_novel:     'healthy_moderate',
    cognitive_behavioral: 'healthy_moderate',
    biomarker:            'condition_specific',
    condition_specific:   'condition_specific',
  };
  return map[studyType] || 'healthy_moderate';
}

// CRO comparison anchor: a traditional CRO typically quotes 4×–7× the BIOME
// total for comparable operational scope. Rounded to nearest $10K. Defensible
// (real CRO multiples) and anchors value without quoting specific competitors.
function croRange(total: number): { croLow: number; croHigh: number } {
  const round10k = (n: number) => Math.round(n / 10000) * 10000;
  return { croLow: round10k(total * 4), croHigh: round10k(total * 7) };
}

export function calculateEstimate(input: EstimateInput): EstimateResult {
  const { studyType, participants, duration, geography, samples } = input;

  // Recruit more than target to cover dropout.
  const recruitTarget = Math.ceil(participants * COST_MODEL.dropoutBuffer);

  // 1. RECRUITMENT (with risk buffer + geo multiplier)
  const tier         = getRecruitmentTier(studyType);
  const baseRecruit  = COST_MODEL.recruitmentBase[tier];
  const countryCount = Math.max(1, geography.length);
  const geoMult      = 1 + (COST_MODEL.geoMultiplierPerCountry * (countryCount - 1));
  const recruitmentCost = Math.round(
    recruitTarget * baseRecruit * geoMult * COST_MODEL.recruitmentRiskBuffer
  );

  // 2. SAMPLES (kits + shipping + lab)
  const primaryGeo = geography.includes('india') ? 'india'
    : geography.includes('us') ? 'us'
    : geography.includes('uk') ? 'uk' : 'india';
  const isInternational = countryCount > 1;

  let sampleCost = 0;
  const physicalSamples = samples.filter(s =>
    ['stool', 'saliva', 'dried_blood_spot', 'urine', 'blood_draw'].includes(s));

  if (physicalSamples.length > 0) {
    // Kits (go to enrolled only — use target, not recruit-target).
    const kitTypes = physicalSamples.filter(s => s !== 'blood_draw');
    if (kitTypes.length > 0) {
      const kitCost = kitTypes.length > 1
        ? COST_MODEL.kits.multi
        : COST_MODEL.kits[kitTypes[0] as keyof typeof COST_MODEL.kits];
      sampleCost += kitCost * participants;
      const ship = isInternational
        ? COST_MODEL.returnShipping.international
        : COST_MODEL.returnShipping.domestic;
      sampleCost += ship * participants;
    }
    // Phlebotomy
    if (samples.includes('blood_draw')) {
      sampleCost += COST_MODEL.phlebotomy[primaryGeo as keyof typeof COST_MODEL.phlebotomy] * participants;
    }
    // Lab analysis
    if (samples.includes('stool')) {
      sampleCost += COST_MODEL.labAnalysis[`stool_${primaryGeo}` as keyof typeof COST_MODEL.labAnalysis] * participants;
    }
    if (samples.includes('blood_draw')) {
      sampleCost += COST_MODEL.labAnalysis[`blood_${primaryGeo}` as keyof typeof COST_MODEL.labAnalysis] * participants;
    }
    if (samples.includes('dried_blood_spot')) {
      sampleCost += COST_MODEL.labAnalysis[`dbs_${primaryGeo}` as keyof typeof COST_MODEL.labAnalysis] * participants;
    }
  }
  if (samples.includes('wearable')) {
    sampleCost += COST_MODEL.wearableSetup;
  }

  // 3. COMPENSATION
  const hasHeavy = samples.some(s => ['stool', 'blood_draw', 'dried_blood_spot'].includes(s));
  const hasLight = samples.some(s => ['saliva', 'urine', 'wearable'].includes(s));
  const compTier = hasHeavy ? 'heavy' : hasLight ? 'light' : 'survey';
  const durKey   = duration as keyof typeof COST_MODEL.compensation.survey;
  const compensationCost = (COST_MODEL.compensation[compTier][durKey] || 100) * participants;

  // INTERNAL TOTALS
  const passThroughCost = recruitmentCost + sampleCost + compensationCost;

  // Service fee (our margin engine) — proportional to pass-through, with floor.
  let serviceFee = Math.max(
    Math.round(passThroughCost * COST_MODEL.serviceFeeRatio),
    COST_MODEL.minServiceFee,
  );

  let total = passThroughCost + serviceFee;

  // Enforce minimum study total.
  if (total < COST_MODEL.minStudyTotal) {
    serviceFee += (COST_MODEL.minStudyTotal - total);
    total = COST_MODEL.minStudyTotal;
  }

  // CLIENT-FACING GROUPED BUCKETS (never show raw internal breakdown).
  // Group into 3 clean buckets that bundle margin invisibly. Constructed to
  // sum exactly to the total (the last bucket absorbs any rounding remainder).
  const recruitmentAndScreening = Math.round(recruitmentCost + serviceFee * 0.45);
  const operationsAndLogistics  = Math.round(sampleCost + serviceFee * 0.40);
  const participantCompensation = total - recruitmentAndScreening - operationsAndLogistics;

  const { croLow, croHigh } = croRange(total);

  // Risk flags for the operator console.
  const riskFlags: string[] = [];
  if (countryCount > 2)               riskFlags.push('multi-country');
  if (tier === 'condition_rare')      riskFlags.push('rare population');
  if (tier === 'condition_specific')  riskFlags.push('specific-diagnosis recruitment');
  if (participants > 200)             riskFlags.push('large cohort (>200)');
  if (samples.includes('blood_draw')) riskFlags.push('venous draw logistics');

  return {
    total,
    perParticipant: Math.round(total / participants),
    buckets: {
      recruitmentAndScreening,
      operationsAndLogistics,
      participantCompensation,
    },
    participants,
    duration,
    croLow,
    croHigh,
    _internal: {
      recruitmentCost,
      sampleCost,
      compensationCost,
      passThroughCost,
      serviceFee,
      recruitTarget,
      estimatedActualCost: Math.round(passThroughCost * 0.85),
      estimatedMargin: Math.round(((total - passThroughCost * 0.85) / total) * 100),
      riskFlags,
    },
  };
}
