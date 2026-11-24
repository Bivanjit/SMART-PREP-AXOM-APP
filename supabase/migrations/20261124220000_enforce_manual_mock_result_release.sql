-- Enforce manual result release for full-length mocks and preserve immediate review for other tests.
alter table public.mock_tests
  alter column result_release_mode set default 'manual';

update public.mock_tests
set result_release_mode = case when test_type = 'full_length' then 'manual' else 'immediate' end
where result_release_mode is distinct from case when test_type = 'full_length' then 'manual' else 'immediate' end;

update public.attempts
set results_released_at = coalesce(submitted_at, created_at)
where results_released_at is null;

drop policy if exists attempts_select_own on public.attempts;
create policy attempts_select_own
on public.attempts
for select to authenticated
using (
  (select auth.uid()) = user_id
  and (
    mock_test_id is null
    or exists (
      select 1 from public.mock_tests mt
      where mt.id = attempts.mock_test_id
        and (mt.result_release_mode <> 'manual' or attempts.results_released_at is not null)
    )
  )
);

drop policy if exists attempt_answers_select_own on public.attempt_answers;
create policy attempt_answers_select_own
on public.attempt_answers
for select to authenticated
using (
  exists (
    select 1
    from public.attempts a
    where a.id = attempt_answers.attempt_id
      and a.user_id = (select auth.uid())
      and (
        a.mock_test_id is null
        or exists (
          select 1 from public.mock_tests mt
          where mt.id = a.mock_test_id
            and (mt.result_release_mode <> 'manual' or a.results_released_at is not null)
        )
      )
  )
);

create index if not exists attempts_manual_release_queue_idx
  on public.attempts(mock_test_id, submitted_at desc)
  where results_released_at is null;
