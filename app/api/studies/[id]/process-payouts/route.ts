import { NextRequest, NextResponse } from 'next/server';

interface Props { params: Promise<{ id: string }> }

// POST /api/studies/[id]/process-payouts
// Deprecated: use /api/payments/process-payouts/[experimentId] instead.
export async function POST(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const newUrl = new URL(`/api/payments/process-payouts/${id}`, req.nextUrl.origin);
  const res = await fetch(newUrl.toString(), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const data = await res.json() as Record<string, unknown>;
  return NextResponse.json(data, { status: res.status });
}
