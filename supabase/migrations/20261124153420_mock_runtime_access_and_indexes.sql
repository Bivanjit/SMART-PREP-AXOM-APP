-- Keep telemetry inaccessible to students while documenting the service-role-only access path.
drop policy if exists "Service role manages mock telemetry" on public.mock_test_events;
create policy "Service role manages mock telemetry"
  on public.mock_test_events for all to service_role
  using (true) with check (true);

create index if not exists attempts_mock_leaderboard_idx
  on public.attempts(mock_test_id,score desc,elapsed_seconds asc,submitted_at asc)
  where submitted_at is not null and results_released_at is not null;
create index if not exists mock_tests_closes_at_idx
  on public.mock_tests(closes_at)
  where closes_at is not null;
