import crypto from 'crypto';

interface TrolleyRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
}

export async function trolleyRequest<T = unknown>({ method, path, body }: TrolleyRequestOptions): Promise<T> {
  const accessKey = process.env.TROLLEY_ACCESS_KEY;
  const secretKey = process.env.TROLLEY_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error('Trolley API keys not configured');
  }

  const timestamp  = Math.floor(Date.now() / 1000).toString();
  const bodyString = body ? JSON.stringify(body) : '';
  const prehash    = `${method.toUpperCase()}\n${path}\n${bodyString}\n${timestamp}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(prehash)
    .digest('hex');

  const response = await fetch(`https://api.trolley.com${path}`, {
    method,
    headers: {
      'Authorization': `prsign ${accessKey}:${signature}`,
      'X-PR-Timestamp': timestamp,
      'Content-Type': 'application/json',
    },
    body: bodyString || undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Trolley API error ${response.status}: ${error}`);
  }

  return response.json() as Promise<T>;
}

// ─── Typed helpers ─────────────────────────────────────────────────────────────

export interface TrolleyRecipient {
  id: string;
  referenceId: string;
  email: string;
  name: string;
  status: string;
  payoutMethod?: string;
  compliance?: { status: string };
}

export interface TrolleyBatch {
  id: string;
  status: string;
  totalAmount: { value: string; currency: string };
  payments: { listItems: TrolleyPayment[] };
}

export interface TrolleyPayment {
  id: string;
  status: string;
  targetAmount: { value: string; currency: string };
  recipient: { id: string };
}

export async function createRecipient(params: {
  email: string;
  firstName: string;
  lastName: string;
  referenceId: string;
}): Promise<TrolleyRecipient> {
  const res = await trolleyRequest<{ recipient: TrolleyRecipient }>({
    method: 'POST',
    path:   '/v1/recipients',
    body:   {
      email:       params.email,
      firstName:   params.firstName,
      lastName:    params.lastName,
      referenceId: params.referenceId,
      type:        'individual',
    },
  });
  return res.recipient;
}

export async function getRecipient(recipientId: string): Promise<TrolleyRecipient> {
  const res = await trolleyRequest<{ recipient: TrolleyRecipient }>({
    method: 'GET',
    path:   `/v1/recipients/${recipientId}`,
  });
  return res.recipient;
}

export async function generateOnboardingLink(recipientId: string, returnUrl: string): Promise<string> {
  const res = await trolleyRequest<{ link: string }>({
    method: 'POST',
    path:   `/v1/recipients/${recipientId}/onboarding-link`,
    body:   { returnUrl },
  });
  return res.link;
}

export async function createBatch(description: string): Promise<string> {
  const res = await trolleyRequest<{ batch: { id: string } }>({
    method: 'POST',
    path:   '/v1/batches',
    body:   { description, currency: 'USD' },
  });
  return res.batch.id;
}

export async function addPaymentToBatch(batchId: string, params: {
  recipientId: string;
  amount: number;
  currency?: string;
  memo?: string;
}): Promise<string> {
  const res = await trolleyRequest<{ payment: { id: string } }>({
    method: 'POST',
    path:   `/v1/batches/${batchId}/payments`,
    body:   {
      recipient:    { id: params.recipientId },
      targetAmount: String(params.amount.toFixed(2)),
      targetCurrency: params.currency ?? 'USD',
      memo: params.memo ?? '',
    },
  });
  return res.payment.id;
}

export async function startBatchProcessing(batchId: string): Promise<void> {
  await trolleyRequest({
    method: 'POST',
    path:   `/v1/batches/${batchId}/start-processing`,
  });
}
