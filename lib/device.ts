import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

let cachedDeviceId: string | null = null;

export async function getStableDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  const key = 'smartprep.install.device.v1';
  let id = await SecureStore.getItemAsync(key);
  if (!id) {
    const random = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    id = 'spx_' + Date.now().toString(36) + '_' + random;
    await SecureStore.setItemAsync(key, id);
  }
  cachedDeviceId = id;
  return id;
}

export function getDevicePlatform(): 'android' | 'ios' | 'web' | 'unknown' {
  return Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web'
    ? Platform.OS
    : 'unknown';
}

export async function claimPaidDevice(): Promise<void> {
  const { supabase } = await import('./supabase');
  if (!supabase) throw new Error('Account service is unavailable.');
  const device_id = await getStableDeviceId();
  const { data, error } = await supabase.functions.invoke('claim-device', {
    body: { device_id, platform: getDevicePlatform() },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (data?.allowed !== true) throw new Error('This paid account is already linked to another device. Contact SmartPrep support to reset the device binding.');
}
