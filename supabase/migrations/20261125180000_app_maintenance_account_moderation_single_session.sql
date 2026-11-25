-- SmartPrep Axom: maintenance controls, account moderation and one-active-session policy.
create table if not exists public.app_control_settings (
 id boolean primary key default true check(id),
 maintenance_enabled boolean not null default false,
 maintenance_title text not null default 'Maintenance break',
 maintenance_message text not null default 'SmartPrep Axom is temporarily unavailable while we make improvements. Please check back shortly.',
 maintenance_updated_at timestamptz not null default now(),
 maintenance_updated_by uuid
);
insert into public.app_control_settings(id) values(true) on conflict(id) do nothing;
alter table public.app_control_settings enable row level security;
drop policy if exists app_control_admin_all on public.app_control_settings;
create policy app_control_admin_all on public.app_control_settings for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
grant select,insert,update,delete on public.app_control_settings to authenticated;

create table if not exists public.blocked_accounts (
 id uuid primary key default gen_random_uuid(),
 email text not null unique,
 normalized_email text generated always as(lower(btrim(email))) stored,
 reason text not null default '',
 blocked_device_ids text[] not null default '{}',
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 created_by uuid,
 updated_at timestamptz not null default now()
);
create unique index if not exists blocked_accounts_normalized_email_uidx on public.blocked_accounts(normalized_email);
alter table public.blocked_accounts enable row level security;
drop policy if exists blocked_accounts_admin_only on public.blocked_accounts;
create policy blocked_accounts_admin_only on public.blocked_accounts for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
grant select,insert,update,delete on public.blocked_accounts to authenticated;

create table if not exists public.app_active_sessions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 auth_session_id uuid not null,
 installation_id text not null,
 platform text not null default 'unknown',
 last_seen_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index if not exists app_active_sessions_seen_idx on public.app_active_sessions(last_seen_at desc);
alter table public.app_active_sessions enable row level security;
drop policy if exists app_active_sessions_admin_read on public.app_active_sessions;
create policy app_active_sessions_admin_read on public.app_active_sessions for select to authenticated using(public.is_smartprep_admin());
grant select on public.app_active_sessions to authenticated;

create or replace function public.get_app_control_status()
returns jsonb language sql stable security definer set search_path=public
as $$ select jsonb_build_object('maintenance_enabled',coalesce(maintenance_enabled,false),'maintenance_title',coalesce(maintenance_title,'Maintenance break'),'maintenance_message',coalesce(maintenance_message,'SmartPrep Axom is temporarily unavailable.')) from public.app_control_settings where id=true $$;
grant execute on function public.get_app_control_status() to anon,authenticated;

create or replace function public.admin_set_maintenance(p_enabled boolean,p_title text default 'Maintenance break',p_message text default '')
returns boolean language plpgsql security definer set search_path=public
as $$
begin
 if auth.uid() is null or not public.is_smartprep_admin() then raise exception 'Admin access required'; end if;
 insert into public.app_control_settings(id,maintenance_enabled,maintenance_title,maintenance_message,maintenance_updated_at,maintenance_updated_by)
 values(true,p_enabled,left(coalesce(nullif(btrim(p_title),''),'Maintenance break'),120),left(coalesce(p_message,''),1000),now(),auth.uid())
 on conflict(id) do update set maintenance_enabled=excluded.maintenance_enabled,maintenance_title=excluded.maintenance_title,maintenance_message=excluded.maintenance_message,maintenance_updated_at=now(),maintenance_updated_by=auth.uid();
 return true;
end $$;
revoke all on function public.admin_set_maintenance(boolean,text,text) from public,anon;
grant execute on function public.admin_set_maintenance(boolean,text,text) to authenticated;

create or replace function public.register_app_session(p_installation_id text,p_platform text default 'unknown')
returns jsonb language plpgsql security definer set search_path=public,auth
as $$
declare v_uid uuid:=auth.uid(); v_sid uuid; v_email text; v_blocked boolean;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 v_sid:=nullif(auth.jwt()->>'session_id','')::uuid;
 if v_sid is null then raise exception 'Could not identify this login session. Please sign in again.'; end if;
 if p_installation_id is null or length(p_installation_id)<16 or length(p_installation_id)>128 then raise exception 'Invalid app installation identifier'; end if;
 select lower(email) into v_email from auth.users where id=v_uid;
 select exists(select 1 from public.blocked_accounts b where b.is_active and (b.normalized_email=v_email or p_installation_id=any(b.blocked_device_ids))) into v_blocked;
 if v_blocked then raise exception 'This account or app installation is restricted from SmartPrep Axom. Contact support to request a review.'; end if;
 insert into public.app_active_sessions(user_id,auth_session_id,installation_id,platform,last_seen_at,created_at)
 values(v_uid,v_sid,p_installation_id,left(coalesce(p_platform,'unknown'),30),now(),now())
 on conflict(user_id) do update set auth_session_id=excluded.auth_session_id,installation_id=excluded.installation_id,platform=excluded.platform,last_seen_at=now();
 return jsonb_build_object('active',true,'session_id',v_sid);
