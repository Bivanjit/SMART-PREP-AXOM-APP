-- SmartPrep Axom v3.6: public profile banners and 50 milestone achievements.
alter table public.profiles add column if not exists profile_banner_path text;
alter table public.leaderboard_profiles add column if not exists banner_path text;
create or replace function public.smartprep_sync_profile_banner() returns trigger language plpgsql security definer set search_path=public as $$ begin update public.leaderboard_profiles set banner_path=new.profile_banner_path,updated_at=now() where user_id=new.id; return new; end; $$;
drop trigger if exists profiles_sync_public_banner on public.profiles;
create trigger profiles_sync_public_banner after update of profile_banner_path on public.profiles for each row execute function public.smartprep_sync_profile_banner();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('profile-banners','profile-banners',true,8388608,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists profile_banners_public_read on storage.objects;
create policy profile_banners_public_read on storage.objects for select using(bucket_id='profile-banners');
drop policy if exists profile_banners_owner_insert on storage.objects;
create policy profile_banners_owner_insert on storage.objects for insert to authenticated with check(bucket_id='profile-banners' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists profile_banners_owner_update on storage.objects;
create policy profile_banners_owner_update on storage.objects for update to authenticated using(bucket_id='profile-banners' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='profile-banners' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists profile_banners_owner_delete on storage.objects;
create policy profile_banners_owner_delete on storage.objects for delete to authenticated using(bucket_id='profile-banners' and (storage.foldername(name))[1]=(select auth.uid())::text);
insert into public.achievements(id,title,description,icon,xp_reward) values
('first_answer','First Steps','Answer your first practice question','footsteps','25'),
('ten_correct','On a Roll','Get 10 questions correct','checkmark-circle','50'),
('hundred_attempts','Century Club','Answer 100 practice questions','ribbon','100'),
('attempts_10','10 Questions Attempted','Attempt 10 practice questions in total','school','10'),
('attempts_20','20 Questions Attempted','Attempt 20 practice questions in total','school','20'),
('attempts_25','25 Questions Attempted','Attempt 25 practice questions in total','school','25'),
('attempts_50','50 Questions Attempted','Attempt 50 practice questions in total','school','50'),
('attempts_75','75 Questions Attempted','Attempt 75 practice questions in total','school','75'),
('attempts_100','100 Questions Attempted','Attempt 100 practice questions in total','school','100'),
('attempts_150','150 Questions Attempted','Attempt 150 practice questions in total','school','150'),
('attempts_200','200 Questions Attempted','Attempt 200 practice questions in total','school','200'),
('attempts_250','250 Questions Attempted','Attempt 250 practice questions in total','school','250'),
('attempts_300','300 Questions Attempted','Attempt 300 practice questions in total','school','250'),
('attempts_400','400 Questions Attempted','Attempt 400 practice questions in total','school','250'),
('attempts_500','500 Questions Attempted','Attempt 500 practice questions in total','school','250'),
('attempts_750','750 Questions Attempted','Attempt 750 practice questions in total','school','250'),
('attempts_1000','1,000 Questions Attempted','Attempt 1,000 practice questions in total','school','250'),
('attempts_1250','1,250 Questions Attempted','Attempt 1,250 practice questions in total','school','250'),
('attempts_1500','1,500 Questions Attempted','Attempt 1,500 practice questions in total','school','250'),
('attempts_2000','2,000 Questions Attempted','Attempt 2,000 practice questions in total','school','250'),
('attempts_2500','2,500 Questions Attempted','Attempt 2,500 practice questions in total','school','250'),
('attempts_3000','3,000 Questions Attempted','Attempt 3,000 practice questions in total','school','250'),
('attempts_4000','4,000 Questions Attempted','Attempt 4,000 practice questions in total','school','250'),
('attempts_5000','5,000 Questions Attempted','Attempt 5,000 practice questions in total','school','250'),
('attempts_7500','7,500 Questions Attempted','Attempt 7,500 practice questions in total','school','250'),
('attempts_10000','10,000 Questions Attempted','Attempt 10,000 practice questions in total','school','250'),
('correct_5','5 Correct Answers','Answer 5 practice questions correctly','checkmark-done-circle','10'),
('correct_10','10 Correct Answers','Answer 10 practice questions correctly','checkmark-done-circle','20'),
('correct_20','20 Correct Answers','Answer 20 practice questions correctly','checkmark-done-circle','40'),
('correct_25','25 Correct Answers','Answer 25 practice questions correctly','checkmark-done-circle','50'),
('correct_50','50 Correct Answers','Answer 50 practice questions correctly','checkmark-done-circle','100'),
('correct_75','75 Correct Answers','Answer 75 practice questions correctly','checkmark-done-circle','150'),
('correct_100','100 Correct Answers','Answer 100 practice questions correctly','checkmark-done-circle','200'),
('correct_150','150 Correct Answers','Answer 150 practice questions correctly','checkmark-done-circle','300'),
('correct_200','200 Correct Answers','Answer 200 practice questions correctly','checkmark-done-circle','300'),
('correct_250','250 Correct Answers','Answer 250 practice questions correctly','checkmark-done-circle','300'),
('correct_300','300 Correct Answers','Answer 300 practice questions correctly','checkmark-done-circle','300'),
('correct_400','400 Correct Answers','Answer 400 practice questions correctly','checkmark-done-circle','300'),
('correct_500','500 Correct Answers','Answer 500 practice questions correctly','checkmark-done-circle','300'),
('correct_750','750 Correct Answers','Answer 750 practice questions correctly','checkmark-done-circle','300'),
('correct_1000','1,000 Correct Answers','Answer 1,000 practice questions correctly','checkmark-done-circle','300'),
('correct_1250','1,250 Correct Answers','Answer 1,250 practice questions correctly','checkmark-done-circle','300'),
('correct_1500','1,500 Correct Answers','Answer 1,500 practice questions correctly','checkmark-done-circle','300'),
('correct_2000','2,000 Correct Answers','Answer 2,000 practice questions correctly','checkmark-done-circle','300'),
('correct_2500','2,500 Correct Answers','Answer 2,500 practice questions correctly','checkmark-done-circle','300'),
('correct_3000','3,000 Correct Answers','Answer 3,000 practice questions correctly','checkmark-done-circle','300'),
('correct_4000','4,000 Correct Answers','Answer 4,000 practice questions correctly','checkmark-done-circle','300'),
('correct_5000','5,000 Correct Answers','Answer 5,000 practice questions correctly','checkmark-done-circle','300'),
('correct_7500','7,500 Correct Answers','Answer 7,500 practice questions correctly','checkmark-done-circle','300')
on conflict(id) do update set title=excluded.title,description=excluded.description,icon=excluded.icon,xp_reward=excluded.xp_reward;
create or replace function public.smartprep_award_milestone_achievements() returns trigger language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid; v_attempts integer; v_correct integer; v_threshold integer; v_added integer; v_reward integer;
begin
 select user_id into v_user from public.attempts where id=new.attempt_id; if v_user is null then return new; end if;
 select coalesce(sum(attempts_count),0),coalesce(sum(correct_count),0) into v_attempts,v_correct from public.student_question_history where user_id=v_user;
 foreach v_threshold in array array[10,20,25,50,75,100,150,200,250,300,400,500,750,1000,1250,1500,2000,2500,3000,4000,5000,7500,10000] loop
  if v_attempts>=v_threshold then insert into public.user_achievements(user_id,achievement_id) values(v_user,'attempts_'||v_threshold) on conflict do nothing; get diagnostics v_added=row_count;
   if v_added>0 then select xp_reward into v_reward from public.achievements where id='attempts_'||v_threshold; update public.leaderboard_profiles set xp=xp+coalesce(v_reward,0),league=public.smartprep_league_for_xp(xp+coalesce(v_reward,0)),updated_at=now() where user_id=v_user; end if; end if;
 end loop;
 foreach v_threshold in array array[5,10,20,25,50,75,100,150,200,250,300,400,500,750,1000,1250,1500,2000,2500,3000,4000,5000,7500] loop
  if v_correct>=v_threshold then insert into public.user_achievements(user_id,achievement_id) values(v_user,'correct_'||v_threshold) on conflict do nothing; get diagnostics v_added=row_count;
   if v_added>0 then select xp_reward into v_reward from public.achievements where id='correct_'||v_threshold; update public.leaderboard_profiles set xp=xp+coalesce(v_reward,0),league=public.smartprep_league_for_xp(xp+coalesce(v_reward,0)),updated_at=now() where user_id=v_user; end if; end if;
 end loop; return new;
end; $$;
drop trigger if exists zz_smartprep_milestone_achievements on public.attempt_answers;
create trigger zz_smartprep_milestone_achievements after insert on public.attempt_answers for each row execute function public.smartprep_award_milestone_achievements();
