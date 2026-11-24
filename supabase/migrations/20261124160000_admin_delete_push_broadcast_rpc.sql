create or replace function public.admin_delete_push_broadcast(p_notification_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer := 0;
begin
  if not public.is_smartprep_admin() then
    raise exception 'Admin access required';
  end if;
  if p_notification_ids is null or cardinality(p_notification_ids) = 0 then
    raise exception 'No notification records selected';
  end if;
  delete from public.user_notification_reads where notification_id = any(p_notification_ids);
  delete from public.user_notifications where id = any(p_notification_ids);
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
revoke all on function public.admin_delete_push_broadcast(uuid[]) from public, anon;
grant execute on function public.admin_delete_push_broadcast(uuid[]) to authenticated;