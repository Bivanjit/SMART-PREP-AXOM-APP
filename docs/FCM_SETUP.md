# SmartPrep Axom — Direct Firebase Cloud Messaging

This implementation sends Android notifications directly through Firebase Cloud Messaging HTTP v1. It does not use Expo Push Service. The Expo notifications package is used only to request permission, obtain the native Android FCM device token, configure the notification channel, and handle taps.

## What is included

- Android google-services.json registration for com.smartprepaxom.app
- Android 13+ notification permission declaration
- Authenticated device-token registration and refresh in public.device_push_tokens
- Per-user in-app inbox records in public.user_notifications
- Admin-only send-push-notification Supabase Edge Function
- Admin Console → Push notifications broadcast form
- Automatic removal of FCM tokens Firebase reports as unregistered

## One-time Firebase server credential setup

google-services.json is the Android client configuration only. It is not a server credential and cannot send notifications.

1. Open Firebase Console → Project settings → Service accounts.
2. Select the smartprepaxom project and generate a private key for a service account that has Firebase Cloud Messaging send permission (Firebase Cloud Messaging API Admin).
3. Keep the downloaded service-account JSON private. Do not add it to this repository, the Android app, Vercel environment variables, or the admin website.
4. In the Supabase Dashboard for the SmartPrep project, open Edge Function Secrets and add:
   - Name: FCM_SERVICE_ACCOUNT_JSON
   - Value: the complete contents of the Firebase service-account JSON file
5. Confirm the Firebase Cloud Messaging API is enabled for the project.

The function also uses Supabase's built-in URL, publishable key, and secret key environment variables. The secret key is only read inside the Edge Function.

## Supabase deployment (not performed automatically)

Apply the migration:

supabase/migrations/20261123150000_add_fcm_push_notifications.sql

Deploy supabase/functions/send-push-notification with JWT verification enabled (verify_jwt = true). The function validates the signed-in user and checks public.is_smartprep_admin() before using its service-role client.

## Android release requirement

FCM uses native Android Firebase configuration. The app must be rebuilt with this configuration before devices can obtain native FCM tokens. Existing installed APKs cannot gain native Firebase configuration through a JavaScript-only update.

After a new FCM-enabled APK is installed, students must sign in and grant notification permission. Their Android device token is then registered automatically. The admin broadcast tab will report the number of successful and failed device sends.

## Scope

Android is enabled in this release. iOS requires APNs credentials in Firebase and separate device validation before enabling iOS token registration and delivery.
