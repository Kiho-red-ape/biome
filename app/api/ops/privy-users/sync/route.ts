import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface PrivyLinkedAccount {
  type: string;
  address?: string;
  email?: string;
}
interface PrivyUser {
  id: string;
  created_at: number | string;
  linked_accounts?: PrivyLinkedAccount[];
}

// Pull every Privy user (paginated).
async function fetchAllPrivyUsers(appId: string, appSecret: string): Promise<PrivyUser[]> {
  const users: PrivyUser[] = [];
  let cursor: string | null = null;
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
    if (!res.ok) throw new Error(`Privy API error: ${await res.text()}`);
    const data = await res.json() as { data: PrivyUser[]; next_cursor?: string };
    users.push(...(data.data ?? []));
    cursor = data.next_cursor ?? null;
  } while (cursor);
  return users;
}

// POST /api/ops/privy-users/sync
// Backfills a minimal profiles row for every Privy user missing from Supabase.
// These are people who authenticated but never completed onboarding.
export async function POST() {
  const appId     = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'Privy credentials not configured' }, { status: 500 });
  }

  let privyUsers: PrivyUser[];
  try {
    privyUsers = await fetchAllPrivyUsers(appId, appSecret);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  const db = createServiceClient();
  const { data: existing } = await db.from('profiles').select('id');
  const existingIds = new Set((existing ?? []).map((p: { id: string }) => p.id));

  // Build minimal rows for anyone not already in Supabase.
  const toInsert = privyUsers
    .filter(u => !existingIds.has(u.id))
    .map(u => {
      const wallet = u.linked_accounts?.find(a => a.type === 'wallet');
      const email  = u.linked_accounts?.find(a => a.type === 'email')?.address
                  ?? u.linked_accounts?.find(a => a.type === 'google_oauth')?.email
                  ?? null;
      const createdMs = typeof u.created_at === 'number' ? u.created_at * 1000 : Date.parse(u.created_at);
      return {
        id:             u.id,
        auth_type:      wallet ? 'wallet' : 'email',
        wallet_address: wallet?.address ?? null,
        display_name:   null,
        bio:            null,
        role:           'participant' as const,
        region:         null,
        avatar_url:     null,
        email,
        created_at:     new Date(Number.isFinite(createdMs) ? createdMs : Date.now()).toISOString(),
      };
    });

  if (toInsert.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, message: 'All Privy users already synced.' });
  }

  const { error } = await db.from('profiles').insert(toInsert);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, synced: toInsert.length });
}
