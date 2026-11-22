# SmartPrep Axom Android App

**Prepare Smarter. Perform Better.**  
Made with ❤️ in Assam.

Expo / React Native Android app for Assam CEE preparation.

## Shared backend
The app and website use the same Supabase project: `yydstdwknkgqelbxnvre`.

- Email + password accounts (email confirmation must be disabled in Supabase Auth for the initial no-verification release).
- Live published chapters and question delivery.
- Server-side scoring through the `submit-attempt` Edge Function.
- Attempt history and performance metrics stored in Supabase.
- Student payment submission with UTR, transaction ID and proof attachment.
- Manual admin payment review; approval grants 365 days of membership.
- Public client publishable key is included in the app environment. Never put a Supabase secret/service-role key in the app, website or GitHub.

## Admin console
Open [SmartPrep Axom Admin](https://smart-axom-prep.vercel.app/admin).

First-time setup:
1. In Supabase Dashboard → Authentication → Providers → Email, turn **Confirm email** OFF for this temporary no-verification launch.
2. Open the admin page and create your admin account with email + password.
3. In Supabase SQL Editor, allowlist your exact account email:
   ```sql
   insert into public.admin_allowlist(email)
   values (lower('YOUR-ADMIN-EMAIL@example.com'))
   on conflict do nothing;
   ```
4. Sign out and sign in again. The dashboard will then load.
5. Upload questions as JSON or CSV, create and assemble the 16 mock tests, upload your payment QR and UPI details, and review student payment submissions.

Question JSON format:
```json
{
  "chapter_id": "UUID-FROM-CHAPTER-CATALOGUE",
  "prompt": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer_key": "A",
  "explanation": "Why A is correct",
  "difficulty": "medium",
  "language": "en",
  "access_tier": "free",
  "is_published": true
}
```
A full mock must have exactly 120 published questions: 40 Physics, 40 Chemistry and 40 Mathematics, 480 marks total, +4/−1 marking. Sixteen draft placeholders are already created. Upload and verify your real questions before publishing.

## Run locally
```bash
npm install
npx expo start
```

## Android build
An Android debug APK can be built using the GitHub Actions workflow **Build Android test APK** (Actions → select workflow → Run workflow). It is intended for device testing, not Play Store release. A production release needs a permanent signing keystore and release build configuration.

## Current limitations
- Question bank is intentionally empty until you upload your verified content.
- Sixteen mock tests are draft placeholders until you assign questions and publish them.
- Email confirmation is disabled only for the initial phase; add verification before public release.
- Device testing still requires a physical Android phone or emulator.
- Admin allowlist must contain your email before the dashboard can be used.
