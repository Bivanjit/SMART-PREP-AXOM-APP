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
        and d.session_id = coalesce(
          nullif(auth.jwt() -> 'app_metadata' ->> 'session_id', ''),
          nullif(auth.jwt() ->> 'session_id', '')
        )::uuid
    ),
    false
  );
$$;

revoke execute on function public.has_current_paid_device_binding() from public, anon;
grant execute on function public.has_current_paid_device_binding() to authenticated;
