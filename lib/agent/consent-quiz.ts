// Generates a comprehension quiz from a study's actual IRB-approved consent
// document (ICF). Built once per ICF version and cached in the consent
// conversation so the same questions are graded consistently and the audit
// trail is reproducible. Uses the stronger model — this is the regulated core.

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

export interface ConsentQuizQuestion {
  question: string;
  options: string[];     // exactly 4
  answerIndex: number;    // server-only
  concept: string;        // which protective point it checks
}

const QUIZ_TOOL: Anthropic.Tool = {
  name: 'consent_quiz',
  description: 'A comprehension quiz drawn strictly from the provided consent document.',
  input_schema: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question:    { type: 'string' },
            options:     { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
            answerIndex: { type: 'integer', minimum: 0, maximum: 3 },
            concept:     { type: 'string', description: 'risks | voluntariness | data_collected | right_to_withdraw | time_commitment' },
          },
          required: ['question', 'options', 'answerIndex', 'concept'],
        },
        minItems: 5,
        maxItems: 5,
      },
    },
    required: ['questions'],
  },
};

const SYSTEM = `You write comprehension checks for informed consent. You are given the FULL text of a
study's IRB-approved Informed Consent Form (ICF). Produce EXACTLY 5 multiple-choice questions, each
with EXACTLY 4 options and one correct answer, that verify the participant actually understood the
key protective points of THIS document:
1. the main risks/discomforts described,
2. that participation is voluntary,
3. what data/samples are collected,
4. the right to withdraw at any time,
5. the time commitment / what is required.
Rules: draw every question and answer ONLY from the document's actual content — never invent facts
not in the text. Make wrong options plausible but clearly incorrect per the document. Plain language.
Return via the consent_quiz tool.`;

// Strip HTML to plain text so the model reads the document, not markup.
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16000);
}

export async function generateConsentQuiz(icfHtml: string): Promise<ConsentQuizQuestion[]> {
  const text = htmlToText(icfHtml);
  const response = await anthropic.messages.create({
    model:       MODEL,
    max_tokens:  2000,
    system:      SYSTEM,
    messages:    [{ role: 'user', content: `Consent document:\n\n${text}` }],
    tools:       [QUIZ_TOOL],
    tool_choice: { type: 'tool', name: 'consent_quiz' },
  });

  const block = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
  const input = block?.input as { questions?: ConsentQuizQuestion[] } | undefined;
  const questions = input?.questions ?? [];

  // Defensive validation: keep only well-formed 4-option questions.
  return questions
    .filter((q) => q && Array.isArray(q.options) && q.options.length === 4 &&
                   typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex <= 3)
    .slice(0, 5);
}
