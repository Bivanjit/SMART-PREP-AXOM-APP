alter table public.payment_submissions
  drop constraint if exists payment_amount_matches_product,
  drop constraint if exists payment_submissions_amount_inr_check;

alter table public.payment_submissions
  add constraint payment_submissions_amount_positive
  check (amount_inr > 0);

comment on column public.payment_submissions.amount_inr is
  'Amount reported by the student at submission time. Historical and future plan prices are allowed; admins verify the actual transfer before activating membership.';
