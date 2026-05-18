import fs from 'fs';

const SUPABASE_URL = 'https://qarrsjolwnhmoqtcikmc.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  'sb_publishable_9YrgiTYL2ay2Jbp6Z0tDLw_BbpL2r1N';

const REST_URL = `${SUPABASE_URL}/rest/v1/questions`;
const HEADERS = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Prefer: 'return=minimal',
};

interface QuestionInput {
  exam: string;
  subject: string;
  skill: string;
  difficulty: string;
  passage: string | null;
  question: string;
  choices: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
  distractor_rationale: { A: string; B: string; C: string; D: string };
}

function loadQuestions(): QuestionInput[] {
  const batchFile = process.argv[2];
  if (!batchFile) {
    console.error('Usage: ts-node scripts/seedQuestions.ts <batch.json>');
    process.exit(1);
  }
  const raw = fs.readFileSync(batchFile, 'utf-8');
  return JSON.parse(raw) as QuestionInput[];
}

function toRow(q: QuestionInput) {
  return {
    exam: q.exam,
    subject: q.subject,
    skill: q.skill,
    difficulty: q.difficulty.toLowerCase(),
    passage: q.passage,
    question_text: q.question,
    option_a: q.choices.A,
    option_b: q.choices.B,
    option_c: q.choices.C,
    option_d: q.choices.D,
    correct_answer: q.correct.toLowerCase(),
    explanation: q.explanation,
    distractor_rationale: q.distractor_rationale,
  };
}

async function seed(): Promise<void> {
  const questions = loadQuestions();
  console.log(`Seeding ${questions.length} questions...\n`);
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const label = `[${i + 1}/${questions.length}] ${q.exam} ${q.subject} — ${q.skill} (${q.difficulty})`;

    try {
      const res = await fetch(REST_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(toRow(q)),
      });

      if (res.ok || res.status === 201) {
        console.log(`✓ ${label}`);
        passed++;
      } else {
        const body = await res.text();
        console.error(`✗ ${label}`);
        console.error(`  → HTTP ${res.status}: ${body}`);
        failed++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${label}`);
      console.error(`  → ${msg}`);
      failed++;
    }
  }

  console.log(`\nResult: ${passed} inserted, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

seed();
