# Payment proof cleanup schedule

This function removes proof images whose `proof_expires_at` is at least 12 hours old and then clears only `proof_path`; payment rows, payer name, UTR, transaction ID, amount, plan, status and review history remain.

After deploying the function in the intended Supabase environment:
1. Set function secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a long random `PAYMENT_PROOF_CLEANUP_SECRET`.
2. Schedule an external cron (for example, every 5 minutes) to POST to `https://<project-ref>.supabase.co/functions/v1/cleanup-payment-proofs` with header `x-cleanup-secret: <PAYMENT_PROOF_CLEANUP_SECRET>`.
3. Keep the proof bucket private. Do not expose service-role credentials in the app or browser.
4. Apply the matching database migration before enabling payment submissions with payer name and expiry fields.

The schedule is intentionally not activated by this source commit. Configure it only after the migration and function have been deployed to the target environment.
