export const PRICING = {
  // RECRUITMENT: cost per ENROLLED participant
  recruitment: {
    common:    { min: 120, max: 250, default: 180 },
    moderate:  { min: 220, max: 450, default: 320 },
    rare:      { min: 400, max: 700, default: 520 },
    very_rare: { min: 600, max: 1200, default: 850 },
  },

  // Each additional country after first adds 15% to recruitment cost
  geoMultiplier: 0.15,

  // SAMPLE KITS: cost per kit shipped
  kits: {
    stool:            30,
    saliva:           20,
    dried_blood_spot: 25,
    urine:            15,
    multi:            55,
  },

  // RETURN SHIPPING: cost per sample returned to lab
  returnShipping: {
    domestic:      15,
    international: 45,
  },

  // PHLEBOTOMY: cost per blood draw via mobile phlebotomy partner
  phlebotomy: {
    india:  20,
    us:    120,
    uk:     95,
    eu:    100,
  },

  // LAB ANALYSIS: cost per sample
  labAnalysis: {
    stool_16s_india:    65,
    stool_16s_us:      130,
    stool_16s_uk:      120,
    stool_shotgun_india: 220,
    stool_shotgun_us:   380,
    stool_shotgun_uk:   340,
    blood_panel_india:   40,
    blood_panel_us:     150,
    blood_panel_uk:     120,
    dbs_panel_india:     30,
    dbs_panel_us:        80,
    dbs_panel_uk:        70,
  },

  // PARTICIPANT COMPENSATION: per-person based on duration and burden
  compensation: {
    survey_only:   { '2_4': 30, '4_8': 50,  '8_12': 70,  '12_24': 100, '24_plus': 150 },
    light_samples: { '2_4': 50, '4_8': 75,  '8_12': 100, '12_24': 150, '24_plus': 200 },
    heavy_samples: { '2_4': 80, '4_8': 120, '8_12': 160, '12_24': 220, '24_plus': 300 },
  },

  // WEARABLE DATA INGESTION: flat fee per study
  wearableIntegration: 500,

  // MARGINS AND MINIMUMS
  PASS_THROUGH_BUFFER:  1.50,  // 50% coordination margin on all pass-throughs
  OPS_FEE_PERCENTAGE:   0.45,  // ops fee = 45% of total
  MIN_OPS_FEE:          8000,  // never quote ops fee below $8K
  MAX_OPS_FEE:         10000,  // cap negotiable ops fee at $10K
  MIN_STUDY_TOTAL:     15000,  // never quote total below $15K
  MAX_OPS_FEE_RATIO:    0.55,  // ops fee should never exceed 55% of total

  // Study type to recruitment difficulty mapping
  studyTypeRarity: {
    observational:       'moderate',
    behavioral:          'common',
    consumer_product:    'common',
    device:              'moderate',
    survey:              'common',
    supplement_novel:    'moderate',
    cognitive_behavioral:'common',
    biomarker:           'rare',
    condition_specific:  'rare',
  } as Record<string, string>,
};
