-- SmartPrep Axom complete redesign content model.
-- Additive only: existing user, question, attempt, payment and XP records remain intact.
create table if not exists public.topics (
 id uuid primary key default gen_random_uuid(), chapter_id uuid not null references public.chapters(id) on delete cascade,
 slug text not null, name text not null check(char_length(trim(name)) between 1 and 140), description text,
 display_order integer not null default 0, is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(chapter_id,slug)
);
alter table public.questions
 add column if not exists topic_id uuid references public.topics(id) on delete set null,
 add column if not exists source_type text not null default 'practice',
 add column if not exists source_year integer,
 add column if not exists source_exam text,
 add column if not exists source_question_number integer,
 add column if not exists source_reference text,
 add column if not exists question_image_path text,
 add column if not exists tags text[] not null default '{}';
alter table public.questions drop constraint if exists questions_source_type_check;
alter table public.questions add constraint questions_source_type_check check(source_type in ('practice','pyq','sample','school_exam'));
alter table public.questions drop constraint if exists questions_source_year_check;
alter table public.questions add constraint questions_source_year_check check(source_year is null or source_year between 2000 and 2100);

create table if not exists public.pyq_papers (
 id uuid primary key default gen_random_uuid(), title text not null, exam_name text not null default 'Assam CEE',
 exam_year integer not null check(exam_year between 2000 and 2100), description text,
 duration_minutes integer not null default 180 check(duration_minutes>0), total_marks integer not null default 480 check(total_marks>0),
 access_tier text not null default 'free' check(access_tier in ('free','premium')),
 status text not null default 'draft' check(status in ('draft','scheduled','published','archived')),
 paper_file_path text, display_order integer not null default 0, published_at timestamptz,
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(exam_name,exam_year)
);
create table if not exists public.pyq_paper_questions (
 paper_id uuid not null references public.pyq_papers(id) on delete cascade,
 question_id uuid not null references public.questions(id) on delete cascade,
 question_order integer not null check(question_order>0), marks integer not null default 4,
 negative_marks numeric(5,2) not null default 1, primary key(paper_id,question_id), unique(paper_id,question_order)
);
create table if not exists public.practice_sets (
 id uuid primary key default gen_random_uuid(), title text not null, description text,
 set_type text not null check(set_type in ('mixed','custom','topic','chapter','pyq')),
 subject_id uuid references public.subjects(id) on delete set null,
 chapter_id uuid references public.chapters(id) on delete set null,
 topic_id uuid references public.topics(id) on delete set null,
 language text not null default 'en' check(language in ('en','as')),
 access_tier text not null default 'free' check(access_tier in ('free','premium')),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 duration_minutes integer check(duration_minutes is null or duration_minutes>0),
 display_order integer not null default 0, created_by uuid references auth.users(id) on delete set null,
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.practice_set_questions (
 practice_set_id uuid not null references public.practice_sets(id) on delete cascade,
 question_id uuid not null references public.questions(id) on delete cascade,
 question_order integer not null check(question_order>0),
 primary key(practice_set_id,question_id), unique(practice_set_id,question_order)
);
alter table public.mock_tests
 add column if not exists test_type text not null default 'full_length',
 add column if not exists subject_id uuid references public.subjects(id) on delete set null,
 add column if not exists chapter_id uuid references public.chapters(id) on delete set null,
 add column if not exists pyq_paper_id uuid references public.pyq_papers(id) on delete set null,
 add column if not exists instructions text, add column if not exists cover_image_path text,
 add column if not exists display_order integer not null default 0,
 add column if not exists updated_at timestamptz not null default now(),
 add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.mock_tests drop constraint if exists mock_tests_test_type_check;
alter table public.mock_tests add constraint mock_tests_test_type_check check(test_type in ('full_length','subject_wise','chapter','previous_year','custom'));

create table if not exists public.batches (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, subtitle text, description text,
 access_tier text not null default 'free' check(access_tier in ('free','premium')),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 cover_image_path text, subject_label text, syllabus_summary text, starts_at timestamptz, ends_at timestamptz,
 display_order integer not null default 0, created_by uuid references auth.users(id) on delete set null,
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.batch_items (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references public.batches(id) on delete cascade,
 title text not null, description text, item_type text not null check(item_type in ('chapter','lecture','practice_set','mock_test','pyq_paper')),
 chapter_id uuid references public.chapters(id) on delete set null, lecture_id uuid references public.lectures(id) on delete set null,
 practice_set_id uuid references public.practice_sets(id) on delete set null, mock_test_id uuid references public.mock_tests(id) on delete set null,
 pyq_paper_id uuid references public.pyq_papers(id) on delete set null, is_required boolean not null default false,
 display_order integer not null default 0, is_published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint batch_item_target_check check(
  (item_type='chapter' and chapter_id is not null and lecture_id is null and practice_set_id is null and mock_test_id is null and pyq_paper_id is null) or
  (item_type='lecture' and lecture_id is not null and chapter_id is null and practice_set_id is null and mock_test_id is null and pyq_paper_id is null) or
  (item_type='practice_set' and practice_set_id is not null and chapter_id is null and lecture_id is null and mock_test_id is null and pyq_paper_id is null) or
  (item_type='mock_test' and mock_test_id is not null and chapter_id is null and lecture_id is null and practice_set_id is null and pyq_paper_id is null) or
  (item_type='pyq_paper' and pyq_paper_id is not null and chapter_id is null and lecture_id is null and practice_set_id is null and mock_test_id is null)
 )
);
create table if not exists public.batch_enrollments (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references public.batches(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'enrolled' check(status in ('enrolled','completed','cancelled')),
 enrolled_at timestamptz not null default now(), completed_at timestamptz, unique(batch_id,user_id)
);
create table if not exists public.batch_item_progress (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 batch_item_id uuid not null references public.batch_items(id) on delete cascade,
 progress_percent numeric(5,2) not null default 0 check(progress_percent between 0 and 100),
 last_position_seconds integer not null default 0 check(last_position_seconds>=0),
 completed_at timestamptz, updated_at timestamptz not null default now(), unique(user_id,batch_item_id)
);
create table if not exists public.lecture_progress (
 user_id uuid not null references auth.users(id) on delete cascade, lecture_id uuid not null references public.lectures(id) on delete cascade,
 position_seconds integer not null default 0 check(position_seconds>=0), duration_seconds integer not null default 0 check(duration_seconds>=0),
 completed_at timestamptz, updated_at timestamptz not null default now(), primary key(user_id,lecture_id)
);
create table if not exists public.product_plans (
 id uuid primary key default gen_random_uuid(), product_code text not null unique, title text not null, description text,
 price_inr integer not null check(price_inr>=0), compare_at_price_inr integer check(compare_at_price_inr is null or compare_at_price_inr>=price_inr),
 duration_days integer not null default 365 check(duration_days>0), access_tier text not null default 'premium' check(access_tier in ('free','premium')),
 is_active boolean not null default false, display_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.product_plan_benefits (
 id uuid primary key default gen_random_uuid(), plan_id uuid not null references public.product_plans(id) on delete cascade,
 benefit_text text not null, icon text not null default 'check-circle', display_order integer not null default 0,
 is_active boolean not null default true, unique(plan_id,display_order)
);
create table if not exists public.app_content_settings (
 setting_key text primary key, setting_value jsonb not null default '{}'::jsonb, is_public boolean not null default true,
 updated_by uuid references auth.users(id) on delete set null, updated_at timestamptz not null default now()
);
create table if not exists public.content_audit_logs (
 id uuid primary key default gen_random_uuid(), admin_user_id uuid references auth.users(id) on delete set null,
 action text not null, entity_type text not null, entity_id text, changes jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create index if not exists topics_chapter_order_idx on public.topics(chapter_id,display_order) where is_active;
create index if not exists questions_topic_idx on public.questions(topic_id) where is_published;
create index if not exists questions_pyq_year_idx on public.questions(source_year,source_exam) where is_published and source_type='pyq';
create index if not exists pyq_papers_year_idx on public.pyq_papers(exam_year desc) where status='published';
create index if not exists practice_sets_filter_idx on public.practice_sets(set_type,access_tier,display_order) where status='published';
create index if not exists batches_catalogue_idx on public.batches(access_tier,display_order) where status='published';
create index if not exists batch_items_order_idx on public.batch_items(batch_id,display_order) where is_published;
create index if not exists batch_enrollments_user_idx on public.batch_enrollments(user_id,status);
create index if not exists batch_item_progress_user_idx on public.batch_item_progress(user_id,batch_item_id);
create index if not exists lecture_progress_user_idx on public.lecture_progress(user_id,updated_at desc);
create index if not exists mock_tests_category_idx on public.mock_tests(test_type,access_tier,display_order) where status='published';

do $$ declare t text; begin
 foreach t in array array['topics','pyq_papers','pyq_paper_questions','practice_sets','practice_set_questions','batches','batch_items','batch_enrollments','batch_item_progress','lecture_progress','product_plans','product_plan_benefits','app_content_settings','content_audit_logs'] loop
  execute format('alter table public.%I enable row level security',t);
 end loop;
end $$;
grant select on public.topics,public.pyq_papers,public.pyq_paper_questions,public.practice_sets,public.practice_set_questions,public.batches,public.batch_items,public.product_plans,public.product_plan_benefits,public.app_content_settings to anon,authenticated;
grant select,insert,update,delete on public.topics,public.pyq_papers,public.pyq_paper_questions,public.practice_sets,public.practice_set_questions,public.batches,public.batch_items,public.product_plans,public.product_plan_benefits,public.app_content_settings,public.content_audit_logs to authenticated;
grant select,insert,update on public.batch_enrollments,public.batch_item_progress,public.lecture_progress to authenticated;

create policy topics_public_read on public.topics for select to anon,authenticated using(is_active);
create policy topics_admin_all on public.topics for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy pyq_papers_public_read on public.pyq_papers for select to anon,authenticated using(status='published');
create policy pyq_papers_admin_all on public.pyq_papers for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy pyq_paper_questions_public_read on public.pyq_paper_questions for select to anon,authenticated using(exists(select 1 from public.pyq_papers p join public.questions q on q.id=pyq_paper_questions.question_id where p.id=pyq_paper_questions.paper_id and p.status='published' and q.is_published));
create policy pyq_paper_questions_admin_all on public.pyq_paper_questions for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy practice_sets_public_read on public.practice_sets for select to anon,authenticated using(status='published');
create policy practice_sets_admin_all on public.practice_sets for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy practice_set_questions_public_read on public.practice_set_questions for select to anon,authenticated using(exists(select 1 from public.practice_sets s join public.questions q on q.id=practice_set_questions.question_id where s.id=practice_set_questions.practice_set_id and s.status='published' and q.is_published));
create policy practice_set_questions_admin_all on public.practice_set_questions for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy batches_public_read on public.batches for select to anon,authenticated using(status='published');
create policy batches_admin_all on public.batches for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy batch_items_public_read on public.batch_items for select to anon,authenticated using(is_published and exists(select 1 from public.batches b where b.id=batch_items.batch_id and b.status='published'));
create policy batch_items_admin_all on public.batch_items for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy batch_enrollments_own_read on public.batch_enrollments for select to authenticated using((select auth.uid())=user_id);
create policy batch_enrollments_free_enroll on public.batch_enrollments for insert to authenticated with check((select auth.uid())=user_id and exists(select 1 from public.batches b where b.id=batch_enrollments.batch_id and b.status='published' and b.access_tier='free'));
create policy batch_enrollments_admin_all on public.batch_enrollments for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy batch_item_progress_own_read on public.batch_item_progress for select to authenticated using((select auth.uid())=user_id);
create policy batch_item_progress_own_insert on public.batch_item_progress for insert to authenticated with check((select auth.uid())=user_id and exists(select 1 from public.batch_enrollments e join public.batch_items i on i.batch_id=e.batch_id where e.user_id=(select auth.uid()) and e.status='enrolled' and i.id=batch_item_progress.batch_item_id));
create policy batch_item_progress_own_update on public.batch_item_progress for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy batch_item_progress_admin_all on public.batch_item_progress for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy lecture_progress_own_all on public.lecture_progress for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy product_plans_public_read on public.product_plans for select to anon,authenticated using(is_active);
create policy product_plans_admin_all on public.product_plans for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy product_plan_benefits_public_read on public.product_plan_benefits for select to anon,authenticated using(is_active and exists(select 1 from public.product_plans p where p.id=product_plan_benefits.plan_id and p.is_active));
create policy product_plan_benefits_admin_all on public.product_plan_benefits for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy app_content_settings_public_read on public.app_content_settings for select to anon,authenticated using(is_public);
create policy app_content_settings_admin_all on public.app_content_settings for all to authenticated using(public.is_smartprep_admin()) with check(public.is_smartprep_admin());
create policy content_audit_logs_admin_read on public.content_audit_logs for select to authenticated using(public.is_smartprep_admin());
create policy content_audit_logs_admin_insert on public.content_audit_logs for insert to authenticated with check(public.is_smartprep_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('learning-assets','learning-assets',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy learning_assets_public_read on storage.objects for select to anon,authenticated using(bucket_id='learning-assets');
create policy learning_assets_admin_insert on storage.objects for insert to authenticated with check(bucket_id='learning-assets' and public.is_smartprep_admin());
create policy learning_assets_admin_update on storage.objects for update to authenticated using(bucket_id='learning-assets' and public.is_smartprep_admin()) with check(bucket_id='learning-assets' and public.is_smartprep_admin());
create policy learning_assets_admin_delete on storage.objects for delete to authenticated using(bucket_id='learning-assets' and public.is_smartprep_admin());
