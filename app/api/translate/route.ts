// POST /api/translate  { text, lang: 'ta'|'hi'|'de', kind? }
// Translates participant-facing content via Claude, cached by content hash so
// each piece is translated once. For regulated content (ICF), the UI must show
// the fidelity note: the English original remains the authoritative version.

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-haiku-4-5-20251001';

const LANG_NAME: Record<string, string> = { ta: 'Tamil', hi: 'Hindi', de: 'German' };

const schema = z.object({
  text: z.string().min(1).max(24_000),
  lang: z.enum(['ta', 'hi', 'de']),
  kind: z.enum(['icf', 'lesson', 'study', 'generic']).default('generic'),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'text and lang (ta|hi|de) required' }, { status: 400 }); }

  const hash = createHash('sha256').update(body.text).digest('hex');
  const db = createServiceClient();

  // Cache hit?
  const { data: cached } = await db
    .from('content_translations')
    .select('translated')
    .eq('content_hash', hash)
    .eq('lang', body.lang)
    .maybeSingle();
  if (cached) {
    return NextResponse.json({ translated: (cached as { translated: string }).translated, cached: true });
  }

  const system =
    `You are a careful professional translator for a clinical research platform. Translate the ` +
    `user's content into ${LANG_NAME[body.lang]}. Rules: translate faithfully and completely — ` +
    `no summarising, no additions, no omissions. Use plain, everyday register a layperson ` +
    `understands. Keep proper nouns (BIOME, study names, drug/supplement names) untranslated. ` +
    `Preserve the original structure (paragraphs, lists, headings, simple HTML tags if present). ` +
    (body.kind === 'icf'
      ? `This is an informed-consent document: precision over style; never soften risk language.`
      : ``) +
    ` Return ONLY the translation.`;

  try {
    const r = await anthropic.messages.create({
      model: MODEL, max_tokens: 8000, system,
      messages: [{ role: 'user', content: body.text }],
    });
    const translated = r.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text).join('\n').trim();
    if (!translated) return NextResponse.json({ error: 'Translation failed' }, { status: 502 });

    await db.from('content_translations').upsert({
      content_hash: hash, lang: body.lang, source_kind: body.kind,
      translated, model_used: MODEL,
    }, { onConflict: 'content_hash,lang' }).then(() => undefined, () => undefined);

    return NextResponse.json({ translated, cached: false });
  } catch (err) {
    console.error('[translate]', err);
    return NextResponse.json({ error: 'Translation unavailable — please try again' }, { status: 502 });
  }
}
