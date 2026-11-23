import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerDevicePushToken(userId: string): Promise<() => void> {
  if (Platform.OS !== 'android' || !supabase) return () => {};

  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2563EB',
  });

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return () => {};

  const saveToken = async (token: string) => {
    const { error } = await supabase!
      .from('device_push_tokens')
      .upsert(
        { token, user_id: userId, platform: 'android', updated_at: new Date().toISOString() },
        { onConflict: 'token' },
      );
    if (error) throw error;
  };

  const initialToken = await Notifications.getDevicePushTokenAsync();
  let currentToken = String(initialToken.data);
  await saveToken(currentToken);

  const tokenSubscription = Notifications.addPushTokenListener((nextToken) => {
    const previousToken = currentToken;
    currentToken = String(nextToken.data);
    void saveToken(currentToken).then(async () => {
      if (previousToken !== currentToken) {
        const { error } = await supabase!
          .from('device_push_tokens')
          .delete()
          .eq('user_id', userId)
          .eq('token', previousToken);
        if (error) console.warn('Previous FCM token cleanup failed:', error.message);
      }
    }).catch((error) => {
      console.warn('FCM token refresh registration failed:', error);
    });
  });

  return () => {
    tokenSubscription.remove();
    void supabase!
      .from('device_push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', currentToken)
      .then(({ error }) => {
        if (error) console.warn('FCM token cleanup failed:', error.message);
      });
  };
}

export async function unregisterDevicePushToken(userId: string | null) {
  if (!userId || Platform.OS !== 'android' || !supabase) return;
  try {
    const currentToken = await Notifications.getDevicePushTokenAsync();
    const { error } = await supabase
      .from('device_push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', String(currentToken.data));
    if (error) console.warn('FCM token sign-out cleanup failed:', error.message);
  } catch (error) {
    console.warn('FCM token sign-out cleanup failed:', error);
  }
}
