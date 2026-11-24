-- SmartPrep Axom 4.0.0: per-student study time and scheduled mock controls.
create table if not exists public.subject_study_time (
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_key text not null check (subject_key in ('physics','chemistry','mathematics')),
  elapsed_seconds bigint not null default 0 check (elapsed_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_key)
);
alter table public.subject_study_time enable row level security;
drop policy if exists subject_study_time_own on public.subject_study_time;
create policy subject_study_time_own on public.subject_study_time
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
grant select, insert, update on public.subject_study_time to authenticated;

alter table public.mock_tests
  add column if not exists opens_at timestamptz,
  add column if not exists closes_at timestamptz,
  add column if not exists allow_early_submission boolean not null default false,
  add column if not exists leaderboard_enabled boolean not null default true,
  add column if not exists anti_cheat_enabled boolean not null default true;

alter table public.attempts
  add column if not exists elapsed_seconds integer not null default 0,
  add column if not exists auto_submitted boolean not null default false,
  add column if not exists violation_count integer not null default 0,
  add column if not exists last_violation_at timestamptz;

create table if not exists public.mock_test_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('app_background','app_foreground','focus_lost','focus_restored','auto_submit','manual_submit')),
  occurred_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);
alter table public.mock_test_events enable row level security;
drop policy if exists mock_test_events_own_read on public.mock_test_events;
create policy mock_test_events_own_read on public.mock_test_events
for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.mock_test_events to authenticated;

create index if not exists mock_tests_schedule_idx on public.mock_tests(status,opens_at,closes_at);
create index if not exists attempts_mock_rank_idx on public.attempts(mock_test_id,score desc,elapsed_seconds asc) where submitted_at is not null;
