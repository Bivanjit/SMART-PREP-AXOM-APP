# SmartPrep Axom Android App

**Prepare Smarter. Perform Better.**  
Made with ❤️ in Assam.

React Native and Expo app for Assam CEE preparation.

## Backend

The app is designed to use the same Supabase project as the SmartPrep Axom website.

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Never put a Supabase secret/service-role key in the app or commit it to GitHub.
4. Configure the Supabase Auth email template to display `{{ .Token }}` for email OTP verification. Supabase's default email sender is rate-limited; use the included free allowance for development and configure a custom SMTP provider only if/when needed.
5. Keep RLS enabled. The database migration intentionally does not expose answer keys to mobile clients.

The project reference is `yydstdwknkgqelbxnvre`. The publishable key is safe for a client app; no privileged key belongs here.

## Current app foundation
- Five navigation tabs: Home, Practice, Mock Tests, Insights, Profile
- Persistent day/night theme, bookmarks and local attempt history
- Chapter catalogue for Physics, Chemistry and Mathematics
- Three original sample questions with answer explanations
- 16 planned mock-test slots with the 2026 Assam CEE format
- Support links to nsss.innovators.contact@gmail.com and @ronin837

## Run locally
```bash
npm install
npx expo start
```

## Build Android APK
```bash
npx eas-cli build --platform android --profile preview
```
Requires an Expo account. EAS free build quotas and availability apply. No APK has been built yet.

## Production status — important
This is an initial working app foundation, not a complete commercial release. It does not yet have a verified 120-question mock bank, complete live account screens, admin dashboard, payment verification, subscriptions, push notifications, offline downloads, or synchronized analytics. The database tables are ready for these features, but payment approval and membership activation are not implemented. The chapter catalogue is not a certified 2027 syllabus.

Do not market the app as complete or paid-ready until the question bank, authentication flow, backend scoring, admin tools, payment verification and Android release have been tested.
