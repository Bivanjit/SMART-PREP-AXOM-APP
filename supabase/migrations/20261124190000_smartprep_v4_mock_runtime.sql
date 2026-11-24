-- SmartPrep Axom 4.0 scheduled mocks, anti-cheat telemetry and synced study time.
create extension if not exists pg_cron with schema pg_catalog;

alter table public.mock_tests
  add column if not exists opens_at timestamptz,
  add column if not exists closes_at timestamptz,
  add column if not exists allow_early_submission boolean not null default false,
  add column if not exists anti_cheat_enabled boolean not null default false,
  add column if not exists leaderboard_enabled boolean not null default false;

alter table public.mock_tests drop constraint if exists mock_tests_status_check;
alter table public.mock_tests add constraint mock_tests_status_check
  check (status = any (array['draft','scheduled','published','completed','archived']::text[]));

alter table public.attempts
  add column if not exists elapsed_seconds integer not null default 0,
  add column if not exists auto_submitted boolean not null default false,
  add column if not exists violation_count integer not null default 0,
  add column if not exists results_released_at timestamptz;

alter table public.attempts
  drop constraint if exists attempts_elapsed_seconds_check;
alter table public.attempts
  add constraint attempts_elapsed_seconds_check check (elapsed_seconds >= 0 and elapsed_seconds <= 86400);
alter table public.attempts
  drop constraint if exists attempts_violation_count_check;
alter table public.attempts
  add constraint attempts_violation_count_check check (violation_count >= 0 and violation_count <= 1000);

create table if not exists public.mock_test_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references public.attempts(id) on delete set null,
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type = any (array[
    'app_background','app_foreground','focus_lost','focus_restored','auto_submit','manual_submit'
  ]::text[])),
  occurred_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);
create index if not exists mock_test_events_user_test_time_idx
  on public.mock_test_events(user_id,test_id,occurred_at desc);
create index if not exists mock_test_events_attempt_idx
  on public.mock_test_events(attempt_id) where attempt_id is not null;
alter table public.mock_test_events enable row level security;
revoke all on public.mock_test_events from anon, authenticated;
grant all on public.mock_test_events to service_role;

create table if not exists public.subject_study_time (
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_key text not null check (subject_key = any (array['physics','chemistry','mathematics']::text[])),
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key(user_id,subject_key)
);
alter table public.subject_study_time enable row level security;
grant select,insert,update on public.subject_study_time to authenticated;
drop policy if exists "Students read their subject study time" on public.subject_study_time;
create policy "Students read their subject study time" on public.subject_study_time
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Students insert their subject study time" on public.subject_study_time;
create policy "Students insert their subject study time" on public.subject_study_time
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Students update their subject study time" on public.subject_study_time;
create policy "Students update their subject study time" on public.subject_study_time
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.finalize_scheduled_mock_drafts()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_test record;
  v_draft record;
  v_question record;
  v_selected text;
  v_is_correct boolean;
  v_marks numeric;
  v_score numeric;
  v_max_score numeric;
  v_correct integer;
  v_wrong integer;
  v_skipped integer;
  v_attempt_id uuid;
  v_answer_count integer;
  v_finalized integer := 0;
  v_closed integer := 0;
