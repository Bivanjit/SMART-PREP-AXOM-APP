-- Permit authenticated event recording through the Edge Function before an attempt exists.
alter table public.mock_test_events alter column attempt_id drop not null;
alter table public.mock_test_events add column if not exists test_id uuid references public.mock_tests(id) on delete cascade;
create index if not exists mock_test_events_user_test_time_idx on public.mock_test_events(user_id,test_id,occurred_at desc);
