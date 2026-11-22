import { supabase } from './supabase';

export type RemoteQuestion = {id:string;chapter_id:string;prompt:string;options:string[];chapter?:string};
export async function loadChapterQuestions(chapterId:string){
 if(!supabase) throw new Error('Backend is not configured.');
 const {data,error}=await supabase.from('questions').select('id,chapter_id,prompt,options').eq('chapter_id',chapterId).eq('is_published',true).order('created_at');
 if(error) throw error;
 return (data||[]) as RemoteQuestion[];
}
export async function loadTestQuestions(testId:string){
 if(!supabase) throw new Error('Backend is not configured.');
 const {data,error}=await supabase.from('mock_test_questions').select('question_id,question_order,questions(id,chapter_id,prompt,options)').eq('mock_test_id',testId).order('question_order');
 if(error) throw error;
 return (data||[]).map((r:any)=>r.questions).filter(Boolean) as RemoteQuestion[];
}
export async function submitServerAttempt(args:{testId?:string;questionIds:string[];answers:{question_id:string;selected_answer:string|null}[];title:string}){
 if(!supabase) throw new Error('Backend is not configured.');
 const {data:{session}}=await supabase.auth.getSession();
 if(!session) throw new Error('Sign in before submitting a practice session.');
 const {data,error}=await supabase.functions.invoke('submit-attempt',{body:{test_id:args.testId,question_ids:args.questionIds,title:args.title,answers:args.answers}});
 if(error) throw error;
 if(data?.error) throw new Error(data.error);
 return data;
}
