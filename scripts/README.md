# /scripts

Tools for generating and seeding the Doomlock question bank.

## seedQuestions.ts

Seeds one batch of questions into Supabase. Run with ts-node:

```
npx ts-node --project tsconfig.scripts.json scripts/seedQuestions.ts scripts/batches/batchNN_....json
```

Pass the path to a batch JSON file as the only argument. The script reads the file,
maps each question to the Supabase `questions` table schema, and POSTs via the
PostgREST REST API (bypasses the Supabase SDK, which fails in Node 24 / ts-node).

Requires a `SUPABASE_SERVICE_KEY` environment variable for write access, or falls
back to the publishable key for read-only environments.

## /batches

21 pre-generated QA'd question batch files covering:

| Batch | Exam | Subject | Difficulty | Count |
|-------|------|---------|------------|-------|
| 01 | SAT | Math | Easy | 15 |
| 02 | SAT | Math | Medium | 20 |
| 03 | SAT | Math | Hard | 15 |
| 04 | SAT | Reading | Easy | 15 |
| 05 | SAT | Reading | Medium | 20 |
| 06 | SAT | Reading | Hard | 15 |
| 07 | SAT | Writing | Easy | 10 |
| 08 | SAT | Writing | Medium | 15 |
| 09 | SAT | Writing | Hard | 10 |
| 10 | ACT | Math | Easy | 12 |
| 11 | ACT | Math | Medium | 18 |
| 12 | ACT | Math | Hard | 12 |
| 13 | ACT | Reading | Easy | 12 |
| 14 | ACT | Reading | Medium | 18 |
| 15 | ACT | Reading | Hard | 12 |
| 16 | ACT | English | Easy | 8 |
| 17 | ACT | English | Medium | 12 |
| 18 | ACT | English | Hard | 8 |
| 19 | ACT | Science | Easy | 12 |
| 20 | ACT | Science | Medium | 18 |
| 21 | ACT | Science | Hard | 12 |

All 289 questions are already seeded in Supabase. These files are the source of truth
if the database ever needs to be rebuilt.
