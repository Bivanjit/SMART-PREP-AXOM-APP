import { supabase } from './supabase';
import { unregisterDevicePushToken } from './push-notifications';

export async function sendEmailCode(email: string) {
  if (!supabase) throw new Error('The app backend is not configured yet.');
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter a valid email address.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
  return normalizedEmail;
}

export async function verifyEmailCode(email: string, token: string) {
  if (!supabase) throw new Error('The app backend is not configured yet.');
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email',
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  await unregisterDevicePushToken(user?.id ?? null);
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
