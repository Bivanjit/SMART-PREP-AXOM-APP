-- Account-synced notification read receipts and announcement popup dismissals.
create table if not exists public.user_notification_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_id uuid not null,
  source text not null check (source in ('notification','announcement')),
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id, source)
);
alter table public.user_notification_reads enable row level security;
grant select, insert, update on public.user_notification_reads to authenticated;
drop policy if exists user_notification_reads_select_own on public.user_notification_reads;
create policy user_notification_reads_select_own on public.user_notification_reads
for select to authenticated using (user_id = auth.uid());
drop policy if exists user_notification_reads_insert_own on public.user_notification_reads;
create policy user_notification_reads_insert_own on public.user_notification_reads
for insert to authenticated with check (user_id = auth.uid());
drop policy if exists user_notification_reads_update_own on public.user_notification_reads;
create policy user_notification_reads_update_own on public.user_notification_reads
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.user_announcement_dismissals (
  user_id uuid not null references auth.users(id) on delete cascade,
  announcement_id uuid not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, announcement_id)
);
alter table public.user_announcement_dismissals enable row level security;
grant select, insert on public.user_announcement_dismissals to authenticated;
drop policy if exists user_announcement_dismissals_select_own on public.user_announcement_dismissals;
create policy user_announcement_dismissals_select_own on public.user_announcement_dismissals
for select to authenticated using (user_id = auth.uid());
drop policy if exists user_announcement_dismissals_insert_own on public.user_announcement_dismissals;
create policy user_announcement_dismissals_insert_own on public.user_announcement_dismissals
for insert to authenticated with check (user_id = auth.uid());
