-- Public leaderboard avatars: keep writes owner-scoped while allowing signed-out/public leaderboard reads.
alter table public.leaderboard_profiles add column if not exists avatar_path text;
create or replace function public.smartprep_sync_profile_avatar() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 update public.leaderboard_profiles set avatar_path=new.avatar_path,updated_at=now() where user_id=new.id;
 return new;
end; $$;
drop trigger if exists profiles_sync_public_avatar on public.profiles;
create trigger profiles_sync_public_avatar after insert or update of avatar_path on public.profiles
for each row execute function public.smartprep_sync_profile_avatar();
update public.leaderboard_profiles lp set avatar_path=p.avatar_path from public.profiles p where p.id=lp.user_id and lp.avatar_path is distinct from p.avatar_path;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('student-avatars','student-avatars',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists student_avatars_public_read on storage.objects;
create policy student_avatars_public_read on storage.objects for select using(bucket_id='student-avatars');
drop policy if exists student_avatars_owner_insert on storage.objects;
create policy student_avatars_owner_insert on storage.objects for insert to authenticated
with check(bucket_id='student-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists student_avatars_owner_update on storage.objects;
create policy student_avatars_owner_update on storage.objects for update to authenticated
using(bucket_id='student-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check(bucket_id='student-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists student_avatars_owner_delete on storage.objects;
create policy student_avatars_owner_delete on storage.objects for delete to authenticated
using(bucket_id='student-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
