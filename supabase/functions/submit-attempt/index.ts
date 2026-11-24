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
    const authHeader = req.headers.get("Authorization") || "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "");
    const apiKey = req.headers.get("apikey") || "";
    // Supabase JS sends the publishable/anon key as Authorization when there
    // is no user session. Do not mistake that project key for a user JWT.
    const token = bearer && bearer !== apiKey ? bearer : "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    let user: { id: string } | null = null;
    if (token) {
      const { data: userData, error: userError } = await admin.auth.getUser(token);
      if (userError || !userData.user) return Response.json({ error: "Invalid session." }, { status: 401, headers: cors });
      user = { id: userData.user.id };
    }

    const body = await req.json();
    const testId = typeof body.test_id === "string" ? body.test_id : null;
    const pyqPaperId = typeof body.pyq_paper_id === "string" ? body.pyq_paper_id : null;
    const questionIds = Array.isArray(body.question_ids) ? body.question_ids.filter((x: unknown) => typeof x === "string") : [];
    const submitted = Array.isArray(body.answers) ? body.answers : [];
    if (submitted.length === 0 || submitted.length > 150) {
      return Response.json({ error: "Submit between 1 and 150 answers." }, { status: 400, headers: cors });
    }

    if (!user && testId) return Response.json({ error: "Sign in to submit a full mock test." }, { status: 401, headers: cors });
    let title = typeof body.title === "string" ? body.title.slice(0, 120) : "Chapter Practice";
    let source: "mock_test" | "chapter_practice" | "previous_year" | "custom_test" = testId ? "mock_test" : pyqPaperId ? "previous_year" : body.custom_test === true ? "custom_test" : "chapter_practice";
    let maxScore = 0;
    let manualRelease = false;
    let rules = new Map<string, { answer_key: string; explanation: string | null; marks: number; negative: number }>();

    if (testId) {
      const { data: test, error: testError } = await admin.from("mock_tests").select("id,title,total_marks,access_tier,status,test_type,result_release_mode,opens_at,closes_at,allow_early_submission").eq("id", testId).maybeSingle();
      if (testError || !test || test.status !== "published") return Response.json({ error: "Test is unavailable." }, { status: 404, headers: cors });
      title = test.title;
      const now = Date.now();
      if (test.opens_at && now < new Date(test.opens_at).getTime()) return Response.json({ error: "This mock has not opened yet." }, { status: 409, headers: cors });
      const autoSubmitted = body.auto_submitted === true;
      const earlyAllowed = test.allow_early_submission === true;
      if (test.closes_at && now < new Date(test.closes_at).getTime() && !earlyAllowed && !autoSubmitted) return Response.json({ error: "Submission is locked until the scheduled mock closes." }, { status: 409, headers: cors });
      if (test.closes_at && now >= new Date(test.closes_at).getTime() && !autoSubmitted) body.auto_submitted = true;
      manualRelease = test.test_type === "full_length" && test.result_release_mode === "manual";
      if (test.access_tier === "premium") {
        const { data: membership } = await admin.from("memberships").select("id").eq("user_id", user.id).eq("status", "active").lte("starts_at", new Date().toISOString()).gt("expires_at", new Date().toISOString()).in("product_code", ["cee_complete"]).limit(1).maybeSingle();
        if (!membership) return Response.json({ error: "An active CEE Complete membership is required." }, { status: 403, headers: cors });
      }
      const { data: rows, error: rowsError } = await admin.from("mock_test_questions")
        .select("question_id,marks,negative_marks,questions!inner(id,answer_key,explanation,is_published)")
        .eq("mock_test_id", testId).order("question_order");
      if (rowsError || !rows?.length) return Response.json({ error: "This test has no published questions yet." }, { status: 409, headers: cors });
      for (const row of rows as any[]) {
        if (!row.questions?.is_published) continue;
        rules.set(row.question_id, { answer_key: row.questions.answer_key, explanation: row.questions.explanation, marks: Number(row.marks), negative: Number(row.negative_marks) });
      }
      maxScore = Array.from(rules.values()).reduce((sum, r) => sum + r.marks, 0);
    } else if (pyqPaperId) {
      const { data: paper, error: paperError } = await admin.from("pyq_papers")
        .select("id,title,status,access_tier,total_marks").eq("id", pyqPaperId).maybeSingle();
      if (paperError || !paper || paper.status !== "published") {
        return Response.json({ error: "Previous-year paper is unavailable." }, { status: 404, headers: cors });
      }
      title = paper.title;
      if (paper.access_tier === "premium") {
        if (!user) return Response.json({ error: "Sign in to access this premium paper." }, { status: 401, headers: cors });
        const { data: membership } = await admin.from("memberships").select("id")
          .eq("user_id", user.id).eq("status", "active").lte("starts_at", new Date().toISOString())
          .gt("expires_at", new Date().toISOString()).eq("product_code", "cee_complete").limit(1).maybeSingle();
        if (!membership) return Response.json({ error: "An active CEE Complete membership is required." }, { status: 403, headers: cors });
      }
      const { data: rows, error: rowsError } = await admin.from("pyq_paper_questions")
        .select("question_id,marks,negative_marks,questions!inner(id,answer_key,explanation,is_published,access_tier,source_type)")
        .eq("paper_id", pyqPaperId).order("question_order");
      if (rowsError || !rows?.length) return Response.json({ error: "This paper has no assigned questions yet." }, { status: 409, headers: cors });
      if (paper.access_tier !== "free" && (rows as any[]).some(row => row.questions?.source_type !== "pyq" && row.questions?.access_tier === "premium") && !user) {
        return Response.json({ error: "Sign in to access premium questions in this paper." }, { status: 401, headers: cors });
      }
      if (paper.access_tier !== "free" && (rows as any[]).some(row => row.questions?.source_type !== "pyq" && row.questions?.access_tier === "premium") && user) {
        const { data: membership } = await admin.from("memberships").select("id").eq("user_id", user.id)
          .eq("status", "active").lte("starts_at", new Date().toISOString()).gt("expires_at", new Date().toISOString())
          .eq("product_code", "cee_complete").limit(1).maybeSingle();
        if (!membership) return Response.json({ error: "Premium questions in this paper require CEE Complete." }, { status: 403, headers: cors });
      }
      for (const row of rows as any[]) {
        if (!row.questions?.is_published) continue;
        rules.set(row.question_id, { answer_key: row.questions.answer_key, explanation: row.questions.explanation, marks: Number(row.marks), negative: Number(row.negative_marks) });
      }
      maxScore = Array.from(rules.values()).reduce((sum, r) => sum + r.marks, 0);
    } else {
      const ids = [...new Set(questionIds.length ? questionIds : submitted.map((a: any) => a.question_id).filter((x: unknown) => typeof x === "string"))];
      if (ids.length === 0 || ids.length > 150) return Response.json({ error: "No valid question IDs supplied." }, { status: 400, headers: cors });
      const { data: questions, error: qError } = await admin.from("questions").select("id,chapter_id,source_type,answer_key,explanation,access_tier,is_published").in("id", ids);
      if (qError || !questions?.length) return Response.json({ error: "Questions unavailable." }, { status: 404, headers: cors });
      const chapterIds = [...new Set(questions.map(q => q.chapter_id))];
      const { data: chapterRows, error: chapterError } = await admin.from("chapters").select("id,access_tier").in("id", chapterIds);
      if (chapterError) throw chapterError;
      const premiumChapters = new Set((chapterRows || []).filter((c: any) => c.access_tier === "premium").map((c: any) => c.id));
      const { data: freePyqLinks, error: pyqLinkError } = await admin.from("pyq_paper_questions").select("question_id,pyq_papers!inner(access_tier,status)").in("question_id", ids).eq("pyq_papers.status", "published").eq("pyq_papers.access_tier", "free");
      if (pyqLinkError) throw pyqLinkError;
      const freePyqIds = new Set((freePyqLinks || []).map((x: any) => x.question_id));
      const needsChapterMembership = questions.some(q => !freePyqIds.has(q.id) && q.source_type !== "pyq" && (q.access_tier === "premium" || premiumChapters.has(q.chapter_id)));
      if (needsChapterMembership) {
        if (!user) return Response.json({ error: "Sign in to submit premium chapter practice." }, { status: 401, headers: cors });
        const { data: membership } = await admin.from("memberships").select("id").eq("user_id", user.id).eq("status", "active").lte("starts_at", new Date().toISOString()).gt("expires_at", new Date().toISOString()).in("product_code", ["chapter_practice","cee_complete"]).limit(1).maybeSingle();
        if (!membership) return Response.json({ error: "An active chapter practice membership is required." }, { status: 403, headers: cors });
      }
      for (const q of questions) if (q.is_published) rules.set(q.id, { answer_key: q.answer_key, explanation: q.explanation, marks: 4, negative: 1 });
      maxScore = rules.size * 4;
    }

    const unique = new Map<string, string | null>();
    for (const answer of submitted) {
      if (!answer || typeof answer.question_id !== "string") continue;
      const selected = typeof answer.selected_answer === "string" ? answer.selected_answer : null;
      unique.set(answer.question_id, selected);
    }
    if (unique.size !== rules.size || [...unique.keys()].some(id => !rules.has(id))) {
      return Response.json({ error: "The submitted answers do not match the assigned question set." }, { status: 400, headers: cors });
    }

    let correct = 0, wrong = 0, skipped = 0, score = 0;
    const answerRows = [...unique.entries()].map(([question_id, selected_answer]) => {
      const rule = rules.get(question_id)!;
      const isCorrect = selected_answer !== null && selected_answer.trim().toUpperCase() === rule.answer_key.trim().toUpperCase();
      const isSkipped = selected_answer === null || selected_answer.trim() === "";
      const marks = isSkipped ? 0 : isCorrect ? rule.marks : -rule.negative;
      if (isSkipped) skipped++; else if (isCorrect) correct++; else wrong++;
      score += marks;
      return { question_id, selected_answer, is_correct: isSkipped ? null : isCorrect, marks_awarded: marks };
    });

    const review = answerRows.map(row => ({
      question_id: row.question_id,
      selected_answer: row.selected_answer,
      is_correct: row.is_correct,
      marks_awarded: row.marks_awarded,
      explanation: rules.get(row.question_id)?.explanation ?? null,
      correct_answer: rules.get(row.question_id)?.answer_key
    }));
    if (!user) {
      return Response.json({ attempt_id: null, guest: true, score, max_score: maxScore, correct, wrong, skipped, answers: review }, { headers: cors });
    }

    const { data: attempt, error: attemptError } = await admin.from("attempts").insert({
      user_id: user.id, mock_test_id: testId, source, title,
      score, max_score: maxScore, correct_count: correct, wrong_count: wrong,
      skipped_count: skipped, submitted_at: new Date().toISOString(),
      elapsed_seconds: Math.max(0, Math.min(86400, Number(body.elapsed_seconds) || 0)),
      auto_submitted: body.auto_submitted === true,
      violation_count: Math.max(0, Math.min(1000, Number(body.violation_count) || 0)),
      results_released_at: (testId && manualRelease) ? null : new Date().toISOString()
    }).select("id").single();
    if (attemptError || !attempt) throw attemptError || new Error("Could not save attempt");

    const { error: answerError } = await admin.from("attempt_answers").insert(answerRows.map(row => ({ ...row, attempt_id: attempt.id })));
    if (answerError) {
      await admin.from("attempts").delete().eq("id", attempt.id);
      throw answerError;
    }

    if (body.violation_count > 0 || body.auto_submitted === true) { await admin.from('mock_test_events').insert([{attempt_id:attempt.id,user_id:user.id,event_type:body.auto_submitted===true?'auto_submit':'manual_submit',details:{elapsed_seconds:body.elapsed_seconds||0,violation_count:body.violation_count||0}}]); }
    if (manualRelease) { return Response.json({ attempt_id: attempt.id, pending_release: true, title, message: "Your submission is saved. Results will appear after admin review and release." }, { headers: cors }); }

    const { data: xpRows } = await admin.from("question_xp_ledger").select("xp").eq("attempt_id", attempt.id);
    const xpAwarded = (xpRows || []).reduce((sum: number, row: any) => sum + Number(row.xp || 0), 0);
    return Response.json({ attempt_id: attempt.id, guest: false, score, max_score: maxScore, correct, wrong, skipped, xp_awarded: xpAwarded, answers: review }, { headers: cors });
  } catch (error) {
    console.error("submit-attempt", error);
    return Response.json({ error: error instanceof Error ? error.message : "Could not submit attempt." }, { status: 500, headers: cors });
  }
});
