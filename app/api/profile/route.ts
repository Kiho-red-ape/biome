import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';
import { z } from 'zod';

const createProfileSchema = z.object({
  privyDid: z.string().min(1),
  authType: z.enum(['email', 'wallet']),
  walletAddress: z.string().nullable().optional(),
  displayName: z.string().min(1).max(64).nullable().optional(),
  role: z.enum(['experimenter', 'participant', 'both']),
  region: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
});

// GET /api/profile?privyDid=did:privy:xxx
export async function GET(request: NextRequest) {
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) {
    return NextResponse.json({ error: 'privyDid required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', privyDid)
    .single();

  if (error && error.code === 'PGRST116') {
    return NextResponse.json({ profile: null });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data as Profile });
}

// POST /api/profile — upsert profile on login (handles re-onboarding gracefully)
export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = createProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { privyDid, authType, walletAddress, displayName, role, region, email } = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: privyDid,
        auth_type: authType,
        wallet_address: walletAddress ?? null,
        display_name: displayName ?? null,
        bio: null,
        role,
        region: region ?? null,
        avatar_url: null,
        ...(email ? { email } : {}),
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data as Profile }, { status: 200 });
}
