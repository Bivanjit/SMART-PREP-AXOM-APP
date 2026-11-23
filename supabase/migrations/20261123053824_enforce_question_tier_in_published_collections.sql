drop policy if exists practice_set_questions_public_read on public.practice_set_questions;
create policy practice_set_questions_public_read on public.practice_set_questions for select to anon,authenticated
using(exists(
 select 1 from public.practice_sets s join public.questions q on q.id=practice_set_questions.question_id
 where s.id=practice_set_questions.practice_set_id and s.status='published' and q.is_published
 and (
  (s.access_tier='free' and q.access_tier='free')
  or exists(
   select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.status='active'
   and m.starts_at<=now() and m.expires_at>now() and m.product_code in ('cee_complete','chapter_practice')
  )
 )
));

drop policy if exists pyq_paper_questions_public_read on public.pyq_paper_questions;
create policy pyq_paper_questions_public_read on public.pyq_paper_questions for select to anon,authenticated
using(exists(
 select 1 from public.pyq_papers p join public.questions q on q.id=pyq_paper_questions.question_id
 where p.id=pyq_paper_questions.paper_id and p.status='published' and q.is_published
 and (
  (p.access_tier='free' and q.access_tier='free')
  or exists(
   select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.status='active'
   and m.starts_at<=now() and m.expires_at>now() and m.product_code='cee_complete'
  )
 )
));