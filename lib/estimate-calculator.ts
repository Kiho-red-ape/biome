import { PRICING } from './pricing-config';

export interface EstimateInput {
  studyType:   string;
  participants: number;
  duration:    string;     // '2_4' | '4_8' | '8_12' | '12_24' | '24_plus'
  geography:   string[];   // ['india', 'us', 'uk', 'eu']
  samples:     string[];   // ['stool', 'saliva', 'dried_blood_spot', 'blood_draw', 'wearable', 'none']
  irbStatus:   string;
}

export interface EstimateLineItem {
  label:         string;
  description:   string;
  amount:        number;
  isPassThrough: boolean;
}

export interface EstimateResult {
  lineItems:            EstimateLineItem[];
  subtotalPassThrough:  number;   // after 1.5x buffer
  opsFee:               number;
  total:                number;
  perParticipant:       number;
  participants:         number;
  duration:             string;
  warnings:             string[];
}

export function calculateEstimate(input: EstimateInput): EstimateResult {
  const { studyType, participants, duration, geography, samples, irbStatus } = input;
  const lineItems: EstimateLineItem[] = [];
  const warnings:  string[]          = [];

  // ── Recruitment ────────────────────────────────────────────────────────────
  const rarity      = PRICING.studyTypeRarity[studyType] || 'moderate';
  const recruitRate = PRICING.recruitment[rarity as keyof typeof PRICING.recruitment]?.default ?? 320;
  const countryCount        = geography.length;
  const geoMultiplier       = 1 + PRICING.geoMultiplier * Math.max(0, countryCount - 1);
  const recruitPerParticipant = Math.round(recruitRate * geoMultiplier);
  const recruitmentTotal      = recruitPerParticipant * participants;

  lineItems.push({
    label:         'Recruitment campaign',
    description:   `${participants} participants × $${recruitPerParticipant} across ${countryCount} region${countryCount > 1 ? 's' : ''}`,
    amount:        recruitmentTotal,
    isPassThrough: true,
  });

  // ── Sample kits ────────────────────────────────────────────────────────────
  const sampleTypes = samples.filter(s => s !== 'none' && s !== 'wearable' && s !== 'blood_draw');
  if (sampleTypes.length > 0) {
    const kitCost = sampleTypes.length > 1
      ? PRICING.kits.multi
      : (PRICING.kits[sampleTypes[0] as keyof typeof PRICING.kits] ?? 30);

    lineItems.push({
      label:         'Sample collection kits',
      description:   `${participants} × $${kitCost} (${sampleTypes.join(' + ')})`,
      amount:        kitCost * participants,
      isPassThrough: true,
    });

    // Return shipping
    const shippingRate = countryCount > 1
      ? PRICING.returnShipping.international
      : PRICING.returnShipping.domestic;

    lineItems.push({
      label:         'Sample return shipping',
      description:   `${participants} × $${shippingRate} (${countryCount > 1 ? 'international' : 'domestic'})`,
      amount:        shippingRate * participants,
      isPassThrough: true,
    });
  }

  // ── Phlebotomy (venous blood draw only) ───────────────────────────────────
  if (samples.includes('blood_draw')) {
    const primaryGeo  = geography.includes('us') ? 'us'
      : geography.includes('uk')   ? 'uk'
      : geography.includes('eu')   ? 'eu'
      : 'india';
    const phlebRate   = PRICING.phlebotomy[primaryGeo as keyof typeof PRICING.phlebotomy] ?? 100;

    lineItems.push({
      label:         'Mobile phlebotomy',
      description:   `${participants} × $${phlebRate} (partner network, ${primaryGeo.toUpperCase()})`,
      amount:        phlebRate * participants,
      isPassThrough: true,
    });
  }

  // ── Lab analysis ──────────────────────────────────────────────────────────
  const needsLab = samples.some(s => ['stool', 'blood_draw', 'dried_blood_spot'].includes(s));
  if (needsLab) {
    const primaryGeo = geography.includes('india') ? 'india'
      : geography.includes('us')    ? 'us'
      : 'uk';

    let labCostPerSample = 0;
    const labParts: string[] = [];

    if (samples.includes('stool')) {
      const key = `stool_16s_${primaryGeo}` as keyof typeof PRICING.labAnalysis;
      labCostPerSample += PRICING.labAnalysis[key] ?? 120;
      labParts.push('microbiome sequencing');
    }
    if (samples.includes('blood_draw')) {
      const key = `blood_panel_${primaryGeo}` as keyof typeof PRICING.labAnalysis;
      labCostPerSample += PRICING.labAnalysis[key] ?? 120;
      labParts.push('blood panel');
    }
    if (samples.includes('dried_blood_spot')) {
      const key = `dbs_panel_${primaryGeo}` as keyof typeof PRICING.labAnalysis;
      labCostPerSample += PRICING.labAnalysis[key] ?? 60;
      labParts.push('DBS analysis');
    }

    if (labCostPerSample > 0) {
      lineItems.push({
        label:         'Lab analysis',
        description:   `${participants} × $${labCostPerSample} (${labParts.join(' + ')}, ${primaryGeo.toUpperCase()} lab rates)`,
        amount:        labCostPerSample * participants,
        isPassThrough: true,
      });
    }
  }

  // ── Wearable integration ──────────────────────────────────────────────────
  if (samples.includes('wearable')) {
    lineItems.push({
      label:         'Wearable data integration',
      description:   'Platform setup for device data ingestion',
      amount:        PRICING.wearableIntegration,
      isPassThrough: true,
    });
  }

  // ── Participant compensation ───────────────────────────────────────────────
  const hasSamples      = samples.some(s => ['stool', 'blood_draw', 'dried_blood_spot'].includes(s));
  const hasLightSamples = samples.some(s => ['saliva', 'urine', 'wearable'].includes(s));
  const tier            = hasSamples ? 'heavy_samples' : hasLightSamples ? 'light_samples' : 'survey_only';
  const durationKey     = duration as keyof typeof PRICING.compensation.survey_only;
  const compPerPerson   = PRICING.compensation[tier][durationKey] ?? 80;
  const durationLabel   = duration.replace('_', '–').replace('plus', '+');

  lineItems.push({
    label:         'Participant compensation',
    description:   `${participants} × $${compPerPerson} (${durationLabel} weeks, ${tier.replace(/_/g, ' ')})`,
    amount:        compPerPerson * participants,
    isPassThrough: true,
  });

  // ── Subtotals ─────────────────────────────────────────────────────────────
  const rawPassThrough      = lineItems.reduce((s, i) => s + i.amount, 0);
  const bufferedPassThrough = Math.round(rawPassThrough * PRICING.PASS_THROUGH_BUFFER);

  // Ops fee: target 45% of total, but clamp between $8k and $10k
  // opsFee = (0.45 / 0.55) × bufferedPassThrough, then clamp
  let opsFee = Math.round((PRICING.OPS_FEE_PERCENTAGE / (1 - PRICING.OPS_FEE_PERCENTAGE)) * bufferedPassThrough);
  opsFee = Math.max(opsFee, PRICING.MIN_OPS_FEE);
  opsFee = Math.min(opsFee, PRICING.MAX_OPS_FEE);

  let total = bufferedPassThrough + opsFee;

  // Enforce minimum study total
  if (total < PRICING.MIN_STUDY_TOTAL) {
    opsFee = Math.max(PRICING.MIN_STUDY_TOTAL - bufferedPassThrough, PRICING.MIN_OPS_FEE);
    opsFee = Math.min(opsFee, PRICING.MAX_OPS_FEE);
    total  = bufferedPassThrough + opsFee;
  }

  // ── Warnings ──────────────────────────────────────────────────────────────
  if (irbStatus === 'unsure') {
    warnings.push(
      'IRB requirements depend on your study type and jurisdiction. We recommend confirming before proceeding. We can connect you with independent IRB partners if needed.'
    );
  }
  if (participants > 200) {
    warnings.push('Studies over 200 participants may require extended timelines and phased recruitment.');
  }
  if (countryCount > 3) {
    warnings.push('Multi-region studies across 4+ geographies involve complex sample logistics. Final costs may vary significantly.');
  }

  return {
    lineItems,
    subtotalPassThrough: bufferedPassThrough,
    opsFee,
    total,
    perParticipant: Math.round(total / participants),
    participants,
    duration,
    warnings,
  };
}
