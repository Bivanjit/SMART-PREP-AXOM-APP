# SmartPrep Axom Android App

**Prepare Smarter. Perform Better.**  
Made with ❤️ in Assam.

React Native and Expo app for Assam CEE preparation.

## Current build
- Five navigation tabs: Home, Practice, Mock Tests, Insights, Profile
- Persistent day/night theme
- Chapter catalogue for Physics, Chemistry and Mathematics
- Three original sample questions with answer explanations
- 16 planned mock-test slots with the 2026 Assam CEE format
- Support links to nsss.innovators.contact@gmail.com and @ronin837
- Touch feedback and native stack transitions

## Run locally
```bash
npm install
npx expo start
```

## Build Android APK
```bash
npx eas-cli build --platform android --profile preview
```
Requires an Expo account and Android signing setup. No APK has been built yet.

## Production status — important
This is an **initial working app foundation**, not the complete commercial release. It does not yet have a verified 120-question mock bank, real accounts, backend, admin dashboard, payment verification, subscriptions, push notifications, offline downloads, or synchronized analytics. Those must be implemented and tested before the app can be sold or described as complete. The chapter catalogue is not a certified 2027 syllabus.

The temporary icon is derived from the supplied SmartPrep artwork at low resolution; replace with the supplied 512×512 asset before publishing.

## Planned architecture
Expo Router / React Native / TypeScript for Android; Supabase Auth and PostgreSQL for account and content services; server-enforced entitlements and private storage; a separate admin portal. Do not put service-role secrets or payment-verification logic in the app.
