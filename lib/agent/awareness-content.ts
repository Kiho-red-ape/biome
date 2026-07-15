// The research-awareness ladder: six bite-sized modules, each a plain-language
// lesson + a short comprehension check that reinforces the key protective concept.
// SERVER-ONLY: quiz answer keys live here and must never be sent to the client.
// The API returns lessons + questions WITHOUT `answerIndex`; grading happens here.

export interface AwarenessQuestion {
  question: string;
  options: string[];
  answerIndex: number;   // server-only
  reinforces: string;    // the protective concept this question locks in
}

export interface AwarenessModule {
  id: string;
  order: number;
  title: string;
  summary: string;       // one-line nav summary
  lesson: string;        // plain-language lesson (markdown)
  quiz: AwarenessQuestion[];
}

export const AWARENESS_MODULES: AwarenessModule[] = [
  {
    id: 'what-is-research',
    order: 1,
    title: 'What is a research study?',
    summary: 'Observational vs interventional, what taking part involves, and that it is voluntary.',
    lesson: `A research study is a careful, planned way of answering a question about health, behaviour, or biology. Researchers follow a written plan called a **protocol** so that what they learn is trustworthy and can help other people.

There are two broad kinds:

- **Observational studies** watch and measure without changing anything. You might wear a device, give a sample, or answer questions, and the researchers simply record what they find.
- **Interventional studies** ask you to try something — a supplement, a routine, a programme — and then measure what happens.

Taking part usually means some mix of: giving samples (like saliva or a blood spot), wearing or using a device, answering surveys, or checking in at set points called **milestones**.

The most important thing to know: **participation is always voluntary.** You choose to join, and you can stop at any time. A study describes exactly what it involves *before* you decide.`,
    quiz: [
      {
        question: 'What is the main difference between an observational and an interventional study?',
        options: [
          'Observational studies pay more',
          'Observational studies only watch and measure; interventional studies ask you to try something',
          'Interventional studies are always shorter',
          'There is no real difference',
        ],
        answerIndex: 1,
        reinforces: 'study types',
      },
      {
        question: 'Is taking part in a research study something you are required to do once you sign up?',
        options: [
          'Yes, once you start you must finish',
          'No — participation is voluntary and you can stop at any time',
          'Only if you give a sample',
          'It depends on the device',
        ],
        answerIndex: 1,
        reinforces: 'voluntariness',
      },
    ],
  },
  {
    id: 'your-rights',
    order: 2,
    title: 'Your rights as a participant',
    summary: 'Voluntary, withdraw anytime without penalty, ask questions anytime, stay informed.',
    lesson: `When you take part in research, you hold a set of rights that nobody can take away:

- **It is voluntary.** No one may pressure you to join.
- **You can withdraw at any time, without penalty.** You never have to give a reason, and stopping will not be held against you or affect how you are treated.
- **You can ask questions at any time** — before, during, or after — and get clear answers.
- **You have the right to be informed.** You should always understand what a study involves before agreeing to it, and be told about anything new that might affect your choice to continue.

These rights exist to keep *you* in control. A good study makes them easy to use — for example, a clear way to pause, ask, or leave.

If you ever feel unsure or pressured, that is exactly the moment to stop and ask. Raising a concern is always welcome, never a problem.`,
    quiz: [
      {
        question: 'If you decide to withdraw from a study halfway through, what happens?',
        options: [
          'You can withdraw at any time without penalty and without giving a reason',
          'You must repay any costs',
          'You can only leave at the very end',
          'You need permission from the researcher',
        ],
        answerIndex: 0,
        reinforces: 'right to withdraw',
      },
      {
        question: 'When can you ask questions about a study?',
        options: [
          'Only before you sign up',
          'Only during milestones',
          'At any time — before, during, or after',
          'Only in writing',
        ],
        answerIndex: 2,
        reinforces: 'right to ask',
      },
    ],
  },
  {
    id: 'informed-consent',
    order: 3,
    title: 'Informed consent explained',
    summary: 'What consent means, why comprehension matters, and that you confirm understanding first.',
    lesson: `**Informed consent** is the heart of ethical research. It means you agree to take part *after* you genuinely understand what you are agreeing to — not just that you ticked a box.

"Informed" is the key word. Real consent requires that you understand:

- what the study will ask of you,
- what the possible risks and benefits are,
- what is being collected and why,
- that it is voluntary and you can withdraw.

Because understanding matters so much, before any study you will **review the study's actual consent document** and then **confirm your understanding** — often by answering a few questions about it. This is not a test to pass or fail you as a person; it makes sure the consent is truly *informed*.

Only after you have read the real document and shown you understand it will you be asked to give explicit, recorded agreement. A casual "yeah, sure" is never enough — and that protects you.`,
    quiz: [
      {
        question: 'Why do you confirm your understanding before giving consent?',
        options: [
          'To make the process longer',
          'So that consent is genuinely informed — that you understand what you agree to',
          'Because the law requires a signature only',
          'To qualify for more studies',
        ],
        answerIndex: 1,
        reinforces: 'comprehension-gated consent',
      },
      {
        question: 'Is a casual "yes" enough to count as informed consent for a study?',
        options: [
          'Yes, any agreement works',
          'No — you review the real document and confirm understanding first',
          'Only if you are over 18',
          'Only for observational studies',
        ],
        answerIndex: 1,
        reinforces: 'explicit informed agreement',
      },
    ],
  },
  {
    id: 'data-and-identity',
    order: 4,
    title: 'Your data and your identity',
    summary: 'Pseudonymisation, who sees what, identity protection, and data ownership.',
    lesson: `Protecting who you are is built into how BIOME works.

- **Pseudonymisation.** You take part under a study identity (a pseudonym and an ID), not your real name. The people running a study see your contributions tied to that pseudonym — not your personal identity.
- **Who sees what.** Access is limited by role. Researchers see the study data they need; your personal identifying details are kept separate and protected.
- **Your identity is protected.** Linking your study identity back to the real you is deliberately restricted and controlled.
- **Data ownership.** The data a study collects is owned and governed by the **study sponsor** under the study's approved plan and the law — and it must be handled for the purpose you agreed to, nothing else.

In short: you contribute as a protected, pseudonymous participant. What you share is used for the research you consented to, under rules designed to keep your identity safe.`,
    quiz: [
      {
        question: 'How do you appear to the team running a study you join?',
        options: [
          'Under your full legal name',
          'Under a pseudonym and study ID, not your real identity',
          'As an anonymous number with no record at all',
          'However you choose each day',
        ],
        answerIndex: 1,
        reinforces: 'pseudonymisation',
      },
      {
        question: 'Who governs the data a study collects, and for what use?',
        options: [
          'Anyone who asks, for any purpose',
          'The study sponsor, used only for the purpose you consented to',
          'BIOME, to sell to advertisers',
          'No one — it is deleted immediately',
        ],
        answerIndex: 1,
        reinforces: 'data ownership and purpose limitation',
      },
    ],
  },
  {
    id: 'what-to-expect',
    order: 5,
    title: 'What to expect',
    summary: 'Milestones, sample collection, communication, time commitment, and compliance.',
    lesson: `Once you join a study, here is the shape of what taking part looks like:

- **Milestones.** Studies are organised into checkpoints — for example, a weekly survey or a sample at a set time. Your dashboard shows what is due and when.
- **Sample collection.** If a study needs samples, you will get clear instructions (and often a kit). You only ever provide sample types you said you were comfortable with.
- **Communication.** You can message the research team through the study workspace, and they can share updates with you. It is fine to ask questions whenever they come up.
- **Time commitment.** A study tells you up front roughly how much time it needs and for how long, so you can decide if it fits your life.
- **Compliance.** "Compliance" just means doing the study steps you agreed to, on time. Staying on track helps the research be meaningful — and the study explains what is expected.

Knowing the rhythm in advance means there are no surprises. If something changes for you, you can always pause, ask, or withdraw.`,
    quiz: [
      {
        question: 'What does a "milestone" mean in a study?',
        options: [
          'A payment tier',
          'A checkpoint or step due at a set time, like a weekly survey or sample',
          'The end of the study only',
          'A type of device',
        ],
        answerIndex: 1,
        reinforces: 'what participation involves',
      },
      {
        question: 'Will you be asked to provide sample types you are not comfortable with?',
        options: [
          'Yes, all studies require all sample types',
          'No — you only provide sample types you said you were comfortable with',
          'Only on weekends',
          'Only if you forget a milestone',
        ],
        answerIndex: 1,
        reinforces: 'consent and comfort',
      },
    ],
  },
  {
    id: 'ethics-and-protection',
    order: 6,
    title: 'Research ethics and your protection',
    summary: 'Ethics oversight, fair treatment, reimbursement (not inducement), and raising concerns.',
    lesson: `Research is not left to run on trust alone — it is overseen to keep participants safe.

- **Ethics oversight.** Studies are reviewed by an independent ethics body (often called an **IRB** or **ethics committee**) that checks the study is fair, the risks are reasonable, and participants are protected. This review happens *before* a study can recruit.
- **Fair treatment.** You must be treated with respect throughout, and the burdens and benefits of research should be shared fairly.
- **Compensation is reimbursement, not inducement.** Where a study compensates participants, it is to **reimburse you for your time and contribution** — never a payment to tempt you into accepting risks you otherwise wouldn't. Your decision to take part should rest on understanding the study, not on money.
- **Raising concerns.** If anything feels wrong, you can raise a concern at any time — through the study workspace or BIOME — and it will be taken seriously. You will never be penalised for speaking up.

These protections are why you can take part with confidence: someone independent has checked the study, and your wellbeing comes first.`,
    quiz: [
      {
        question: 'What is the role of an IRB or ethics committee?',
        options: [
          'To advertise the study',
          'To independently review a study for fairness, reasonable risk, and participant protection before it recruits',
          'To pay participants',
          'To collect the samples',
        ],
        answerIndex: 1,
        reinforces: 'ethics oversight',
      },
      {
        question: 'How should you think about any compensation a study offers?',
        options: [
          'As a reward for taking on extra risk',
          'As reimbursement for your time and contribution — not a reason to accept risks',
          'As a salary',
          'As a prize you compete for',
        ],
        answerIndex: 1,
        reinforces: 'reimbursement not inducement',
      },
      {
        question: 'What happens if you raise a concern about a study?',
        options: [
          'You are removed and penalised',
          'It is taken seriously, and you are never penalised for speaking up',
          'Nothing — concerns are ignored',
          'You must prove it in writing first',
        ],
        answerIndex: 1,
        reinforces: 'right to raise concerns',
      },
    ],
  },
];

export const TOTAL_MODULES = AWARENESS_MODULES.length;

export function getModule(id: string): AwarenessModule | undefined {
  return AWARENESS_MODULES.find((m) => m.id === id);
}

// Grade a submission. Pass = every question correct (re-attempts are allowed),
// so comprehension of each protective concept is actually demonstrated.
export function gradeModule(
  id: string,
  answers: number[],
): { passed: boolean; score: number; total: number } | null {
  const mod = getModule(id);
  if (!mod) return null;
  let score = 0;
  mod.quiz.forEach((q, i) => {
    if (answers[i] === q.answerIndex) score += 1;
  });
  return { passed: score === mod.quiz.length, score, total: mod.quiz.length };
}

// Client-safe view: lessons + questions/options WITHOUT the answer key.
export function publicModules() {
  return AWARENESS_MODULES.map((m) => ({
    id: m.id,
    order: m.order,
    title: m.title,
    summary: m.summary,
    lesson: m.lesson,
    quiz: m.quiz.map((q) => ({ question: q.question, options: q.options })),
  }));
}