begin
  if not pg_try_advisory_xact_lock(hashtext('smartprep-finalize-scheduled-mocks')) then
    return jsonb_build_object('skipped',true,'reason','another finalizer is running');
  end if;

  for v_test in
    select id,title,test_type,result_release_mode
    from public.mock_tests
    where closes_at is not null and closes_at <= now()
      and status in ('published','scheduled')
    order by closes_at
    for update skip locked
  loop
    update public.mock_tests set status='completed',updated_at=now()
      where id=v_test.id and status in ('published','scheduled');
    v_closed := v_closed + 1;

    for v_draft in
      select id,user_id,answers,started_at,updated_at
      from public.attempt_drafts
      where test_id=v_test.id
      for update skip locked
    loop
      if exists (
        select 1 from public.attempts
        where user_id=v_draft.user_id and mock_test_id=v_test.id and submitted_at is not null
      ) then
        delete from public.attempt_drafts where id=v_draft.id;
        continue;
      end if;

      v_score := 0; v_max_score := 0; v_correct := 0; v_wrong := 0; v_skipped := 0; v_answer_count := 0;
      for v_question in
        select mtq.question_id,mtq.marks,mtq.negative_marks,q.answer_key,q.explanation
        from public.mock_test_questions mtq
        join public.questions q on q.id=mtq.question_id
        where mtq.mock_test_id=v_test.id and q.is_published=true
        order by mtq.question_order
      loop
        v_answer_count := v_answer_count + 1;
        v_max_score := v_max_score + v_question.marks;
        v_selected := v_draft.answers ->> v_question.question_id::text;
        if v_selected ~ '^[0-3]$' then
          v_selected := chr(65 + v_selected::integer);
        elsif v_selected is not null then
          v_selected := upper(trim(v_selected));
        end if;

        if v_selected is null or v_selected = '' then
          v_marks := 0; v_is_correct := null; v_skipped := v_skipped + 1;
        elsif v_selected = upper(trim(v_question.answer_key)) then
          v_marks := v_question.marks; v_is_correct := true; v_correct := v_correct + 1;
        else
          v_marks := -v_question.negative_marks; v_is_correct := false; v_wrong := v_wrong + 1;
        end if;
        v_score := v_score + v_marks;
      end loop;

      if v_answer_count = 0 then
        delete from public.attempt_drafts where id=v_draft.id;
        continue;
      end if;

      insert into public.attempts(
        user_id,mock_test_id,source,title,score,max_score,correct_count,wrong_count,skipped_count,
        started_at,submitted_at,elapsed_seconds,auto_submitted,violation_count,results_released_at
      ) values (
        v_draft.user_id,v_test.id,'mock_test',v_test.title,v_score,v_max_score,v_correct,v_wrong,v_skipped,
        v_draft.started_at,now(),greatest(0,least(86400,floor(extract(epoch from (now()-v_draft.started_at)))::integer)),
        true,0,case when v_test.test_type='full_length' and v_test.result_release_mode='manual' then null else now() end
      ) returning id into v_attempt_id;

      insert into public.attempt_answers(attempt_id,question_id,selected_answer,is_correct,marks_awarded)
      select v_attempt_id,mtq.question_id,
        case
          when d.answers ->> mtq.question_id::text ~ '^[0-3]$'
            then chr(65 + (d.answers ->> mtq.question_id::text)::integer)
          when nullif(trim(d.answers ->> mtq.question_id::text),'') is not null
            then upper(trim(d.answers ->> mtq.question_id::text))
          else null
        end,
        case
          when nullif(trim(d.answers ->> mtq.question_id::text),'') is null then null
          when (case when d.answers ->> mtq.question_id::text ~ '^[0-3]$'
            then chr(65 + (d.answers ->> mtq.question_id::text)::integer)
            else upper(trim(d.answers ->> mtq.question_id::text)) end) = upper(trim(q.answer_key)) then true
          else false
        end,
        case
          when nullif(trim(d.answers ->> mtq.question_id::text),'') is null then 0
          when (case when d.answers ->> mtq.question_id::text ~ '^[0-3]$'
            then chr(65 + (d.answers ->> mtq.question_id::text)::integer)
            else upper(trim(d.answers ->> mtq.question_id::text)) end) = upper(trim(q.answer_key) then mtq.marks
          else -mtq.negative_marks
        end
      from public.mock_test_questions mtq
      join public.questions q on q.id=mtq.question_id
      join public.attempt_drafts d on d.id=v_draft.id
      where mtq.mock_test_id=v_test.id and q.is_published=true
      order by mtq.question_order;

      delete from public.attempt_drafts where id=v_draft.id;
      v_finalized := v_finalized + 1;
    end loop;
  end loop;
  return jsonb_build_object('mocks_closed',v_closed,'drafts_finalized',v_finalized);
end;
$$;

revoke all on function public.finalize_scheduled_mock_drafts() from public,anon,authenticated;
grant execute on function public.finalize_scheduled_mock_drafts() to postgres;

select cron.unschedule(jobid) from cron.job where jobname='smartprep-finalize-scheduled-mocks';
select cron.schedule(
  'smartprep-finalize-scheduled-mocks',
  '* * * * *',
  'select public.finalize_scheduled_mock_drafts();'
);
