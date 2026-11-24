import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const expected = Deno.env.get("PAYMENT_PROOF_CLEANUP_SECRET");
  if (!expected || req.headers.get("x-cleanup-secret") !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(url, key, { auth: { persistSession: false } });
  const cutoff = new Date().toISOString();
  const { data: expired, error } = await db.from("payment_submissions")
    .select("id,proof_path")
    .not("proof_path", "is", null)
    .lte("proof_expires_at", cutoff)
    .limit(500);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  let deleted = 0;
  for (const row of expired ?? []) {
    if (!row.proof_path) continue;
    const { error: removeError } = await db.storage.from("payment-proofs").remove([row.proof_path]);
    if (removeError) continue;
    const { error: updateError } = await db.from("payment_submissions")
      .update({ proof_path: null })
      .eq("id", row.id)
      .eq("proof_path", row.proof_path);
    if (!updateError) deleted++;
  }
  return Response.json({ processed: (expired ?? []).length, deleted, checked_at: cutoff });
});