end $$;
revoke all on function public.register_app_session(text,text) from public,anon;
grant execute on function public.register_app_session(text,text) to authenticated;

create or replace function public.ensure_app_session(p_installation_id text,p_platform text default 'unknown')
returns jsonb language plpgsql security definer set search_path=public,auth
as $$
declare v_uid uuid:=auth.uid(); v_sid uuid; v_exists boolean;
begin
 if v_uid is null then return jsonb_build_object('allowed',false,'reason','signed_out'); end if;
 v_sid:=nullif(auth.jwt()->>'session_id','')::uuid;
 if v_sid is null then return jsonb_build_object('allowed',false,'reason','missing_session'); end if;
 insert into public.app_active_sessions(user_id,auth_session_id,installation_id,platform,last_seen_at,created_at)
 values(v_uid,v_sid,p_installation_id,left(coalesce(p_platform,'unknown'),30),now(),now()) on conflict(user_id) do nothing;
 select exists(select 1 from public.app_active_sessions where user_id=v_uid and auth_session_id=v_sid and installation_id=p_installation_id) into v_exists;
 if v_exists then update public.app_active_sessions set last_seen_at=now() where user_id=v_uid; end if;
 return jsonb_build_object('allowed',v_exists,'reason',case when v_exists then 'active' else 'signed_in_elsewhere' end);
end $$;
revoke all on function public.ensure_app_session(text,text) from public,anon;
grant execute on function public.ensure_app_session(text,text) to authenticated;

create or replace function public.check_app_session(p_installation_id text)
returns jsonb language plpgsql volatile security definer set search_path=public,auth
as $
declare v_uid uuid:=auth.uid(); v_sid uuid; v_email text; v_blocked boolean; v_current boolean;
begin
 if v_uid is null then return jsonb_build_object('authenticated',false,'allowed',false,'reason','signed_out'); end if;
 v_sid:=nullif(auth.jwt()->>'session_id','')::uuid;
 select lower(email) into v_email from auth.users where id=v_uid;
 select exists(select 1 from public.blocked_accounts b where b.is_active and (b.normalized_email=v_email or p_installation_id=any(b.blocked_device_ids))) into v_blocked;
 if v_blocked then return jsonb_build_object('authenticated',true,'allowed',false,'reason','blocked'); end if;
 select exists(select 1 from public.app_active_sessions s where s.user_id=v_uid and s.auth_session_id=v_sid and s.installation_id=p_installation_id) into v_current;
 if not v_current then return jsonb_build_object('authenticated',true,'allowed',false,'reason','signed_in_elsewhere'); end if;
 update public.app_active_sessions set last_seen_at=now() where user_id=v_uid and auth_session_id=v_sid;
 return jsonb_build_object('authenticated',true,'allowed',true);
end $$;
revoke all on function public.check_app_session(text) from public,anon;
grant execute on function public.check_app_session(text) to authenticated;

create or replace function public.admin_block_student(p_email text,p_reason text default '',p_installation_id text default null)
returns boolean language plpgsql security definer set search_path=public,auth
as $$
declare v_email text:=lower(btrim(p_email)); v_uid uuid;
begin
 if auth.uid() is null or not public.is_smartprep_admin() then raise exception 'Admin access required'; end if;
 if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+ then raise exception 'Enter a valid email address'; end if;
 select id into v_uid from auth.users where lower(email)=v_email;
 insert into public.blocked_accounts(email,reason,blocked_device_ids,created_by,is_active,updated_at)
 values(v_email,left(coalesce(p_reason,''),1000),case when p_installation_id is null or btrim(p_installation_id)='' then '{}'::text[] else array[left(btrim(p_installation_id),128)] end,auth.uid(),true,now())
 on conflict(normalized_email) do update set email=excluded.email,reason=excluded.reason,blocked_device_ids=case when p_installation_id is null or btrim(p_installation_id)='' then public.blocked_accounts.blocked_device_ids else array(select distinct x from unnest(public.blocked_accounts.blocked_device_ids||excluded.blocked_device_ids) x) end,is_active=true,updated_at=now(),created_by=auth.uid();
 if v_uid is not null then delete from public.app_active_sessions where user_id=v_uid; end if;
 return true;
