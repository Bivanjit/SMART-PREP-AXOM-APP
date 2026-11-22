-- V2.3–V2.5 weekly XP, repeat-question rewards and achievement ledger.
create table if not exists public.student_question_history (
 user_id uuid not null references auth.users(id) on delete cascade,
 question_id uuid not null references public.questions(id) on delete cascade,
 attempts_count integer not null default 0,
 correct_count integer not null default 0,
 last_answered_at timestamptz not null default now(),
 primary key(user_id,question_id)
);
create table if not exists public.question_xp_ledger (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 attempt_id uuid not null references public.attempts(id) on delete cascade,
 question_id uuid not null references public.questions(id) on delete cascade,
 xp integer not null check(xp>=0),
 is_repeat boolean not null default false,
 created_at timestamptz not null default now(),
 unique(attempt_id,question_id)
);
create index if not exists question_xp_ledger_user_created_idx on public.question_xp_ledger(user_id,created_at desc);
create table if not exists public.achievements(id text primary key,title text not null,description text not null,icon text not null,xp_reward integer not null default 0);
create table if not exists public.user_achievements(
 user_id uuid not null references auth.users(id) on delete cascade,
 achievement_id text not null references public.achievements(id) on delete cascade,
 unlocked_at timestamptz not null default now(),
 primary key(user_id,achievement_id)
);
insert into public.achievements(id,title,description,icon,xp_reward) values
('first_answer','First Steps','Answer your first practice question','footsteps',25),
('ten_correct','On a Roll','Get 10 questions correct','checkmark-circle',50),
('hundred_attempts','Century Club','Answer 100 practice questions','ribbon',100)
on conflict(id) do update set title=excluded.title,description=excluded.description,icon=excluded.icon,xp_reward=excluded.xp_reward;
alter table public.student_question_history enable row level security;
alter table public.question_xp_ledger enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
drop policy if exists "read own question history" on public.student_question_history;
create policy "read own question history" on public.student_question_history for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "read own xp ledger" on public.question_xp_ledger;
create policy "read own xp ledger" on public.question_xp_ledger for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "achievements are readable" on public.achievements;
create policy "achievements are readable" on public.achievements for select to anon,authenticated using(true);
drop policy if exists "read own unlocked achievements" on public.user_achievements;
create policy "read own unlocked achievements" on public.user_achievements for select to authenticated using((select auth.uid())=user_id);
grant select on public.student_question_history,public.question_xp_ledger,public.achievements,public.user_achievements to anon,authenticated;
revoke insert,update,delete on public.student_question_history,public.question_xp_ledger,public.achievements,public.user_achievements from anon,authenticated;
create or replace function public.smartprep_league_for_xp(points integer)
returns text language sql immutable set search_path=public as $$
select case when points>=2800 then 'Legend' when points>=2000 then 'Titan' when points>=1400 then 'Master' when points>=900 then 'Champion' when points>=500 then 'Crystal' when points>=250 then 'Gold' when points>=100 then 'Silver' else 'Bronze' end;
$$;
create or replace function public.smartprep_award_question_xp()
returns trigger language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid; v_attempts integer; v_xp integer; v_repeat boolean; v_cycle timestamptz; v_name text; v_total integer; v_total_correct integer;
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
 if v_total>=1 then insert into public.user_achievements(user_id,achievement_id) values(v_user,'first_answer') on conflict do nothing; end if;
 if v_total_correct>=10 then insert into public.user_achievements(user_id,achievement_id) values(v_user,'ten_correct') on conflict do nothing; end if;
 if v_total>=100 then insert into public.user_achievements(user_id,achievement_id) values(v_user,'hundred_attempts') on conflict do nothing; end if;
 return new;
end; $$;
drop trigger if exists attempts_award_smartprep_xp on public.attempts;
drop trigger if exists attempt_answers_award_question_xp on public.attempt_answers;
create trigger attempt_answers_award_question_xp after insert on public.attempt_answers for each row execute function public.smartprep_award_question_xp();
