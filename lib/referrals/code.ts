// Referral-code helpers. Codes are short, uppercase, URL-safe, and unique.

import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

type Db = ReturnType<typeof createServiceClient>;

function randomCode(): string {
  // 6 chars from a no-ambiguous alphabet (no 0/O/1/I).
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

// Return the participant's referral_code, generating + persisting one on first use.
export async function ensureReferralCode(participantId: string, db?: Db): Promise<string> {
  const supabase = db ?? createServiceClient();

  const { data: prof } = await supabase
    .from('participant_profiles')
    .select('referral_code')
    .eq('user_id', participantId)
    .maybeSingle();

  const existing = (prof as { referral_code: string | null } | null)?.referral_code;
  if (existing) return existing;

  // Generate with a few retries to dodge the unique-index collision.
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const { error } = await supabase
      .from('participant_profiles')
      .update({ referral_code: code })
      .eq('user_id', participantId);
    if (!error) return code;
    // Unique violation → try a new code.
  }
  throw new Error('Could not allocate a referral code');
}
