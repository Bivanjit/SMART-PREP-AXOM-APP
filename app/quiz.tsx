import React,{useEffect,useRef,useState} from 'react';
import {ScrollView,Alert,Pressable,Text,View,ActivityIndicator} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {useTheme} from './_layout';
import {Heading,Copy,Panel,Button} from '../components/ui';
import {loadChapterQuestions,loadTestQuestions,RemoteQuestion,submitServerAttempt} from '../lib/backend';
import {supabase} from '../lib/supabase';
export default function Quiz(){
 const p=useLocalSearchParams<{subject:string;chapter:string;chapterId:string;testId:string;testTitle:string;durationMinutes:string}>();
 const {c,bookmarks,toggleBookmark,userId}=useTheme();
 const [list,setList]=useState<RemoteQuestion[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [index,setIndex]=useState(0),[answers,setAnswers]=useState<Record<string,number>>({}),[review,setReview]=useState<string[]>([]);
 const [seconds,setSeconds]=useState(0),[submitting,setSubmitting]=useState(false),[draftReady,setDraftReady]=useState(false);
 const [startedAt,setStartedAt]=useState(new Date().toISOString()),[deadlineAt,setDeadlineAt]=useState<string|null>(null);
 const lock=useRef(false),title=p.testTitle||String(p.subject)+' · '+String(p.chapter);
 useEffect(()=>{let live=true;void(async()=>{try{
  const qs=p.testId?await loadTestQuestions(p.testId):await loadChapterQuestions(p.chapterId);if(!live)return;setList(qs);
  if(p.testId&&supabase&&userId){const {data,error}=await supabase.from('attempt_drafts').select('answers,current_index,started_at,deadline_at').eq('user_id',userId).eq('test_id',p.testId).maybeSingle();if(error)throw error;
   if(data){setAnswers(data.answers||{});setIndex(Math.min(Number(data.current_index)||0,Math.max(0,qs.length-1)));setStartedAt(data.started_at);setDeadlineAt(data.deadline_at);}
   else{const start=new Date(),end=new Date(start.getTime()+Math.max(1,Number(p.durationMinutes)||180)*60000);setStartedAt(start.toISOString());setDeadlineAt(end.toISOString());}
  }else{setStartedAt(new Date().toISOString());setDeadlineAt(null);}
  if(live)setDraftReady(true);
 }catch(e){if(live)setError(e instanceof Error?e.message:'Could not load questions.')}finally{if(live)setLoading(false)}})();return()=>{live=false}},[p.testId,p.chapterId,p.durationMinutes,userId]);
 useEffect(()=>{if(!draftReady||!p.testId||!supabase||!userId)return;const t=setTimeout(()=>{void supabase!.from('attempt_drafts').upsert({user_id:userId,test_id:p.testId,answers,current_index:index,started_at:startedAt,deadline_at:deadlineAt,updated_at:new Date().toISOString()},{onConflict:'user_id,test_id'}).then(({error})=>{if(error)console.warn('Draft autosave failed:',error.message)})},500);return()=>clearTimeout(t)},[answers,index,draftReady,p.testId,userId,startedAt,deadlineAt]);
 async function submit(auto=false){if(lock.current||submitting)return;lock.current=true;setSubmitting(true);try{const result=await submitServerAttempt({testId:p.testId,questionIds:list.map(x=>x.id),title,answers:list.map(x=>({question_id:x.id,selected_answer:answers[x.id]===undefined?null:String.fromCharCode(65+answers[x.id])}))});if(p.testId&&supabase&&userId)await supabase.from('attempt_drafts').delete().eq('user_id',userId).eq('test_id',p.testId);router.replace({pathname:'/results',params:{result:JSON.stringify(result),title,elapsed:String(deadlineAt?Math.max(0,Number(p.durationMinutes||180)*60-seconds):seconds)}});}catch(e){lock.current=false;Alert.alert(auto?'Auto-submit failed':'Could not submit',e instanceof Error?e.message:'Check your connection. Your answers are saved.')}finally{setSubmitting(false)}}
 useEffect(()=>{const timer=setInterval(()=>{if(deadlineAt){const left=Math.max(0,Math.ceil((new Date(deadlineAt).getTime()-Date.now())/1000));setSeconds(left);if(left===0&&!loading&&!submitting)void submit(true);}else setSeconds(Math.max(0,Math.floor((Date.now()-new Date(startedAt).getTime())/1000)))},1000);return()=>clearInterval(timer)},[deadlineAt,startedAt,loading,submitting,answers,list,seconds]);
 const q=list[index];
 if(loading)return <View style={{flex:1,justifyContent:'center',alignItems:'center',gap:12}}><ActivityIndicator color={c.blue}/><Copy>Loading questions…</Copy></View>;
 if(error||!list.length)return <View style={{padding:24,gap:12}}><Heading>{error?'Unable to load practice.':'No published questions yet.'}</Heading><Copy>{error||'The admin has not uploaded and published questions for this chapter/test yet.'}</Copy><Button title="Go back" onPress={()=>router.back()}/></View>;
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:20,gap:15,paddingBottom:44}}>
 <View style={{flexDirection:'row',justifyContent:'space-between'}}><Copy>QUESTION {index+1} OF {list.length}</Copy><Text style={{color:deadlineAt&&seconds<300?c.red:c.blue,fontWeight:'900'}}>{deadlineAt?'Remaining ':'Elapsed '}{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</Text></View>
 <View style={{height:5,backgroundColor:c.border,borderRadius:5}}><View style={{height:5,width:(((index+1)/list.length)*100+'%') as any,backgroundColor:c.blue,borderRadius:5}}/></View>
 <Panel><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Copy>{p.chapter||'Full mock test'}</Copy><Pressable onPress={()=>toggleBookmark(q.id)}><Text style={{fontSize:22,color:c.blue}}>{bookmarks.includes(q.id)?'★':'☆'}</Text></Pressable></View><Heading>{q.prompt}</Heading>{q.options.map((o,i)=><Pressable key={i} accessibilityRole="radio" accessibilityState={{selected:answers[q.id]===i}} onPress={()=>setAnswers(old=>({...old,[q.id]:i}))} style={{padding:15,borderWidth:1,borderColor:answers[q.id]===i?c.blue:c.border,borderRadius:12,backgroundColor:answers[q.id]===i?c.soft:c.card}}><Text style={{color:c.text,fontSize:15}}>{String.fromCharCode(65+i)}. {o}</Text></Pressable>)}</Panel>
 <View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Button title="Previous" onPress={()=>setIndex(i=>Math.max(0,i-1))}/></View><View style={{flex:1}}><Button title={index===list.length-1?'Finish':'Save & next'} onPress={()=>index===list.length-1?Alert.alert('Finish session?','Your answers will be scored by the server.',[{text:'Cancel',style:'cancel'},{text:'Submit',onPress:()=>void submit()}]):setIndex(i=>i+1)}/></View></View>
 <View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Button title="Clear response" onPress={()=>setAnswers(old=>{const n={...old};delete n[q.id];return n})}/></View><View style={{flex:1}}><Button title={review.includes(q.id)?'Unmark review':'Mark for review'} onPress={()=>setReview(old=>old.includes(q.id)?old.filter(x=>x!==q.id):[...old,q.id])}/></View></View>
 <Panel><Copy>Question palette · {Object.keys(answers).length} answered · {review.length} for review</Copy><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{list.map((item,i)=><Pressable key={item.id} onPress={()=>setIndex(i)} style={{width:40,height:40,borderRadius:9,alignItems:'center',justifyContent:'center',backgroundColor:index===i?c.blue:answers[item.id]!==undefined?c.soft:c.card,borderWidth:1,borderColor:review.includes(item.id)?c.green:c.border}}><Text style={{color:index===i?'white':c.text,fontWeight:'800'}}>{i+1}</Text></Pressable>)}</View></Panel>
 <Button title={submitting?'Submitting…':'Submit session'} onPress={()=>Alert.alert('Submit session?','The server will calculate your marks.',[{text:'Continue test',style:'cancel'},{text:'Submit now',style:'destructive',onPress:()=>void submit()}])}/>
 </ScrollView>
}