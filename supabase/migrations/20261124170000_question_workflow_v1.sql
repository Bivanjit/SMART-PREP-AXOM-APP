-- Question workflow v1: allow private Chapter Test Set pools.
-- Existing practice sets and question links are preserved.
alter table public.practice_sets drop constraint if exists practice_sets_set_type_check;
alter table public.practice_sets add constraint practice_sets_set_type_check
  check (set_type in ('mixed','custom','topic','chapter','chapter_test','pyq'));

alter table public.practice_sets add column if not exists notification_sent_at timestamptz;

alter table public.mock_tests
  add column if not exists result_release_mode text not null default 'immediate'
    check (result_release_mode in ('immediate','manual')),
  add column if not exists results_published_at timestamptz,
  add column if not exists notification_sent_at timestamptz;

create index if not exists practice_sets_chapter_type_status_idx
  on public.practice_sets(chapter_id,set_type,status);
create index if not exists mock_tests_result_release_idx
  on public.mock_tests(result_release_mode,status,results_published_at);
