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
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = header + '.' + claims;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(serviceAccount.private_key.replace(/\\n/g, '\n')),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)));
  const assertion = unsigned + '.' + base64Url(signature);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error('Google OAuth failed: ' + (result.error_description || result.error || response.status));
  return result.access_token as string;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authorization = request.headers.get('Authorization') || '';
    const jwt = authorization.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Missing bearer token' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || defaultKeyFromEnv('SUPABASE_PUBLISHABLE_KEYS');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || defaultKeyFromEnv('SUPABASE_SECRET_KEYS');
    const serviceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON');
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !serviceAccountJson) {
      return json({ error: 'Push delivery is not configured. Add FCM_SERVICE_ACCOUNT_JSON to Supabase secrets.' }, 503);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      'global': { headers: { Authorization: 'Bearer ' + jwt } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
    if (userError || !userData.user) return json({ error: 'Invalid or expired session' }, 401);
    const { data: isAdmin, error: adminError } = await userClient.rpc('is_smartprep_admin');
    if (adminError || isAdmin !== true) return json({ error: 'Admin access required' }, 403);

    const payload = await request.json();
    const title = String(payload.title || '').trim();
    const body = String(payload.body || '').trim();
    const actionPath = payload.action_path ? String(payload.action_path).trim() : null;
    if (!title || title.length > 100 || !body || body.length > 1000 || (actionPath && actionPath.length > 300)) {
      return json({ error: 'Title (1–100 chars), message (1–1000 chars), or action path is invalid.' }, 400);
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    if (serviceAccount.project_id !== 'smartprepaxom') {
      return json({ error: 'The configured Firebase service account does not belong to the SmartPrep Axom project.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: devices, error: devicesError } = await adminClient
      .from('device_push_tokens')
      .select('token,user_id')
      .eq('platform', 'android');
    if (devicesError) throw devicesError;
    if (!devices?.length) return json({ sent: 0, failed: 0, recipients: 0, total: 0, message: 'No Android devices have registered for push notifications yet.' });

    const userIds = [...new Set(devices.map((device: { user_id: string }) => device.user_id))];
    // Validate the Firebase service-account key before writing inbox records.
    const accessToken = await getFcmAccessToken(serviceAccount);
    const endpoint = 'https://fcm.googleapis.com/v1/projects/' + serviceAccount.project_id + '/messages:send';
    const inboxRows = userIds.map((userId) => ({
      user_id: userId,
      category: 'system',
      title,
      body,
      action_path: actionPath,
    }));
    const { error: inboxError } = await adminClient.from('user_notifications').insert(inboxRows);
    if (inboxError) throw new Error('Could not write the in-app notification inbox: ' + inboxError.message);

    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];
    const deviceRows = devices as Array<{ token: string; user_id: string }>;

    // Bound concurrency to avoid overwhelming FCM or the Edge Function runtime.
    for (let offset = 0; offset < deviceRows.length; offset += 20) {
      const batch = deviceRows.slice(offset, offset + 20);
      const results = await Promise.all(batch.map(async (device) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: device.token,
              notification: { title, body },
              android: {
                priority: 'HIGH',
                notification: { channel_id: 'default', sound: 'default' },
              },
              data: actionPath ? { action_path: actionPath } : {},
            },
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok) return { ok: true, invalid: false };
        const errorText = JSON.stringify(result);
        const invalid = errorText.includes('UNREGISTERED') || errorText.includes('registration-token-not-registered');
        console.error('FCM delivery failed:', response.status, result.error?.status || result.error?.message || 'unknown');
        return { ok: false, invalid, token: device.token };
      }));
      for (const result of results) {
        if (result.ok) sent += 1;
        else failed += 1;
        if (!result.ok && result.invalid && result.token) invalidTokens.push(result.token);
      }
    }

    if (invalidTokens.length) {
      await adminClient.from('device_push_tokens').delete().in('token', invalidTokens);
    }

    return json({
      sent,
      failed,
      recipients: userIds.length,
      total: devices.length,
      invalidTokensRemoved: invalidTokens.length,
    });
  } catch (error) {
    console.error('send-push-notification failed:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected push delivery error' }, 500);
  }
});
