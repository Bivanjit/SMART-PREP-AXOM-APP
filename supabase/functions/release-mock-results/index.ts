import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });
  try {
    const authorization = req.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) return Response.json({ error: "Sign in required." }, { status: 401, headers: cors });
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return Response.json({ error: "Invalid session." }, { status: 401, headers: cors });
    const { data: isAdmin, error: adminError } = await userClient.rpc("is_smartprep_admin");
    if (adminError || isAdmin !== true) return Response.json({ error: "Admin access required." }, { status: 403, headers: cors });

    const body = await req.json();
    const attemptId = typeof body.attempt_id === "string" ? body.attempt_id : "";
    if (!attemptId) return Response.json({ error: "attempt_id is required." }, { status: 400, headers: cors });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: attempt, error: attemptError } = await admin.from("attempts")
      .select("id,user_id,mock_test_id,results_released_at,mock_tests!inner(id,title,test_type,result_release_mode)")
      .eq("id", attemptId).maybeSingle();
    if (attemptError || !attempt) return Response.json({ error: "Attempt not found." }, { status: 404, headers: cors });
    const test = Array.isArray(attempt.mock_tests) ? attempt.mock_tests[0] : attempt.mock_tests;
    if (!test || test.test_type !== "full_length" || test.result_release_mode !== "manual") {
      return Response.json({ error: "Only full-length mock results use manual release." }, { status: 400, headers: cors });
    }
    const releasedAt = attempt.results_released_at || new Date().toISOString();
    if (!attempt.results_released_at) {
      const { data: updated, error: updateError } = await admin.from("attempts")
        .update({ results_released_at: releasedAt }).eq("id", attemptId).is("results_released_at", null).select("id").maybeSingle();
      if (updateError) throw updateError;
      if (!updated) return Response.json({ error: "Result was released concurrently. Retry to verify its notification." }, { status: 409, headers: cors });
    }
    // Use the production-supported notification category and repair a missed notification on retry.
    const actionPath = "/results?attemptId=" + attemptId;
    const { data: existingNotification, error: existingError } = await admin.from("user_notifications").select("id").eq("user_id", attempt.user_id).eq("action_path", actionPath).maybeSingle();
    if (existingError) throw existingError;
    if (!existingNotification) {
      const { error: notificationError } = await admin.from("user_notifications").insert({
      user_id: attempt.user_id,
      category: "system",
      title: "Your mock test result is ready",
      body: "Your " + test.title + " result has been reviewed and released. Tap to view your score and explanations.",
      action_path: actionPath
      });
      if (notificationError) throw notificationError;
    }
    return Response.json({ released: true, attempt_id: attemptId, released_at: releasedAt }, { headers: cors });
  } catch (error) {
    console.error("release-mock-results", error);
    return Response.json({ error: error instanceof Error ? error.message : "Could not release result." }, { status: 500, headers: cors });
  }
});
