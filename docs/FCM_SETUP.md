# SmartPrep Axom â€” Direct Firebase Cloud Messaging

This implementation sends Android notifications directly through Firebase Cloud Messaging HTTP v1. It does not use Expo Push Service. The Expo notifications package is used only to request permission, obtain the native Android FCM device token, configure the notification channel, and handle taps.

## What is included

- Android google-services.json registration for com.smartprepaxom.app
- Android 13+ notification permission declaration
- Authenticated device-token registration and refresh in public.device_push_tokens
- Per-user in-app inbox records in public.user_notifications
- Admin-only send-push-notification Supabase Edge Function
- Admin Console â†’ Push notifications broadcast form
- Automatic removal of FCM tokens Firebase reports as unregistered

## One-time Firebase server credential setup

google-services.json is the Android client configuration only. It is not a server credential and cannot send notifications.

1. Open Firebase Console â†’ Project settings â†’ Service accounts.
2. Select the smartprepaxom project and generate a private key for a service account that has Firebase Cloud Messaging send permission (Firebase Cloud Messaging API Admin).
3. Keep the downloaded service-account JSON private. Do not add it to this repository, the Android app, Vercel environment variables, or the admin website.
4. In the Supabase Dashboard for the SmartPrep project, open Edge Function Secrets and add:
   - Name: FCM_SERVIC¶»§q«^