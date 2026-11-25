-- Central plan offers and immediate profile-name propagation to public leaderboards.
alter table public.product_plans
  add column if not exists offer_label text,
  add column if not exists offer_starts_at timestamptz,
  add column if not exists offer_ends_at timestamptz;

create or replace function public.smartprep_sync_leaderboard_display_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.leaderboard_profiles
     set display_name = coalesce(nullif(trim(new.display_name), ''), 'Student'),
         updated_at = now()
   where user_id = new.id;
  return new;
end;
$$;

drop trigger if exists profiles_sync_leaderboard_display_name on public.profiles;
create trigger profiles_sync_leaderboard_display_name
after insert or update of display_name on public.profiles
for each row execute function public.smartprep_sync_leaderboard_display_name();

update public.leaderboard_profiles lp
   set display_name = coalesce(nullif(trim(p.display_name), ''), 'Student'),
       updated_at = now()
  from public.profiles p
 where p.id = lp.user_id
   and lp.display_name is distinct from coalesce(nullif(trim(p.display_name), ''), 'Student');
