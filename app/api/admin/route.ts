import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

async function verifyAdmin(privyDid: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', privyDid)
    .single();
  return data?.is_admin === true;
}

async function verifySuperAdmin(privyDid: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', privyDid)
    .single();
  return data?.is_super_admin === true;
}

// GET /api/admin?privyDid=... — list pending experimenter profiles
export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const isAdmin = await verifyAdmin(privyDid);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const supabase = createServiceClient();

  const { data: pending } = await supabase
    .from('experimenter_profiles')
    .select('id, user_id, org_name, org_website, org_description, role_title, screening_status, created_at, profiles!user_id(display_name, email, region)')
    .order('created_at', { ascending: true });

  return NextResponse.json({ profiles: pending ?? [] });
}

// PATCH /api/admin — approve or reject an experimenter profile
export async function PATCH(req: NextRequest) {
  const body = await req.json() as {
    privyDid?: string;
    profileId?: string;
    action?: 'approve' | 'reject';
  };

  const { privyDid, profileId, action } = body;
  if (!privyDid || !profileId || !['approve', 'reject'].includes(action ?? '')) {
    return NextResponse.json({ error: 'privyDid, profileId, and action required' }, { status: 400 });
  }

  const isAdmin = await verifyAdmin(privyDid);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const supabase = createServiceClient();

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const { data, error } = await supabase
    .from('experimenter_profiles')
    .update({
      screening_status: newStatus,
      screened_at:      new Date().toISOString(),
      screened_by:      privyDid,
    })
    .eq('id', profileId)
    .select('id, user_id, org_name, screening_status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

// POST /api/admin — grant/revoke admin by email (super-admin only)
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    privyDid?: string;
    targetEmail?: string;
    grant?: boolean;
  };

  const { privyDid, targetEmail, grant } = body;
  if (!privyDid || !targetEmail) {
    return NextResponse.json({ error: 'privyDid and targetEmail required' }, { status: 400 });
  }
  if (!targetEmail.toLowerCase().endsWith('@biome.to')) {
    return NextResponse.json({ error: 'Only @biome.to email addresses can be made admin' }, { status: 400 });
  }

  const isSuperAdmin = await verifySuperAdmin(privyDid);
  if (!isSuperAdmin) return NextResponse.json({ error: 'Unauthorized — super admin only' }, { status: 403 });

  const supabase = createServiceClient();

  // Never allow revoking a super admin's access via this endpoint.
  if (grant === false) {
    const { data: target } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .ilike('email', targetEmail)
      .single();
    if (target?.is_super_admin) {
      return NextResponse.json({ error: 'Cannot revoke admin from a super admin' }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: grant !== false })
    .ilike('email', targetEmail);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, email: targetEmail, is_admin: grant !== false });
}
