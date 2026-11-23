# SmartPrep Axom 3.5.2 release notes

## Included
- Pull-to-refresh on the home, profile, notifications, and membership-plan screens.
- Realtime refresh subscriptions for announcements, notifications, membership, profile, leaderboard and plan settings, with foreground/polling fallbacks.
- Full-bleed image rendering for the home hero and configurable plan banner slots.
- Android version metadata: 3.5.2 (versionCode 35200).

## Configurable plan banner settings
The app reads these keys from public.app_content_settings:
- free_plan_banner
- chapter_practice_banner
- cee_premium_banner

Each setting_value can be a public image URL string or an object with an image or url property. Storage object paths are resolved from the learning-assets bucket.

## Image guidance
- Home hero: 1200 × 360 px (10:3).
- Free / Chapter Practice / Premium plan banners: 1200 × 600 px (2:1).
- Use PNG or high-quality JPG. Keep text and logos inside the central safe area because cover-fit crops the outer edges on narrow screens.

## Release gate
Do not publish a public v3.5.2 release or announce an in-app update until the APK build and final visual QA are complete.