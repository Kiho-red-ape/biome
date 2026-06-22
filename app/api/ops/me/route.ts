import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/ops/me?privyDid=<did>
// Returns the caller's admin status without exposing other users' data.
export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) {
    return NextResponse.json({ is_admin: false, is_super_admin: false });
  }

  const db = createServiceClient();
  const { data } = await db
    .from('profiles')
    .select('is_admin, is_super_admin')
    .eq('id', privyDid)
    .single();

  return NextResponse.json({
    is_admin:       data?.is_admin       ?? false,
    is_super_admin: data?.is_super_admin ?? false,
  });
}
