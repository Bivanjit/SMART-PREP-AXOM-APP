import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return Response.json({error:"Method not allowed"},{status:405,headers:cors});
 try{
  const auth=req.headers.get("Authorization")||"";if(!auth.startsWith("Bearer "))return Response.json({error:"Sign in required."},{status:401,headers:cors});
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:{user},error:authError}=await userClient.auth.getUser();if(authError||!user)return Response.json({error:"Invalid session."},{status:401,headers:cors});
  const {data:isAdmin}=await userClient.rpc("is_smartprep_admin");
  const body=await req.json(),testId=typeof body.test_id==="string"?body.test_id:"";if(!testId)return Response.json({error:"test_id required"},{status:400,headers:cors});
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const {data:test,error:testError}=await admin.from("mock_tests").select("id,title,status,closes_at,leaderboard_enabled,result_release_mode").eq("id",testId).maybeSingle();
  if(testError||!test)return Response.json({error:"Mock not found."},{status:404,headers:cors});
  if(test.closes_at&&Date.now()<new Date(test.closes_at).getTime())return Response.json({error:"Leaderboard opens after the scheduled mock closes."},{status:409,headers:cors});
  if(!test.leaderboard_enabled)return Response.json({error:"Leaderboard is disabled for this mock."},{status:403,headers:cors});
  const {data:attempts,error}=await admin.from("attempts").select("id,user_id,title,score,max_score,elapsed_seconds,submitted_at,results_released_at").eq("mock_test_id",testId).not("submitted_at","is",null).not("results_released_at","is",null).order("score",{ascending:false}).order("elapsed_seconds",{ascending:true}).limit(10);
  if(error)throw error;
  const ids=[...new Set((attempts||[]).map(x=>x.user_id))];
  const [{data:profiles,error:profileError},{data:xp,error:xpError}]=await Promise.all([
   ids.length?admin.from("profiles").select("id,display_name").in("id",ids):Promise.resolve({data:[],error:null}),
   attempts?.length?admin.from("question_xp_ledger").select("attempt_id,xp").in("attempt_id",attempts.map(x=>x.id)):Promise.resolve({data:[],error:null})
  ]);
  if(profileError)throw profileError;if(xpError)throw xpError;
  const names=new Map((profiles||[]).map(x=>[x.id,x.display_name]));
  const xpMap=new Map<string,number>();for(const row of xp||[])xpMap.set(row.attempt_id,(xpMap.get(row.attempt_id)||0)+Number(row.xp||0));
  return Response.json({test:{id:test.id,title:test.title},leaderboard:(attempts||[]).map((a,i)=>({rank:i+1,display_name:names.get(a.user_id)||"Student",score:a.score,max_score:a.max_score,elapsed_seconds:a.elapsed_seconds||0,xp_awarded:xpMap.get(a.id)||0,submitted_at:a.submitted_at,is_you:a.user_id===user.id}))},{headers:cors});
 }catch(e){console.error("get-mock-leaderboard",e);return Response.json({error:e instanceof Error?e.message:"Could not load mock leaderboard."},{status:500,headers:cors});}
});