-- Final release hardening: durable signed-in test drafts and result-release metadata.
-- This migration is intentionally additive; it does not delete attempts or question content.

create table if not exists public.attempt_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  current_index integer not null default 0 check (current_index >= 0),
  started_at timestamptz not null default now(),
  deadline_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id,test_id)
);
alter table public.attempt_drafts enable row level security;
drop policy if exists "Students manage own attempt drafts" on public.attempt_drafts;
create policy "Students manage own attempt drafts"
  on public.attempt_drafts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select,insert,update,delete on public.attempt_drafts to authenticated;

alter table public.mock_tests
  add column if not exists result_release_mode text not null default 'immediate',
  add column if not exists results_published_at timestamptz,
  add column if not exists notification_sent_at timestamptz;
alter table public.mock_tests drop constraint if exists mock_tests_result_release_mode_check;
alter table public.mock_tests add constraint mock_tests_result_release_mode_check
  check (result_release_mode in ('immediate','manual'));

alter table public.attempts
  add column if not exists results_released_at timestamptz;

create index if not exists attempt_drafts_user_updated_idx
  on public.attempt_drafts(user_id,updated_at desc);
create index if not exists attempts_release_state_idx
  on public.attempts(mock_test_id,results_released_at,submitted_at desc);
