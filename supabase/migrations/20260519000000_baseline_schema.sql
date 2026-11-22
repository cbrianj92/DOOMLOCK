-- Doomlock baseline schema
-- Captured from the live Supabase project (qarrsjolwnhmoqtcikmc) on 2026-11-22.
-- This was originally created by hand in the Supabase SQL editor (May 2026);
-- it is recorded here so the repo is the source of truth.
-- Question content is NOT here: it is seeded from scripts/batches/*.json
-- via `npm run seed` (289 questions).

create extension if not exists pgcrypto;

-- ─── Questions ────────────────────────────────────────────────────────────

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null check (correct_answer in ('a', 'b', 'c', 'd')),
  explanation text not null,
  created_at timestamptz default now(),
  exam text not null,
  skill text,
  passage text,
  distractor_rationale jsonb
);

create index questions_subject_idx on public.questions using btree (subject);

alter table public.questions enable row level security;

create policy "Authenticated users can read questions"
  on public.questions for select
  to anon, authenticated
  using (true);

-- Returns one random question, optionally filtered by difficulty
create or replace function public.get_random_question(p_difficulty text default null)
returns setof public.questions
language sql
as $$
  select * from questions
  where (p_difficulty is null or difficulty = p_difficulty)
  order by random()
  limit 1;
$$;

-- ─── Users (cohort assignment for beta tests) ─────────────────────────────

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  cohort character(1) not null check (cohort in ('A', 'B', 'C')),
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can insert own row"
  on public.users for insert
  to public
  with check (auth.uid() = id);

create policy "Users can read own row"
  on public.users for select
  to public
  using (auth.uid() = id);

-- ─── Progress (one row per answered question) ─────────────────────────────

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  is_correct boolean not null,
  answered_at timestamptz default now(),
  unlock_duration_granted integer not null,
  difficulty_rating text check (difficulty_rating in ('too_easy', 'just_right', 'too_hard'))
);

create index progress_user_id_idx on public.progress using btree (user_id);

alter table public.progress enable row level security;

create policy "Users can insert own progress"
  on public.progress for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own progress"
  on public.progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.progress for update
  to public
  using (auth.uid() = user_id);

-- ─── Session log (how the user entered the app) ───────────────────────────

create table public.session_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_start timestamptz default now(),
  entry_point text not null check (entry_point in ('overlay_triggered', 'direct_open', 'direct_practice'))
);

alter table public.session_log enable row level security;

create policy "Users can insert own sessions"
  on public.session_log for insert
  to public
  with check (auth.uid() = user_id);

-- ─── Pro demand signal (taps on Pro-gated features) ───────────────────────

create table public.pro_feature_taps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature_name text not null,
  tapped_at timestamptz default now()
);

alter table public.pro_feature_taps enable row level security;

create policy "Users can insert own taps"
  on public.pro_feature_taps for insert
  to public
  with check (auth.uid() = user_id);

-- ─── Question flags (user-reported bad questions) ─────────────────────────

create table public.question_flags (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.question_flags enable row level security;

create policy "Users can insert their own flags"
  on public.question_flags for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─── Account deletion requests (fallback for in-app deletion) ─────────────

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  email text,
  requested_at timestamptz default now(),
  status text default 'pending'
);

alter table public.deletion_requests enable row level security;

create policy "Users can insert own deletion request"
  on public.deletion_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─── Beta signups (landing page form) ─────────────────────────────────────

create table public.beta_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null,
  created_at timestamptz not null default now()
);

alter table public.beta_signups enable row level security;

create policy "Allow public insert"
  on public.beta_signups for insert
  to anon
  with check (true);
