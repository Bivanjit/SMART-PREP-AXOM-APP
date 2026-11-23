-- Native Android FCM tokens. A user can register multiple devices.
create table if not exists public.device_push_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'android' check (platform = 'android'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists device_push_tokens_user_idx
  on public.device_push_tokens(user_id);

alter table public.device_push_tokens enable row level security;
grant select, insert, update, delete on public.device_push_tokens to authenticated;
grant all on public.device_push_tokens to service_role;

drop policy if exists device_push_tokens_select_own on public.device_push_tokens;
create policy device_push_tokens_select_own
  on public.device_push_tokens for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists device_push_tokens_insert_own on public.device_push_tokens;
create policy device_push_tokens_insert_own
  on public.device_push_tokens for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists device_push_tokens_update_own on public.device_push_tokens;
create policy device_push_tokens_update_own
  on public.device_push_tokens for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists device_push_tokens_delete_own on public.device_push_¶»§q«^