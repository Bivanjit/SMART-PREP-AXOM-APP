-- Payment proof retention and payer identity.
-- Apply through the reviewed Supabase migration workflow; this file is not auto-applied.
alter table public.payment_submissions
  add column if not exists payer_name text,
  add column if not exists proof_expires_at timestamptz;

update public.payment_submissions
set proof_expires_at = submitted_at + interval '12 hours'
where proof_path is not null and proof_expires_at is null;

create index if not exists payment_submissions_proof_expiry_idx
  on public.payment_submissions (proof_expires_at)
  where proof_path is not null;

comment on column public.payment_submissions.payer_name is
  'Name of the bank account holder who made the payment; retained with payment history.';
comment on column public.payment_submissions.proof_expires_at is
  'Scheduled deletion time for the private proof image; payment metadata remains.';
