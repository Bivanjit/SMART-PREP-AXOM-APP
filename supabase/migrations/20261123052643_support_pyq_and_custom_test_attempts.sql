alter table public.attempts drop constraint if exists attempts_source_check;
alter table public.attempts add constraint attempts_source_check check(source in ('chapter_practice','mock_test','previous_year','custom_test'));

drop policy if exists pyq_paper_questions_public_read on public.pyq_paper_questions;
create policy pyq_paper_questions_public_read on public.pyq_paper_questions for select to anon,authenticated using(
 exists(select 1 from public.pyq_papers p join public.questions q on q.id=pyq_paper_questions.question_id
 where p.id=pyq_paper_questions.paper_id and p.status='published' and q.is_published
 and (p.access_tier='free' or exists(select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.status='active' and m.starts_at<=now() and m.expires_at>now() and m.product_code='cee_complete')))
);
