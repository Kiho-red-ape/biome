const BASE = process.env.AIRTABLE_BASE_ID
  ? `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`
  : null;

async function airtableCreate(tableId: string | undefined, fields: Record<string, unknown>) {
  if (!BASE || !tableId || !process.env.AIRTABLE_API_KEY) return;
  try {
    await fetch(`${BASE}/${tableId}`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });
  } catch (err) {
    console.error('[airtable] sync error:', err);
  }
}

export function syncIntakeToAirtable(intake: Record<string, unknown>) {
  return airtableCreate(process.env.AIRTABLE_TABLE_INTAKES, {
    Organization:  intake.organization,
    'Study Title': intake.study_title,
    Type:          intake.study_type,
    Participants:  intake.target_participants,
    Geography:     Array.isArray(intake.geography) ? (intake.geography as string[]).join(', ') : '',
    Budget:        intake.budget_range,
    Status:        'New',
    Date:          new Date().toISOString().split('T')[0],
  });
}

export function syncEstimateToAirtable(lead: Record<string, unknown>) {
  return airtableCreate(process.env.AIRTABLE_TABLE_ESTIMATES, {
    Email:             lead.email,
    Organization:      lead.organization,
    'Study Type':      lead.study_type,
    Participants:      lead.participants,
    'Estimated Total': lead.estimated_total,
    Contacted:         false,
    Date:              new Date().toISOString().split('T')[0],
  });
}

export function syncPartnerToAirtable(partner: Record<string, unknown>) {
  return airtableCreate(process.env.AIRTABLE_TABLE_PARTNERS, {
    Organization: partner.name,
    Category:     partner.category,
    Region:       partner.region,
    Status:       'Pending',
    Date:         new Date().toISOString().split('T')[0],
  });
}
