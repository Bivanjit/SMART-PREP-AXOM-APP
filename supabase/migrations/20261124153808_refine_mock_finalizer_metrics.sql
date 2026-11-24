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
    select id,title,test_type,result_release_mode,closes_at
    from public.mock_tests
    where test_type='full_length' and closes_at is not null and closes_at<=now()
      and status in ('published','scheduled')
    order by closes_at for update skip locked
  loop
    update public.mock_tests set status='completed',updated_at=now()
      where id=v_test.id and status in ('published','scheduled');
    v_closed:=v_closed+1;
    for v_draft in
      select id,user_id,answers,started_at,updated_at from public.attempt_drafts
      where test_id=v_test.id for update skip locked
    loop
      if exists(select 1 from public.attempts where user_id=v_draft.user_id and mock_test_id=v_test.id and submitted_at is not null) then
        delete from public.attempt_drafts where id=v_draft.id;
        continue;
      end if;
      v_score:=0;v_max_score:=0;v_correct:=0;v_wrong:=0;v_skipped:=0;v_answer_count:=0;
      for v_question in
        select mtq.question_id,mtq.marks,mtq.negative_marks,q.answer_key
        from public.mock_test_questions mtq join public.questions q on q.id=mtq.question_id
        where mtq.mock_test_id=v_test.id and q.is_published=true order by mtq.question_order
      loop
        v_answer_count:=v_answer_count+1;v_max_score:=v_max_score+v_question.marks;
        v_selected:=v_draft.answers->>v_question.question_id::text;
        if v_selected ~ '^[0-3]$' then v_selected:=chr(65+v_selected::integer);
        elsif v_selected is not null then v_selected:=upper(trim(v_selected)); end if;
        if v_selected is null or v_selected='' then
          v_marks:=0;v_is_correct:=null;v_skipped:=v_skipped+1;
        elsif v_selected=upper(trim(v_question.answer_key)) then
          v_marks:=v_question.marks;v_is_correct:=true;v_correct:=v_correct+1;
        else
          v_marks:=-v_question.negative_marks;v_is_correct:=false;v_wrong:=v_wrong+1;
        end if;
        v_score:=v_score+v_marks;
      end loop;
      if v_answer_count=0 then delete from public.attempt_drafts where id=v_draft.id;continue;end if;
      insert into public.attempts(user_id,mock_test_id,source,title,score,max_score,correct_count,wrong_count,skipped_count,started_at,submitted_at,elapsed_seconds,auto_submitted,violation_count,results_released_at)
      values(v_draft.user_id,v_test.id,'mock_test',v_test.title,v_score,v_max_score,v_correct,v_wrong,v_skipped,
        v_draft.started_at,now(),greatest(0,least(86400,floor(extract(epoch from (least(now(),v_test.closes_at)-v_draft.started_at)))::integer)),
        true,(select count(*)::integer from public.mock_test_events e where e.user_id=v_draft.user_id and e.test_id=v_test.id and e.event_type in ('app_background','focus_lost')),
        case when v_test.result_release_mode='manual' then null else now() end)
      returning id into v_attempt_id;
      insert into public.attempt_answers(attempt_id,question_id,selected_answer,is_correct,marks_awarded)
      select v_attempt_id,mtq.question_id,
        case when d.answers->>mtq.question_id::text ~ '^[0-3]$' then chr(65+(d.answers->>mtq.question_id::text)::integer)
          when nullif(trim(d.answers->>mtq.question_id::text),'') is not null then upper(trim(d.answers->>mtq.question_id::text)) else null end,
        case when nullif(trim(d.answers->>mtq.question_id::text),'') is null then null
          when (case when d.answers->>mtq.question_id::text ~ '^[0-3]$' then chr(65+(d.answers->>mtq.question_id::text)::integer) else upper(trim(d.answers->>mtq.question_id::text)) end)=upper(trim(q.answer_key)) then true else false end,
        case when nullif(trim(d.answers->>mtq.question_id::text),'') is null then 0
          when (case when d.answers->>mtq.question_id::text ~ '^[0-3]$' then chr(65+(d.answers->>mtq.question_id::text)::integer) else upper(trim(d.answers->>mtq.question_id::text)) end)=upper(trim(q.answer_key)) then mtq.marks else -mtq.negative_marks end
      from public.mock_test_questions mtq join public.questions q on q.id=mtq.question_id
      join public.attempt_drafts d on d.id=v_draft.id
      where mtq.mock_test_id=v_test.id and q.is_published=true order by mtq.question_order;
      delete from public.attempt_drafts where id=v_draft.id;v_finalized:=v_finalized+1;
    end loop;
  end loop;
  return jsonb_build_object('mocks_closed',v_closed,'drafts_finalized',v_finalized);
end;
$$;
revoke all on function public.finalize_scheduled_mock_drafts() from public,anon,authenticated;
grant execute on function public.finalize_scheduled_mock_drafts() to postgres;
