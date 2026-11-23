import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function base64Url(input: Uint8Array | string) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function pemToBytes(pem: string) {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s/g, '');
  const binary = atob(body);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function defaultKeyFromEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed.default || null;
  } catch {
    return value;
  }
}

async function getFcmAccessToken(serviceAccount: Record<string, string>) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: serviceAcco¶»§q«^