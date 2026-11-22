import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Heading, Copy, Panel, Button } from '../components/ui';
import { sendEmailCode, signOut, verifyEmailCode } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useTheme } from './_layout';

export default function AuthScreen() {
  const { c } = useTheme();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setSignedInEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedInEmail(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function requestCode() {
    setBusy(true);
    try {
      const normalized = await sendEmailCode(email);
      setEmail(normalized);
      setSent(true);
      Alert.alert('Check your email', 'Enter the sign-in code sent to your inbox.');
    } catch (error) {
      Alert.alert('Could not send code', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode() {
    setBusy(true);
    try {
      await verifyEmailCode(email, code);
      Alert.alert('Signed in', 'Your SmartPrep account is ready.');
      router.back();
    } catch (error) {
      Alert.alert('Code not accepted', error instanceof Error ? error.message : 'Check the code and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
      setSignedInEmail(null);
    } catch (error) {
      Alert.alert('Could not sign out', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex:  1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 34, gap: 16 }}>
        <Copy>SMARTPREP AXOM ACCOUNT</Copy>
        <Heading>One account. Your preparation, synced.</Heading>
        {!supabase ? (
          <Panel><Copy>Backend configuration is missing. Add the Supabase URL and publishable key to your local environment, then restart Expo.</Copy></Panel>
        ) : signedInEmail ? (
          <Panel>
            <Copy>YOU ARE SIGNED IN AS</Copy>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{signedInEmail}</Text>
            <Button title="Sign out" onPress={handleSignOut} />
          </Panel>
        ) : (
          <Panel>
            <Copy>Sign in or create a free account using your email. We will send a one-time code.</Copy>
            <TextInput
              value={email}
              onChangeText={setEmail}
              editable={!sent && !busy}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@example.com"
              placeholderTextColor={c.muted}
              style={{ borderWidth: 1, borderColor: c.border, color: c.text, backgroundColor: c.bg, borderRadius: 12, padding: 14, fontSize: 16 }}
            />
            {sent ? (
              <>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={8}
                  placeholder="Enter email code"
                  placeholderTextColor={c.muted}
                  style={{ borderWidth: 1, borderColor: c.border, color: c.text, backgroundColor: c.bg, borderRadius: 12, padding: 14, fontSize: 16, letterSpacing: 4 }}
                />
                <Button title={busy ? 'Verifying…' : 'Verify code'} onPress={confirmCode} />
                <Button title="Use another email" onPress={() => { setSent(false); setCode(''); }} />
              </>
            ) : (
              <Button title={busy ? 'Sending…' : 'Send sign-in code'} onPress={requestCode} />
            )}
          </Panel>
        )}
        <Copy>Email OTP delivery depends on the email provider and rate limits configured in Supabase Auth.</Copy>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
