import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const BIOME_DOMAIN = '@biome.to';

async function verifySuperAdmin(privyDid: string): Promise<boolean> {
  const db = createServiceClient();
  const { data } = await db
    .from('profiles')
    .select('is_super_admin')
    .eq('id', privyDid)
    .single();
  return data?.is_super_admin === true;
}

// GET /api/ops/admins?privyDid=<did>
// List all profiles with a @biome.to email, with their admin status.
export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const isSuperAdmin = await verifySuperAdmin(privyDid);
  if (!isSuperAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const db = createServiceClient();
  const { data, error } = await db
    .from('profiles')
    .select('id, display_name, email, is_admin, is_super_admin, created_at')
    .ilike('email', `%${BIOME_DOMAIN}`)
    .order('is_super_admin', { ascending: false })
    .order('is_admin',       { ascending: false })
    .order('email',          { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ admins: data ?? [] });
}

// POST /api/ops/admins — grant admin to a @biome.to email (super_admin only)
export async function POST(req: NextRequest) {
  const body = await req.json() as { privyDid?: string; targetEmail?: string };
  const { privyDid, targetEmail } = body;

  if (!privyDid || !targetEmail) {
    return NextResponse.json({ error: 'privyDid and targetEmail required' }, { status: 400 });
  }
  if (!targetEmail.toLowerCase().endsWith(BIOME_DOMAIN)) {
    return NextResponse.json({ error: 'Only @biome.to email addresses can be made admin' }, { status: 400 });
  }

  const isSuperAdmin = await verifySuperAdmin(privyDid);
  if (!isSuperAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const db = createServiceClient();

  // Profile must already exist (user must have signed in at least once).
  const { data: profile } = await db
    .from('profiles')
    .select('id, email, is_super_admin')
    .ilike('email', targetEmail.toLowerCase())
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: 'No account found for that email. Ask them to sign in to Biome first.' },
      { status: 404 },
    );
  }

  const { error } = await db
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', profile.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, email: targetEmail });
}

// DELETE /api/ops/admins — revoke admin (super_admin only, cannot revoke super_admins)
export async function DELETE(req: NextRequest) {
  const body = await req.json() as { privyDid?: string; targetEmail?: string };
  const { privyDid, targetEmail } = body;

  if (!privyDid || !targetEmail) {
    return NextResponse.json({ error: 'privyDid and targetEmail required' }, { status: 400 });
  }

  const isSuperAdmin = await verifySuperAdmin(privyDid);
  if (!isSuperAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const db = createServiceClient();

  const { data: profile } = await db
    .from('profiles')
    .select('id, is_super_admin')
    .ilike('email', targetEmail.toLowerCase())
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  if (profile.is_super_admin) {
    return NextResponse.json({ error: 'Cannot revoke admin from a super admin' }, { status: 400 });
  }

  const { error } = await db
    .from('profiles')
    .update({ is_admin: false })
    .eq('id', profile.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, email: targetEmail });
}
