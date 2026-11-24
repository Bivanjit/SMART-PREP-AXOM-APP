import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
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
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return Response.json({ error: "Invalid session." }, { status: 401, headers: cors });
    const body = await req.json();
    const attemptId = typeof body.attempt_id === "string" ? body.attempt_id : "";
    if (!attemptId) return Response.json({ error: "attempt_id is required." }, { status: 400, headers: cors });
    const { data: isAdmin } = await userClient.rpc("is_smartprep_admin");
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: attempt, error: attemptError } = await admin.from("attempts")
      .select("id,user_id,title,score,max_score,correct_count,wrong_count,skipped_count,submitted_at,results_released_at,mock_test_id,mock_tests(test_type,result_release_mode)")
      .eq("id", attemptId).maybeSingle();
    if (attemptError || !attempt) return Response.json({ error: "Attempt not found." }, { status: 404, headers: cors });
    const isOwner = attempt.user_id === authData.user.id;
    if (!isOwner && isAdmin !== true) return Response.json({ error: "Not allowed." }, { status: 403, headers: cors });
    const test = Array.isArray(attempt.mock_tests) ? attempt.mock_tests[0] : attempt.mock_tests;
    const locked = test?.test_type === "full_length" && test?.result_release_mode === "manual" && !attempt.results_released_at;
    if (locked && isAdmin !== true) return Response.json({ locked: true, attempt_id: attempt.id, title: attempt.title }, { headers: cors });
    const { data: rows, error: rowsError } = await admin.from("attempt_answers")
      .select("question_id,selected_answer,is_correct,marks_awarded,questions(prompt,options,answer_key,explanation)")
      .eq("attempt_id", attemptId);
    if (rowsError) throw rowsError;
    return Response.json({
      locked: false, attempt_id: attempt.id, title: attempt.title, score: attempt.score, max_score: attempt.max_score,
      correct: attempt.correct_count, wrong: attempt.wrong_count, skipped: attempt.skipped_count,
      submitted_at: attempt.submitted_at,
      answers: (rows || []).map((row: any) => {
        const q = Array.isArray(row.questions) ? row.questions[0] : row.questions;
        return { question_id: row.question_id, selected_answer: row.selected_answer, is_correct: row.is_correct,
          marks_awarded: row.marks_awarded, prompt: q?.prompt, options: q?.options,
          correct_answer: q?.answer_key, explanation: q?.explanation };
      })
    }, { headers: cors });
  } catch (error) {
    console.error("get-attempt-result", error);
    return Response.json({ error: error instanceof Error ? error.message : "Could not load result." }, { status: 500, headers: cors });
  }
});
