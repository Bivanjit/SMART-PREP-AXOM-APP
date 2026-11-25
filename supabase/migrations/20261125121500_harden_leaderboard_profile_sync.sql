create or replace function public.smartprep_sync_leaderboard_display_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.leaderboard_profiles
     set display_name = coalesce(nullif(trim(new.display_name), ''), 'Student'),
         updated_at = now()
   where user_id = new.id;
  return new;
end;
$$;

revoke execute on function public.smartprep_sync_leaderboard_display_name() from public, anon, authenticated;
