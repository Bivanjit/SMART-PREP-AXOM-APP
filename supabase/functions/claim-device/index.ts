import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,x-client-info,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });
  try {
    const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\\s+/i, "");
    const apiKey = req.headers.get("apikey") || "";
    const token = bearer && bearer !== apiKey ? bearer : "";
    if (!token) return Response.json({ error: "Sign in to use paid content." }, { status: 401, headers: cors });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) return Response.json({ error: "Your session is invalid. Please sign in again." }, { status: 401, headers: cors });
    const body = await req.json();
    const deviceId = typeof body.device_id === "string" ? body.device_id : "";
    const platform = typeof body.platform === "string" ? body.platform : "unknown";
    if (deviceId.length < 16 || deviceId.length > 200) return Response.json({ error: "A valid device identity is required." }, { status: 400, headers: cors });
    const { data: membership, error: membershipError } = await admin.from("memberships").select("id").eq("user_id", auth.user.id).eq("status", "active").lte("starts_at", new Date().toISOString()).gt("expires_at", new Date().toISOString()).in("product_code", ["chapter_practice", "cee_complete"]).limit(1).maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) return Response.json({ error: "An active paid membership is required to register this device." }, { status: 403, headers: cors });
    const { data: allowed, error } = await admin.rpc("claim_paid_device", { p_user_id: auth.user.id, p_device_id: deviceId, p_platform: platform });
    if (error) throw error;
    if (!allowed) {
      await admin.from("security_events").insert({ user_id: auth.user.id, event_type: "paid_device_conflict", severity: "warning", details: { platform }, source: "mobile_app" });
      return Response.json({ allowed: false, error: "This paid account is already linked to another device. Contact SmartPrep support to reset the device binding." }, { status: 409, headers: cors });
    }
    return Response.json({ allowed: true }, { headers: cors });
  } catch (error) {
    console.error("claim-device", error);
    return Response.json({ error: error instanceof Error ? error.message : "Could not verify this device." }, { status: 500, headers: cors });
  }
});