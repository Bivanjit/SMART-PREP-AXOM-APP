drop policy if exists practice_sets_public_read on public.practice_sets;
create policy practice_sets_public_read on public.practice_sets for select to anon,authenticated
using(status='published' and (access_tier='free' or exists(
 select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.status='active'
 and m.starts_at<=now() and m.expires_at>now() and m.product_code in ('cee_complete','chapter_practice')
)));

drop policy if exists practice_set_questions_public_read on public.practice_set_questions;
create policy practice_set_questions_public_read on public.practice_set_questions for select to anon,authenticated
using(exists(
 select 1 from public.practice_sets s join public.questions q on q.id=practice_set_questions.question_id
 where s.id=practice_set_questions.practice_set_id and s.status='published' and q.is_published
 and (s.access_tier='free' or exists(
  select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.status='active'
  and m.starts_at<=now() and m.expires_at>now() and m.product_code in ('cee_complete','chapter_practice')
 ))
));

drop policy if exists batch_items_public_read on public.batch_items;
create policy batch_items_public_read on public.batch_items for select to anon,authenticated
using(is_published and exists(
 select 1 from public.batches b where b.id=batch_items.batch_id and b.status='published'
 and (b.access_tier='free' or exists(
  select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.status='active'
  and m.starts_at<=now() and m.expires_at>now() and m.product_code='cee_complete'
 ))
));

drop policy if exists batch_item_progress_own_update on public.batch_item_progress;
create policy batch_item_progress_own_update on public.batch_item_progress for update to authenticated
using(user_id=(select auth.uid()) and exists(
 select 1 from public.batch_enrollments e join public.batch_items i on i.batch_id=e.batch_id
 where e.user_id=(select auth.uid()) and e.status='enrolled' and i.id=batch_item_progress.batch_item_id
))
with check(user_id=(select auth.uid()) and exists(
 select 1 from public.batch_enrollments e join public.batch_items i on i.batch_id=e.batch_id
 where e.user_id=(select auth.uid()) and e.status='enrolled' and i.id=batch_item_progress.batch_item_id
));