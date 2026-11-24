import React,{useEffect,useState} from 'react';
import {ScrollView,View,ActivityIndicator} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {useTheme} from './_layout';
import {Heading,Copy,Panel,Button} from '../components/ui';
import MathText from '../components/MathText';
import {supabase} from '../lib/supabase';

export default function Results(){
 const p=useLocalSearchParams<{result:string;title:string;elapsed:string;attemptId:string}>();
 const {c}=useTheme();
 const [result,setResult]=useState<any>(null),[loading,setLoading]=useState(Boolean(p.attemptId)),[pending,setPending]=useState(Boolean(p.attemptId)),[error,setError]=useState('');
 useEffect(()=>{if(!p.attemptId){try{setResult(JSON.parse(p.result||'{}'));}catch{setResult({});}setLoading(false);return;}
  let active=true;let timer:ReturnType<typeof setInterval>|undefined;
  const load=async()=>{if(!supabase)return;try{
   const {data,error:resultError}=await supabase.functions.invoke('get-attempt-result',{body:{attempt_id:p.attemptId}});
   if(resultError)throw resultError;if(data?.error)throw new Error(data.error);
   if(data?.locked){if(active){setPending(true);setLoading(false);}return;}
   if(active){setResult(data);setPending(false);setLoading(false);setError('');}
  }catch(e){if(active){setError(e instanceof Error?e.message:'Could not load your result.');setLoading(false);}}};
  void load();timer=setInterval(()=>void load(),8000);return()=>{active=false;if(timer)clearInterval(timer)};
 },[p.attemptId,p.result]);
 const answers=result?.answers||[];
 if(loading)return <View style={{flex:1,justifyContent:'center',alignItems:'center',gap:12,backgroundColor:c.bg}}><ActivityIndicator color={c.green}/><Copy>Loading your result…</Copy></View>;
 if(pending)return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:22,gap:15,paddingBottom:40}}><Copy>FULL MOCK TEST · SUBMITTED</Copy><Heading>Submission received.</Heading><Panel style={{gap:9}}><Heading style={{fontSize:19}}>Your result is under review</Heading><Copy>Your answers and submission time have been saved securely. Your score, correct answers and explanations are locked until the admin reviews and releases the result.</Copy><Copy>This page checks automatically for the release. You'll also receive an in-app notification when it's ready.</Copy>{error?<Copy>{error}</Copy>:null}</Panel><Button title="Check now" onPress={()=>router.replace({pathname:'/results',params:{attemptId:p.attemptId}})}/><Button title="Back to home" variant="secondary" onPress={()=>router.replace('/(tabs)')}/></ScrollView>;
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:22,gap:15,paddingBottom:40}}><Copy>{result?.guest?'GUEST PRACTICE · SERVER SCORED':'SESSION COMPLETE · SERVER SCORED'}</Copy><Heading>Review your performance.</Heading><Panel><Heading>{result?.score??0} / {result?.max_score??0} marks</Heading><Copy>{result?.correct??0} correct · {result?.wrong??0} incorrect · {result?.skipped??0} skipped</Copy>{p.elapsed?<Copy>Time taken: {Math.floor(Number(p.elapsed)/60)}m {Number(p.elapsed)%60}s</Copy>:null}<Copy>Scoring: +4 correct, −1 incorrect, 0 unanswered.</Copy>{result?.guest?<Copy>Guest session · This result is not saved to a student account. Sign in from Profile to keep your practice history.</Copy>:<><Copy>Attempt ID: {result?.attempt_id||'Not available'}</Copy>{result?.xp_awarded!==undefined?<Heading>+{result.xp_awarded??0} XP earned</Heading>:null}</>}</Panel><Heading>Answer explanations</Heading>{answers.map((a:any,i:number)=><Panel key={a.question_id}><Copy>QUESTION {i+1}</Copy>{a.prompt?<MathText text={a.prompt} size={15}/>:null}<Copy>Your answer: {a.selected_answer||'Not answered'}</Copy><Copy>Correct answer: {a.correct_answer||'—'}</Copy><Copy>{a.is_correct===true?'Correct':a.is_correct===false?'Incorrect':'Skipped'} · {a.marks_awarded} marks</Copy>{a.explanation?<MathText text={a.explanation} size={14}/>:null}</Panel>)}<Button title="Back to practice" onPress={()=>router.replace('/(tabs)/practice')}/></ScrollView>;
}
