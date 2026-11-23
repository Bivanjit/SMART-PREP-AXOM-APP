-- V2.1: scheduled, audience-aware announcements.
-- Published rows are readable by guests and signed-in students. Only admins
-- can create, edit, or remove announcements; unpublished rows stay private.
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 2000),
  audience text not null default 'all' check (audience in ('all','guest','student')),
  is_published boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_valid_window check (ends_at is null or ends_at > starts_at)
);
alter table public.announcements enable row level security;
grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
drop policy if exists announcements_read_published on public.announcements;
create policy announcements_read_published on public.announcements
for select to anon, authenticated
using (is_published = true and starts_at <= now() and (ends_at is null or ends_at > now()));
drop policy if exists announcements_admin_insert on public.announcements;
create policy announcements_admin_insert on public.announcements
for insert to authenticated
with check (public.is_smartprep_admin());
drop policy if exists announcements_admin_update on public.announcements;
create policy announcements_admin_update on public.announcements
for update to authenticated
using (public.is_smartprep_admin())
with check (public.is_smartprep_admin());
drop policy if exists announcements_admin_delete on public.announcements;
create policy announcements_admin_delete on public.announcements
for delete to authenticated
using (public.is_smartprep_admin());

