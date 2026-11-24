-- Seed editable templates only. All batch and PYQ records remain drafts until verified content is assigned and published.
insert into public.batches(slug,title,subtitle,description,access_tier,status,subject_label,syllabus_summary,display_order)
values
('assam-cee-2027-foundation','Assam CEE 2027 Foundation Batch','Complete syllabus · Classes · Practice sets','Structured foundation programme for the complete Assam CEE syllabus. Add modules, lessons, chapter links and practice sets in the admin console before publishing.','free','draft','Physics · Chemistry · Mathematics','Complete syllabus, classes and practice sets',1),
('assam-cee-2027-crash-course','Assam CEE 2027 Crash Course','High-value revision · PYQs · Mock tests','Focused revision programme. Add revision lessons, PYQ papers and mock tests in the admin console before publishing.','premium','draft','Physics · Chemistry · Mathematics','Revision classes, PYQs and mock tests',2),
('chapter-wise-concept-series','Chapter Wise Concept Series','In-depth concepts · Practice sets','Chapter-by-chapter concept series. Add lectures and practice sets in the admin console before publishing.','premium','draft','Physics · Chemistry · Mathematics','In-depth concepts and practice sets',3)
on conflict(slug) do update set title=excluded.title,subtitle=excluded.subtitle,description=excluded.description,access_tier=excluded.access_tier,subject_label=excluded.subject_label,syllabus_summary=excluded.syllabus_summary,display_order=excluded.display_order,updated_at=now();

insert into public.pyq_papers(title,exam_name,exam_year,description,duration_minutes,total_marks,access_tier,status,display_order)
select 'Assam CEE '||y||' Previous Year Paper','Assam CEE',y,'Draft archive entry. Admin: attach verified paper questions and publish when ready.',180,480,'free','draft',2026-y
from generate_series(2018,2026) y
on conflict(exam_name,exam_year) do nothing;

insert into public.product_plans(product_code,title,description,price_inr,compare_at_price_inr,duration_days,access_tier,is_active,display_order)
values('cee_complete','SmartPrep Premium','Complete Assam CEE preparation access',999,1999,365,'premium',true,1)
on conflict(product_code) do update set title=excluded.title,description=excluded.description,price_inr=excluded.price_inr,compare_at_price_inr=excluded.compare_at_price_inr,duration_days=excluded.duration_days,access_tier=excluded.access_tier,is_active=excluded.is_active,updated_at=now();

insert into public.product_plan_benefits(plan_id,benefit_text,icon,display_order,is_active)
select p.id,b.benefit,'check-circle',b.ord,true from public.product_plans p
cross join (values (1,'All Video Lectures (Full Access)'),(2,'All Mock Tests & Test Series'),(3,'Previous Year Questions (PYQs)'),(4,'Advanced Practice & Analytics'),(5,'Ad-free Learning Experience')) as b(ord,benefit)
where p.product_code='cee_complete'
on conflict(plan_id,display_order) do update set benefit_text=excluded.benefit_text,icon=excluded.icon,is_active=true;

insert into public.app_content_settings(setting_key,setting_value,is_public)
values
('home_hero','{"title":"Assam CEE","year":"2027","description":"Complete preparation for Physics, Chemistry & Mathematics.","image":"https://commons.wikimedia.org/wiki/Special:FilePath/A_Tea_Garden_of_Assam.jpg?width=1400"}'::jsonb,true),
('premium_offer','{"product_code":"cee_complete","headline":"Upgrade to SmartPrep Premium","description":"Unlock the complete Assam CEE preparation experience.","cta":"Upgrade Now","dismissible":true}'::jsonb,true)
on conflict(setting_key) do update set setting_value=excluded.setting_value,is_public=excluded.is_public,updated_at=now();

drop policy if exists batch_enrollments_premium_enroll on public.batch_enrollments;
create policy batch_enrollments_premium_enroll on public.batch_enrollments for insert to authenticated with check(
 (select auth.uid())=user_id
 and exists(select 1 from public.batches b where b.id=batch_enrollments.batch_id and b.status='published' and b.access_tier='premium')
 and exists(select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.status='active' and m.starts_at<=now() and m.expires_at>now() and m.product_code='cee_complete')
);
