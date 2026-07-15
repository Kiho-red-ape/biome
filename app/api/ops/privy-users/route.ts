import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Fetches all users from Privy REST API, cross-references with Supabase profiles.
// Returns merged list for the ops participants dashboard.
export async function GET() {
  const appId     = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'Privy credentials not configured' }, { status: 500 });
  }

  // Fetch all users from Privy (paginated, max 100 per page)
  const privyUsers: PrivyUser[] = [];
  let cursor: string | null = null;

  try {
    do {
      const url = new URL('https://auth.privy.io/api/v1/users');
      url.searchParams.set('limit', '100');
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString(), {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64'),
          'privy-app-id': appId,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `Privy API error: ${text}` }, { status: 502 });
      }

      const data = await res.json() as { data: PrivyUser[]; next_cursor?: string };
      privyUsers.push(...(data.data ?? []));
      cursor = data.next_cursor ?? null;
    } while (cursor);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  // Pull existing Supabase profiles
  const db = createServiceClient();
  const { data: supabaseProfiles } = await db
    .from('profiles')
    .select('id, role, email, region, created_at');

  const profileMap: Record<string, SupabaseProfile> = {};
  (supabaseProfiles ?? []).forEach((p: SupabaseProfile) => {
    profileMap[p.id] = p;
  });

  // Pull participant_profiles
  const { data: ppRows } = await db
    .from('participant_profiles')
    .select('user_id, participant_id, verification_status, previous_study_count, country, flagged');

  const ppMap: Record<string, ParticipantProfile> = {};
  (ppRows ?? []).forEach((p: ParticipantProfile) => {
    ppMap[p.user_id] = p;
  });

  // Merge: one row per Privy user
  const merged = privyUsers.map(u => {
    const email = u.linked_accounts?.find(a => a.type === 'email')?.address
               ?? u.linked_accounts?.find(a => a.type === 'google_oauth')?.email
               ?? null;
    const sp  = profileMap[u.id];
    const pp  = ppMap[u.id];
    // Privy returns created_at as a Unix timestamp in SECONDS. Normalize to ISO
    // so the client renders it correctly (was showing "Jan 1970").
    const createdMs = typeof u.created_at === 'number'
      ? (u.created_at as number) * 1000
      : Date.parse(u.created_at);
    return {
      privy_id:            u.id,
      email,
      created_at:          new Date(Number.isFinite(createdMs) ? createdMs : Date.now()).toISOString(),
      supabase_role:       sp?.role ?? null,
      supabase_region:     sp?.region ?? null,
      participant_id:      pp?.participant_id ?? null,
      verification_status: pp?.verification_status ?? null,
      previous_study_count: pp?.previous_study_count ?? null,
      country:             pp?.country ?? null,
      in_supabase:         !!sp,
      onboarded:           !!pp,
      flagged:             pp?.flagged ?? false,
    };
  });

  return NextResponse.json({ users: merged, total: merged.length });
}

interface PrivyUser {
  id: string;
  created_at: number | string;
  linked_accounts?: { type: string; address?: string; email?: string }[];
}

interface SupabaseProfile {
  id: string;
  role: string;
  email: string | null;
  region: string | null;
  created_at: string;
}

interface ParticipantProfile {
  user_id: string;
  participant_id: string | null;
  verification_status: string | null;
  previous_study_count: number | null;
  country: string | null;
  flagged: boolean | null;
}
