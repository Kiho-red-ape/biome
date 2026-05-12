import { PRICING } from './pricing-config';

export interface EstimateInput {
  studyType:  string;
  participants: number;
  duration:   string;      // '2_4' | '4_8' | '8_12' | '12_24' | '24_plus'
  geography:  string[];    // ['india', 'us', 'uk', 'eu']
  samples:    string[];    // ['stool', 'saliva', 'dried_blood_spot', 'blood_draw', 'wearable', 'none']
  irbStatus:  string;
}

export interface EstimateLineItem {
  label:         string;
  description:   string;
  amount:        number;
  isPassThrough: boolean;
}

export interface EstimateResult {
  lineItems:             EstimateLineItem[];
  subtotalPassThrough:   number;
  opsFee:                number;
  total:                 number;
  perParticipant:        number;
  participants:          number;
  duration:              string;
  warnings:              string[];
}

export function calculateEstimate(input: EstimateInput): EstimateResult {
  const { studyType, participants, duration, geography, samples, irbStatus } = input;
  const lineItems: EstimateLineItem[] = [];
  const warnings: string[] = [];

  // Recruitment difficulty
  const rarity      = PRICING.studyTypeRarity[studyType] || 'moderate';
  const recruitRate = PRICING.recruitment[rarity as keyof typeof PRICING.recruitment]?.default || 320;

  // Geography multiplier: base × (1 + 0.15 × (countries - 1))
  const countryCount              = Math.max(1, geography.length);
  const geoMultiplier             = 1 + (PRICING.geoMultiplier * (countryCount - 1));
  const recruitmentPerParticipant = Math.round(recruitRate * geoMultiplier);

  lineItems.push({
    label:         'Recruitment campaign',
    description:   `${participants} participants × $${recruitmentPerParticipant} across ${countryCount} region${countryCount > 1 ? 's' : ''}`,
    amount:        recruitmentPerParticipant * participants,
    isPassThrough: true,
  });

  // Sample kits
  const sampleTypes = samples.filter(s => s !== 'none' && s !== 'wearable' && s !== 'blood_draw');
  if (sampleTypes.length > 0) {
    const kitCost = sampleTypes.length > 1
      ? PRICING.kits.multi
      : (PRICING.kits[sampleTypes[0] as keyof typeof PRICING.kits] || 30);

    lineItems.push({
      label:         'Sample collection kits',
      description:   `${participants} × $${kitCost} (${sampleTypes.join(' + ')})`,
      amount:        kitCost * participants,
      isPassThrough: true,
    });

    const shippingRate = countryCount > 1
      ? PRICING.returnShipping.international
      : PRICING.returnShipping.domestic;

    lineItems.push({
      label:         'Sample return shipping',
      description:   `${participants} × $${shippingRate} ${countryCount > 1 ? '(international)' : '(domestic)'}`,
      amount:        shippingRate * participants,
      isPassThrough: true,
    });
  }

  // Phlebotomy (venous blood draw)
  if (samples.includes('blood_draw')) {
    const primaryGeo = geography.includes('us') ? 'us'
      : geography.includes('uk') ? 'uk'
      : geography.includes('eu') ? 'eu'
      : 'india';
    const phlebRate = PRICING.phlebotomy[primaryGeo as keyof typeof PRICING.phlebotomy] || 100;

    lineItems.push({
      label:         'Mobile phlebotomy',
      description:   `${participants} × $${phlebRate} (partner network, ${primaryGeo.toUpperCase()})`,
      amount:        phlebRate * participants,
      isPassThrough: true,
    });
  }

  // Lab analysis
  const needsLab = samples.some(s => ['stool', 'blood_draw', 'dried_blood_spot'].includes(s));
  if (needsLab) {
    const labGeo = geography.includes('india') ? 'india'
      : geography.includes('us') ? 'us'
      : 'uk';

    let labCost  = 0;
    let labLabel = '';

    if (samples.includes('stool')) {
      labCost  += PRICING.labAnalysis[`stool_16s_${labGeo}` as keyof typeof PRICING.labAnalysis] || 120;
      labLabel  = 'microbiome sequencing';
    }
    if (samples.includes('blood_draw')) {
      labCost  += PRICING.labAnalysis[`blood_panel_${labGeo}` as keyof typeof PRICING.labAnalysis] || 120;
      labLabel += (labLabel ? ' + ' : '') + 'blood panel';
    }
    if (samples.includes('dried_blood_spot')) {
      labCost  += PRICING.labAnalysis[`dbs_panel_${labGeo}` as keyof typeof PRICING.labAnalysis] || 60;
      labLabel += (labLabel ? ' + ' : '') + 'DBS analysis';
    }

    if (labCost > 0) {
      lineItems.push({
        label:         'Lab analysis',
        description:   `${participants} × $${labCost} (${labLabel}, ${labGeo.toUpperCase()} lab rates)`,
        amount:        labCost * participants,
        isPassThrough: true,
      });
    }
  }

  // Wearable integration
  if (samples.includes('wearable')) {
    lineItems.push({
      label:         'Wearable data integration',
      description:   'Platform setup for device data ingestion',
      amount:        PRICING.wearableIntegration,
      isPassThrough: true,
    });
  }

  // Participant compensation: venous blood draw and stool = heavy; DBS/saliva/urine = light
  const hasHeavy  = samples.some(s => ['stool', 'blood_draw'].includes(s));
  const hasLight  = samples.some(s => ['saliva', 'urine', 'wearable', 'dried_blood_spot'].includes(s));
  const compTier  = hasHeavy ? 'heavy_samples' : hasLight ? 'light_samples' : 'survey_only';
  const compPerPerson = PRICING.compensation[compTier][duration as keyof typeof PRICING.compensation.survey_only] || 80;

  lineItems.push({
    label:         'Participant compensation',
    description:   `${participants} × $${compPerPerson} (${duration.replace('_', '–').replace('plus', '+')} weeks, ${compTier.replace(/_/g, ' ')})`,
    amount:        compPerPerson * participants,
    isPassThrough: true,
  });

  // Subtotal with 1.5× buffer
  const rawPassThrough      = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const subtotalPassThrough = Math.round(rawPassThrough * PRICING.PASS_THROUGH_BUFFER);

  // Ops fee: percentage-based with hard min/max cap
  let opsFee = Math.round(
    (PRICING.OPS_FEE_PERCENTAGE / (1 - PRICING.OPS_FEE_PERCENTAGE)) * subtotalPassThrough
  );
  opsFee = Math.max(opsFee, PRICING.MIN_OPS_FEE);
  opsFee = Math.min(opsFee, PRICING.MAX_OPS_FEE);

  let total = subtotalPassThrough + opsFee;

  // Enforce minimum total
  if (total < PRICING.MIN_STUDY_TOTAL) {
    opsFee = PRICING.MIN_STUDY_TOTAL - subtotalPassThrough;
    opsFee = Math.max(opsFee, PRICING.MIN_OPS_FEE);
    opsFee = Math.min(opsFee, PRICING.MAX_OPS_FEE);
    total  = subtotalPassThrough + opsFee;
  }

  // Warnings
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
    subtotalPassThrough,
    opsFee,
    total,
    perParticipant: Math.round(total / participants),
    participants,
    duration,
    warnings,
  };
}
