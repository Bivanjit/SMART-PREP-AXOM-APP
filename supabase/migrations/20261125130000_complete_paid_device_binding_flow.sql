create or replace function public.claim_paid_device(
  p_user_id uuid,
  p_device_id text,
  p_platform text,
  p_session_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_user uuid;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id
     or p_session_id is null or p_device_id is null
     or length(p_device_id) < 16 or length(p_device_id) > 200 then
    return false;
  end if;

  if not exists (
    select 1 from public.memberships m
    where m.user_id = p_user_id
      and m.status = 'active'
      and m.starts_at <= now()
      and m.expires_at > now()
      and m.product_code in ('chapter_practice','cee_complete')
  ) then
    return false;
  end if;

  insert into public.paid_device_bindings(user_id,device_id,platform,session_id,bound_at,last_seen_at)
  values (p_user_id,p_device_id,case when p_platform in ('android','ios','web') then p_platform else 'unknown' end,p_session_id,now(),now())
  on conflict (user_id) do update
    set last_seen_at=now(), platform=excluded.platform, session_id=excluded.session_id
    where public.paid_device_bindings.device_id=excluded.device_id
  returning user_id into claimed_user;

  if claimed_user is null then
    return false;
  end if;

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
       || jsonb_build_object('session_id', p_session_id::text)
   where id = p_user_id;

  return found;
end;
$$;

create or replace function public.has_current_paid_device_binding()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    auth.uid() is not null
    and exists (
      select 1
      from public.paid_device_bindings d
      where d.user_id = auth.uid()
        and d.session_id = nullif(auth.jwt() -> 'app_metadata' ->> 'session_id', '')::uuid
    ),
    false
  );
$$;

revoke execute on function public.claim_paid_device(uuid,text,text,uuid) from public, anon;
grant execute on function public.claim_paid_device(uuid,text,text,uuid) to authenticated;
revoke execute on function public.has_current_paid_device_binding() from public, anon;
grant execute on function public.has_current_paid_device_binding() to authenticated;
