import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,x-client-info,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return Response.json({error:"Method not allowed"},{status:405,headers:cors});
 try{
  const bearer=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
  const apiKey=req.headers.get("apikey")||"";
  const token=bearer&&bearer!==apiKey?bearer:"";
  const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
  let user:{id:string}|null=null;
  if(token){const {data,error}=await admin.auth.getUser(token);if(error||!data.user)return Response.json({error:"Invalid session."},{status:401,headers:cors});user={id:data.user.id};}
  const body=await req.json();const id=typeof body.question_id==="string"?body.question_id:"";const selected=typeof body.selected_answer==="string"?body.selected_answer.trim().toUpperCase():"";
  if(!id||!["A","B","C","D"].includes(selected))return Response.json({error:"A valid question and answer are required."},{status:400,headers:cors});
  const {data:q,error}=await admin.from("questions").select("id,answer_key,explanation,access_tier,is_published").eq("id",id).maybeSingle();
  if(error||!q||!q.is_published)return Response.json({error:"Question is unavailable."},{status:404,headers:cors});
  if(q.access_tier==="premium"){
   if(!user)return Response.json({error:"Sign in to answer premium questions."},{status:401,headers:cors});
   const {data:m}=await admin.from("memberships").select("id").eq("user_id",user.id).eq("status","active").lte("starts_at",new Date().toISOString()).gt("expires_at",new Date().toISOString()).in("product_code",["chapter_practice","cee_complete"]).limit(1).maybeSingle();
   if(!m)return Response.json({error:"An active practice membership is required."},{status:403,headers:cors});
  }
  return Response.json({question_id:id,selected_answer:selected,is_correct:selected===q.answer_key.trim().toUpperCase(),correct_answer:q.answer_key,explanation:q.explanation||null},{headers:cors});
 }catch(e){console.error("check-answer",e);return Response.json({error:e instanceof Error?e.message:"Could not check answer."},{status:500,headers:cors});}
});