end $$;
revoke all on function public.admin_block_student(text,text) from public,anon;
revoke all on function public.admin_block_student(text,text,text) from public,anon;
grant execute on function public.admin_block_student(text,text,text) to authenticated;

create or replace function public.admin_unblock_student(p_email text)
returns boolean language plpgsql security definer set search_path=public
as $$
begin
 if auth.uid() is null or not public.is_smartprep_admin() then raise exception 'Admin access required'; end if;
 update public.blocked_accounts set is_active=false,updated_at=now() where normalized_email=lower(btrim(p_email));
 return found;
end $$;
revoke all on function public.admin_unblock_student(text) from public,anon;
grant execute on function public.admin_unblock_student(text) to authenticated;

-- Prevent blocked email addresses from creating new Auth accounts.
create or replace function public.reject_blocked_email_signup()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 if exists(select 1 from public.blocked_accounts b where b.is_active and b.normalized_email=lower(btrim(new.email))) then
  raise exception 'This email address is not permitted to register. Contact SmartPrep Axom support for review.';
 end if;
 return new;
end $$;
drop trigger if exists smartprep_reject_blocked_email_signup on auth.users;
create trigger smartprep_reject_blocked_email_signup before insert or update of email on auth.users
for each row execute function public.reject_blocked_email_signup();

create or replace function public.release_app_session(p_installation_id text)
returns boolean language plpgsql security definer set search_path=public,auth
as $$
declare v_uid uuid:=auth.uid(); v_sid uuid;
begin
 if v_uid is null then return false; end if;
 v_sid:=nullif(auth.jwt()->>'session_id','')::uuid;
 delete from public.app_active_sessions where user_id=v_uid and auth_session_id=v_sid and installation_id=p_installation_id;
 return found;
end $$;
revoke all on function public.release_app_session(text) from public,anon;
grant execute on function public.release_app_session(text) to authenticated;
 then raise exception 'Enter a valid email address'; end if;
 select id into v_uid from auth.users where lower(email)=v_email;
 insert into public.blocked_accounts(email,reason,blocked_device_ids,created_by,is_active,updated_at)
 values(v_email,left(coalesce(p_reason,''),1000),case when p_installation_id is null or btrim(p_installation_id)='' then '{}'::text[] else array[left(btrim(p_installation_id),128)] end,auth.uid(),true,now())
 on conflict(normalized_email) do update set email=excluded.email,reason=excluded.reason,blocked_device_ids=case when p_installation_id is null or btrim(p_installation_id)='' then public.blocked_accounts.blocked_device_ids else array(select distinct x from unnest(public.blocked_accounts.blocked_device_ids||excluded.blocked_device_ids) x) end,is_active=true,updated_at=now(),created_by=auth.uid();
 if v_uid is not null then delete from public.app_active_sessions where user_id=v_uid; end if;
 return true;
end $$;
revoke all on function public.admin_block_student(text,text) from public,anon;
revoke all on function public.admin_block_student(text,text,text) from public,anon;
grant execute on function public.admin_block_student(text,text,text) to authenticated;

create or replace function public.admin_unblock_student(p_email text)
returns boolean language plpgsql security definer set search_path=public
as $$
begin
 if auth.uid() is null or not public.is_smartprep_admin() then raise exception 'Admin access required'; end if;
 update public.blocked_accounts set is_active=false,updated_at=now() where normalized_email=lower(btrim(p_email));
 return found;
end $$;
revoke all on function public.admin_unblock_student(text) from public,anon;
grant execute on function public.admin_unblock_student(text) to authenticated;

-- Prevent blocked email addresses from creating new Auth accounts.
create or replace function public.reject_blocked_email_signup()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 if exists(select 1 from public.blocked_accounts b where b.is_active and b.normalized_email=lower(btrim(new.email))) then
  raise exception 'This email address is not permitted to register. Contact SmartPrep Axom support for review.';
 end if;
 return new;
end $$;
drop trigger if exists smartprep_reject_blocked_email_signup on auth.users;
create trigger smartprep_reject_blocked_email_signup before insert or update of email on auth.users
for each row execute function public.reject_blocked_email_signup();

create or replace function public.release_app_session(p_installation_id text)
returns boolean language plpgsql security definer set search_path=public,auth
as $$
declare v_uid uuid:=auth.uid(); v_sid uuid;
begin
 if v_uid is null then return false; end if;
 v_sid:=nullif(auth.jwt()->>'session_id','')::uuid;
 delete from public.app_active_sessions where user_id=v_uid and auth_session_id=v_sid and installation_id=p_installation_id;
 return found;
end $$;
revoke all on function public.release_app_session(text) from public,anon;
grant execute on function public.release_app_session(text) to authenticated;
