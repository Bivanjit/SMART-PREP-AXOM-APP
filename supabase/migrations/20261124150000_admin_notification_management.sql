drop policy if exists user_notifications_admin_select on public.user_notifications;
create policy user_notifications_admin_select
on public.user_notifications
for select to authenticated
using (public.is_smartprep_admin());

drop policy if exists user_notifications_admin_delete on public.user_notifications;
create policy user_notifications_admin_delete
on public.user_notifications
for delete to authenticated
using (public.is_smartprep_admin());

drop policy if exists user_notification_reads_admin_delete on public.user_notification_reads;
create policy user_notification_reads_admin_delete
on public.user_notification_reads
for delete to authenticated
using (public.is_smartprep_admin());