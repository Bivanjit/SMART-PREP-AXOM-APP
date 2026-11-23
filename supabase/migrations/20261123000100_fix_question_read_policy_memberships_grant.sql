-- The questions_read_free_or_entitled RLS policy checks memberships
-- to determine whether a signed-in learner has paid access. PostgreSQL
-- requires the querying role to have SELECT privilege on that table even
-- though memberships RLS limits visible rows to the caller's own membership.
-- Keep RLS enabled; this grant does not expose other users' memberships.
GRANT SELECT ON TABLE public.memberships TO anon, authenticated;
