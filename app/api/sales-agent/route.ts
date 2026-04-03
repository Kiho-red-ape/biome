import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase/server';
import { SALES_AGENT_SYSTEM_PROMPT } from '@/lib/agents/sales-agent-prompt';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function verifyAdmin(privyDid: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', privyDid)
    .single();
  return data?.is_admin === true;
}

type MessageParam = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  const body = await req.json() as { privyDid?: string; messages?: MessageParam[] };
  const { privyDid, messages } = body;

  if (!privyDid) {
    return new Response(JSON.stringify({ error: 'privyDid required' }), { status: 400 });
  }
  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 });
  }

  const isAdmin = await verifyAdmin(privyDid);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500 });
  }

  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: SALES_AGENT_SYSTEM_PROMPT,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(new TextEncoder().encode(event.delta.text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
