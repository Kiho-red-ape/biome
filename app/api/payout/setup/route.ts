import { NextRequest, NextResponse } from 'next/server';

// POST /api/payout/setup
// Deprecated: use /api/payments/connect-setup instead.
// Redirects for backwards compatibility.
export async function POST(req: NextRequest) {
  const body = await req.json() as { privyDid?: string };
  const { privyDid } = body;

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  // Forward to the new Stripe Connect setup endpoint
  const newUrl = new URL('/api/payments/connect-setup', req.nextUrl.origin);
  const res = await fetch(newUrl.toString(), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ privyDid }),
  });

  const data = await res.json() as Record<string, unknown>;
  return NextResponse.json(data, { status: res.status });
}
