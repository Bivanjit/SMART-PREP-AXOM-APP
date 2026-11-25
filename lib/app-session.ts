import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';

const INSTALLATION_KEY = 'smartprep.installation-id.v1';
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
export async function getOrCreateInstallationId(): Promise<string> {
  let id = await AsyncStorage.getItem(INSTALLATION_KEY);
  if (!id) {
    id = 'spx-' + uuid() + '-' + uuid();
    await AsyncStorage.setItem(INSTALLATION_KEY, id);
  }
  return id;
}
export async function registerCurrentAppSession(client: SupabaseClient): Promise<void> {
  const installationId = await getOrCreateInstallationId();
  const { data, error } = await client.rpc('register_app_session', {
    p_installation_id: installationId,
    p_platform: Platform.OS
  });
  if (error) throw error;
  if (!data?.active) throw new Error('Could not activate this app session.');
  // Revoke refresh sessions on every other device/browser while preserving this newest login.
  const { error: revokeError } = await client.auth.signOut({ scope: 'others' });
  if (revokeError) throw revokeError;
}
export async function ensureCurrentAppSession(client: SupabaseClient): Promise<{allowed:boolean;reason?:string}> {
  const installationId = await getOrCreateInstallationId();
  const { data, error } = await client.rpc('ensure_app_session', {
    p_installation_id: installationId,
    p_platform: Platform.OS
  });
  if (error) throw error;
  return { allowed: data?.allowed === true, reason: data?.reason };
}
export async function checkCurrentAppSession(client: SupabaseClient): Promise<{allowed:boolean;reason?:string}> {
  const installationId = await getOrCreateInstallationId();
  const { data, error } = await client.rpc('check_app_session', { p_installation_id: installationId });
  if (error) throw error;
  return { allowed: data?.allowed === true, reason: data?.reason };
}

export async function releaseCurrentAppSession(client: SupabaseClient): Promise<void> {
 const installationId = await getOrCreateInstallationId();
 const { error } = await client.rpc('release_app_session', { p_installation_id: installationId });
 if (error) throw error;
}
