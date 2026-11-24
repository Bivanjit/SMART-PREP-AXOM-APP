-- Keep trigger-only SECURITY DEFINER functions out of the public RPC surface.
revoke execute on function public.smartprep_award_question_xp() from public,anon,authenticated;
revoke execute on function public.smartprep_award_practice_xp() from public,anon,authenticated;
revoke execute on function public.capture_student_mistake() from public,anon,authenticated;
create index if not exists question_xp_ledger_question_idx on public.question_xp_ledger(question_id);
create index if not exists student_question_history_question_idx on public.student_question_history(question_id);
create index if not exists user_achievements_achievement_idx on public.user_achievements(achievement_id);
create or replace function public.smartprep_award_question_xp()
returns trigger language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid; v_attempts integer; v_xp integer; v_repeat boolean; v_cycle timestamptz; v_name text; v_total integer; v_total_correct integer; v_chapters integer;
begin
 select user_id into v_user from public.attempts where id=new.attempt_id;
 if v_user is null or new.is_correct is null then return new; end if;
 insert into public.student_question_history(user_id,question_id,attempts_count,correct_count,last_answered_at)
 values(v_user,new.question_id,1,case when new.is_correct then 1 else 0 end,now())
 on conflict(user_id,question_id) do update set attempts_count=public.student_question_history.attempts_count+1,correct_count=public.student_question_history.correct_count+case when excluded.correct_count>0 then 1 else 0 end,last_answered_at=now()
 returning attempts_count into v_attempts;
 v_repeat:=v_attempts>1;
 v_xp:=case when new.is_correct then case when v_repeat then 10 else 50 end else case when v_repeat then 3 else 10 end end;
 insert into public.question_xp_ledger(user_id,attempt_id,question_id,xp,is_repeat) values(v_user,new.attempt_id,new.question_id,v_xp,v_repeat) on conflict(attempt_id,question_id) do nothing;
 if not found then return new; end if;
 v_cycle:=date_trunc('week',now() at time zone 'UTC') at time zone 'UTC';
 select coalesce(nullif(display_name,''),'Student') into v_name from public.profiles where id=v_user;
 insert into public.leaderboard_profiles(user_id,display_name,cycle_start,xp,league,updated_at) values(v_user,coalesce(v_name,'Student'),v_cycle,v_xp,public.smartprep_league_for_xp(v_xp),now())
 on conflict(user_id) do update set display_name=excluded.display_name,xp=case when leaderboard_profiles.cycle_start=excluded.cycle_start then leaderboard_profiles.xp+excluded.xp else excluded.xp end,cycle_start=excluded.cycle_start,league=public.smartprep_league_for_xp(case when leaderboard_profiles.cycle_start=excluded.cycle_start then leaderboard_profiles.xp+excluded.xp else excluded.xp end),updated_at=now();
 select coalesce(sum(attempts_count),0),coalesce(sum(correct_count),0) into v_total,v_total_correct from public.student_question_history where user_id=v_user;
 select count(distinct q.chapter_id) into v_chapters from public.student_question_history h join public.questions q on q.id=h.question_id where h.user_id=v_user;
 if v_total>=1 then insert into public.user_achievements(user_id,achievement_id) values(v_user,'first_answer') on conflict do nothing; end if;
 if v_total_correct>=10 then insert into public.user_achievements(user_id,achievement_id) values(v_user,'ten_correct') on conflict do nothing; end if;
 if v_total>=100 then insert into public.user_achievements(user_id,achievement_id) values(v_user,'hundred_attempts') on conflict do nothing; end if;
 if v_chapters>=5 then insert into public.user_achievements(user_id,achievement_id) values(v_user,'five_chapters') on conflict do nothing; end if;
 return new;
end; $$;
