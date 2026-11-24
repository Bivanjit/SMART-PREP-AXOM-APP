-- Complete scheduled full-length mocks on the database clock, even if every student closes the app.
create extension if not exists pg_cron with schema pg_catalog;

alter table public.mock_tests drop constraint if exists mock_tests_status_check;
alter table public.mock_tests add constraint mock_tests_status_check
  check (status in ('draft','scheduled','published','completed','archived'));

create schema if not exists private;
create or replace function private.finalize_due_scheduled_mocks()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d record;
  new_attempt_id uuid;
  totals record;
  finalized integer := 0;
begin
  for d in
    select ad.id as draft_id,ad.user_id,ad.test_id,ad.answers,ad.started_at,
           mt.title,mt.closes_at,mt.result_release_mode
    from public.attempt_drafts ad
    join public.mock_tests mt on mt.id=ad.test_id
    where mt.test_type='full_length'
      and mt.closes_at is not null and mt.closes_at<=now()
      and mt.status in ('published','scheduled')
    order by mt.closes_at
    for update of ad skip locked
  loop
    if exists(select 1 from public.attempts a where a.user_id=d.user_id and a.mock_test_id=d.test_id and a.submitted_at is not null) then
      delete from public.attempt_drafts where id=d.draft_id;
      continue;
    end if;

    select
      count(*)::integer as total,
      count(*) filter(where picked.selected_answer is not null and upper(picked.selected_answer)=upper(q.answer_key))::integer as correct,
      count(*) filter(where picked.selected_answer is not null and upper(picked.selected_answer)<>upper(q.answer_key))::integer as wrong,
      count(*) filter(where picked.selected_answer is null)::integer as skipped,
      coalesce(sum(case when picked.selected_answer is null then 0
        when upper(picked.selected_answer)=upper(q.answer_key) then mtq.marks
        else -mtq.negative_marks end),0)::numeric as score,
      coalesce(sum(mtq.marks),0)::numeric as max_score
    into totals
    from public.mock_test_questions mtq
    join public.questions q on q.id=mtq.question_id and q.is_published=true
    cross join lateral (
      select case
        when d.answers->>mtq.question_id::text is null then null
        when d.answers->>mtq.question_id::text ~ '^[0-3]$'
          then chr(65+(d.answers->>mtq.question_id::text)::integer)
        else upper(d.answers->>mtq.question_id::text)
      end as selected_answer
    ) picked
    where mtq.mock_test_id=d.test_id;

    if coalesce(totals.total,0)=0 then
      delete from public.attempt_drafts where id=d.draft_id;
      continue;
    end if;

    insert into public.attempts(
      user_id,mock_test_id,source,title,score,max_score,correct_count,wrong_count,skipped_count,
      started_at,submitted_at,elapsed_seconds,auto_submitted,violation_count,results_released_at
    ) values (
      d.user_id,d.test_id,'mock_test',d.title,totals.score,totals.max_score,totals.correct,totals.wrong,totals.skipped,
      d.started_at,now(),greatest(0,least(86400,extract(epoch from (least(now(),d.closes_at)-d.started_at))::integer)),
      true,
      (select count(*)::integer from public.mock_test_events e where e.user_id=d.user_id and e.test_id=d.test_id and e.event_type='app_background'),
      now()
    ) returning id into new_attempt_id;

    insert into public.attempt_answers(attempt_id,question_id,selected_answer,is_correct,marks_awarded)
    select new_attempt_id,mtq.question_id,picked.selected_answer,
      case when picked.selected_answer is null then null else upper(picked.selected_answer)=upper(q.answer_key) end,
      case when picked.selected_answer is null then 0
        when upper(picked.selected_answer)=upper(q.answer_key) then mtq.marks
        else -mtq.negative_marks end
    from public.mock_test_questions mtq
    join public.questions q on q.id=mtq.question_id and q.is_published=true
    cross join lateral (
      select case
        when d.answers->>mtq.question_id::text is null then null
        when d.answers->>mtq.question_id::text ~ '^[0-3]$'
          then chr(65+(d.answers->>mtq.question_id::text)::integer)
        else upper(d.answers->>mtq.question_id::text)
      end as selected_answer
    ) picked
    where mtq.mock_test_id=d.test_id;

    delete from public.attempt_drafts where id=d.draft_id;
    finalized:=finalized+1;
  end loop;

  update public.mock_tests
  set status='completed',updated_at=now()
  where test_type='full_length' and status in ('published','scheduled')
    and closes_at is not null and closes_at<=now();

  return finalized;
end;
$$;
revoke all on function private.finalize_due_scheduled_mocks() from public,anon,authenticated;

select cron.schedule(
  'smartprep-finalize-scheduled-mocks',
  '* * * * *',
  'select private.finalize_due_scheduled_mocks();'
);
