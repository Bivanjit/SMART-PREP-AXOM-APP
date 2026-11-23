import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
    shouldShowBanner: true, shouldShowList: true,
  }),
});
function openNotification(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, unknown>;
  const route = typeof data?.route === 'string' ? data.route : '/(tabs)';
  if (route.startsWith('/') && !route.startsWith('//')) router.push(route as never);
  else router.push('/(tabs)');
}
let tokenSubscription: Notifications.Subscription | null = null;
let responseSubscription: Notifications.Subscription | null = null;
let authSubscription: { unsubscribe: () => void } | null = null;
let registeredUserId: string | null = null;
export async function unregisterDevicePushToken(userId: string | null) {
  tokenSubscription?.remove(); tokenSubscription = null; registeredUserId = null;
  if (!supabase || !userId) return;
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    await supabase.from('device_push_tokens').delete().eq('token', String(token.data)).eq('user_id', userId);
  } catch (error) { console.warn('Push token cleanup failed:', error); }
}
export async function registerDevicePushToken(userId: string): Promise<void> {
  if (Platform.OS !== 'android' || !supabase || registeredUserId === userId) return;
  try {
    await Notifications.setNotificationChannelAsync('default', { name: 'SmartPrep notifications', importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0,250,250,250], lightColor: '#2563EB' });
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return;
    const saveToken = async (token: string) => {
      const { error } = await supabase!.from('device_push_tokens').upsert({ token, user_id: userId, platform: 'android', updated_at: new Date().toISOString() }, { onConflict: 'token' });
      if (error) throw error;
    };
    const token = await Notifications.getDevicePushTokenAsync();
    await saveToken(String(token.data)); registeredUserId = userId;
    tokenSubscription?.remove();
    tokenSubscription = Notifications.addPushTokenListener(next => { void saveToken(String(next.data)).catch(error => console.warn('FCM token refresh failed:', error)); });
  } catch (error) { console.warn('Push registration failed; app remains usable:', error); }
}
export function initializePushNotifications() {
  if (!supabase || authSubscription) return;
  responseSubscription?.remove();
  responseSubscription = Notifications.addNotificationResponseReceivedListener(openNotification);
  void Notifications.getLastNotificationResponseAsync().then(response => { if (response) openNotification(response); }).catch(() => {});
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    const userId = session?.user?.id ?? null;
    if (!userId) { const previousUserId = registeredUserId; void unregisterDevicePushToken(previousUserId); return; }
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
      setTimeout(() => { void registerDevicePushToken(userId); }, 0);
    }
  });
  authSubscription = data.subscription;
}
