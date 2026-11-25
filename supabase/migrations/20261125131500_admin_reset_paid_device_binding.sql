create or replace function public.admin_reset_paid_device_binding(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed boolean := false;
begin
  if not public.is_smartprep_admin() then
    raise exception 'Admin access required';
  end if;
  delete from public.paid_device_bindings where user_id = p_user_id;
  removed := found;
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'session_id'
   where id = p_user_id;
  return removed;
end;
$$;

revoke execute on function public.admin_reset_paid_device_binding(uuid) from public, anon;
grant execute on function public.admin_reset_paid_device_binding(uuid) to authenticated;
