import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return Response.json({error:"Method not allowed"},{status:405,headers:cors});
 try{
  const auth=req.headers.get("Authorization")||"";if(!auth.startsWith("Bearer "))return Response.json({error:"Sign in required."},{status:401,headers:cors});
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:{user},error:ae}=await userClient.auth.getUser();if(ae||!user)return Response.json({error:"Invalid session."},{status:401,headers:cors});
  const body=await req.json(),testId=typeof body.test_id==="string"?body.test_id:"",event=body.event_type;
  if(!testId||!["app_background","app_foreground","focus_lost","focus_restored"].includes(event))return Response.json({error:"Invalid mock event."},{status:400,headers:cors});
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const {data:test,error}=await admin.from("mock_tests").select("id,status,opens_at,closes_at,anti_cheat_enabled").eq("id",testId).maybeSingle();
  if(error||!test)return Response.json({error:"Mock not found."},{status:404,headers:cors});
  if(!test.anti_cheat_enabled)return Response.json({recorded:false},{headers:cors});
  const {error:insertError}=await admin.from("mock_test_events").insert({attempt_id:null,test_id:testId,user_id:user.id,event_type:event,occurred_at:new Date().toISOString(),details:{client_reported:true}});
  if(insertError)throw insertError;
  return Response.json({recorded:true},{headers:cors});
 }catch(e){console.error("record-mock-event",e);return Response.json({error:e instanceof Error?e.message:"Could not record mock event."},{status:500,headers:cors});}
});