import { supabase } from './supabase';

export type RemoteQuestion = {id:string;chapter_id:string;prompt:string;options:string[];chapter?:string};
export async function loadChapterQuestions(chapterId:string,language:'en'|'as'='en'){
 if(!supabase) throw new Error('Backend is not configured.');
 let {data,error}=await supabase.from('questions').select('id,chapter_id,prompt,options').eq('chapter_id',chapterId).eq('is_published',true).eq('language',language).order('created_at');
 if(error) throw error;
 if((data||[]).length===0&&language==='as'){const fallback=await supabase.from('questions').select('id,chapter_id,prompt,options').eq('chapter_id',chapterId).eq('is_published',true).eq('language','en').order('created_at');if(fallback.error)throw fallback.error;data=fallback.data;}
 return (data||[]) as RemoteQuestion[];
}
export async function loadTestQuestions(testId:string){
 if(!supabase) throw new Error('Backend is not configured.');
 const {data,error}=await supabase.from('mock_test_questions').select('question_id,question_order,questions(id,chapter_id,prompt,options)').eq('mock_test_id',testId).order('question_order');
 if(error) throw error;
 return (data||[]).map((r:any)=>r.questions).filter(Boolean) as RemoteQuestion[];
}
export async function submitServerAttempt(args:{testId?:string;pyqPaperId?:string;customTest?:boolean;questionIds:string[];answers:{question_id:string;selected_answer:string|null}[];title:string}){
 if(!supabase) throw new Error('Backend is not configured.');
 const {data:{session}}=await supabase.auth.getSession();
 if(!session&&args.testId) throw new Error('Sign in before submitting a full mock test. Free chapter practice is available to guests.');
 const {data,error}=await supabase.functions.invoke('submit-attempt',{body:{test_id:args.testId,pyq_paper_id:args.pyqPaperId,custom_test:args.customTest===true,question_ids:args.questionIds,title:args.title,answers:args.answers}});
 if(error){let detail=error.message;const context=(error as any).context;if(context&&typeof context.clone==='function'){const payload=await context.clone().json().catch(()=>null);if(payload?.error)detail=String(payload.error);else if(payload?.message)detail=String(payload.message);}throw new Error(detail);}
 if(data?.error) throw new Error(String(data.error));
 return data;
}

export async function loadQuestionIds(questionIds:string[],language:'en'|'as'='en'){
 if(!supabase) throw new Error('Backend is not configured.');
 const ids=[...new Set(questionIds)].filter(Boolean);
 if(!ids.length) return [];
 let {data,error}=await supabase.from('questions').select('id,chapter_id,prompt,options').in('id',ids).eq('is_published',true).eq('language',language);
 if(error) throw error;
 if((data||[]).length===0&&language==='as'){const fallback=await supabase.from('questions').select('id,chapter_id,prompt,options').in('id',ids).eq('is_published',true).eq('language','en');if(fallback.error)throw fallback.error;data=fallback.data;}
 const byId=new Map((data||[]).map((q:any)=>[q.id,q]));
 return ids.map(id=>byId.get(id)).filter(Boolean) as RemoteQuestion[];
}
