import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const prefsSchema = z.object({
  privyDid:                 z.string().min(1),
  smartphone_os:            z.enum(['ios', 'android', 'both', 'none']).nullable().optional(),
  wearable_devices:         z.array(z.string()).nullable().optional(),
  internet_reliability:     z.enum(['stable', 'intermittent', 'limited']).nullable().optional(),
  can_receive_kits:         z.boolean().nullable().optional(),
  sample_comfort:           z.array(z.string()).nullable().optional(),
  language_fluency:         z.array(z.string()).nullable().optional(),
  weekly_availability_hours: z.number().int().min(0).max(168).nullable().optional(),
  washout_sensitive:        z.boolean().optional(),
  recent_interventions:     z.string().nullable().optional(),
  urbanicity:               z.enum(['urban', 'suburban', 'rural']).nullable().optional(),
  state_region:             z.string().nullable().optional(),
});

// PATCH /api/participant-profile/preferences
// Updates participant capability/preference fields
export async function PATCH(req: NextRequest) {
  const body: unknown = await req.json();
  const parsed = prefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { privyDid, ...fields } = parsed.data;

  // Strip undefined values — only update what was sent
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) updates[k] = v;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('participant_profiles')
    .update(updates)
    .eq('user_id', privyDid)
    .select(
      'smartphone_os, wearable_devices, internet_reliability, can_receive_kits, ' +
      'sample_comfort, language_fluency, weekly_availability_hours, washout_sensitive, ' +
      'recent_interventions, urbanicity, state_region'
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preferences: data });
}
