create or replace function public.enroll_in_batch(p_batch_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_batch public.batches%rowtype;
  v_enrollment_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in required' using errcode='42501';
  end if;
  select * into v_batch from public.batches where id=p_batch_id and status='published';
  if not found then raise exception 'This batch is not currently published' using errcode='P0002'; end if;
  if v_batch.access_tier='premium' then
    if not exists (
      select 1 from public.memberships m
      where m.user_id=v_user_id and m.status='active' and m.starts_at<=now() and m.expires_at>now()
        and ((v_batch.slug='chapter-practice-library' and m.product_code in ('chapter_practice','cee_complete'))
          or (v_batch.slug='cee-complete-premium' and m.product_code='cee_complete')
          or (v_batch.slug not in ('chapter-practice-library','cee-complete-premium') and m.product_code='cee_complete'))
    ) then raise exception 'An active membership for this batch is required' using errcode='42501'; end if;
    if not public.has_current_paid_device_binding() then raise exception 'This device is not currently bound to your paid membership' using errcode='42501'; end if;
  end if;
  insert into public.batch_enrollments(batch_id,user_id) values (p_batch_id,v_user_id)
  on conflict (batch_id,user_id) do nothing returning id into v_enrollment_id;
  if v_enrollment_id is null then select id into v_enrollment_id from public.batch_enrollments where batch_id=p_batch_id and user_id=v_user_id; end if;
  return v_enrollment_id;
end;
$$;
revoke execute on function public.enroll_in_batch(uuid) from public, anon;
grant execute on function public.enroll_in_batch(uuid) to authenticated;