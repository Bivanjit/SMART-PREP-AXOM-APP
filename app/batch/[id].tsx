import React,{useEffect,useState} from 'react';
import {ScrollView,View,Text,Pressable,ActivityIndicator} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel,Button,ProgressBar,EmptyState} from '../../components/ui';

export default function BatchDetail(){
 const {c,userId,language}=useTheme();const {id}=useLocalSearchParams<{id:string}>();
 const [batch,setBatch]=useState<any>(null),[items,setItems]=useState<any[]>([]),[progress,setProgress]=useState<any[]>([]),[enrolled,setEnrolled]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function load(){if(!supabase)return;const [{data:b,error:be},{data:e},{data:p}]=await Promise.all([
  supabase.from('batches').select('*,batch_items(*,chapters(name,subjects(name)),lectures(id,title,subject,video_url),practice_sets(title),mock_tests(title),pyq_papers(title))').eq('id',String(id)).eq('status','published').maybeSingle(),
  userId?supabase.from('batch_enrollments').select('id,status').eq('batch_id',String(id)).eq('user_id',userId).eq('status','enrolled').maybeSingle():Promise.resolve({data:null}),
  userId?supabase.from('batch_item_progress').select('batch_item_id,progress_percent,completed_at').eq('user_id',userId):Promise.resolve({data:[]})
 ]);
 if(be)throw be;if(!b)throw new Error('This batch is not available.');setBatch(b);const list=(b.batch_items||[]).filter((x:any)=>x.is_published).sort((a:any,b:any)=>a.display_order-b.display_order);setItems(list);setEnrolled(Boolean(e));setProgress(p||[]);
 }
 useEffect(()=>{let live=true;void load().catch(e=>{if(live)setError(e instanceof Error?e.message:'Could not load batch.')}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[id,userId]);
 const completed=new Set(progress.filter(x=>x.completed_at||Number(x.progress_percent)>=100).map(x=>x.batch_item_id));
 const percent=items.length?Math.round(completed.size/items.length*100):0;
 async function enroll(){if(!userId){router.push('/auth');return;}if(batch.access_tier==='premium'){const {data:m}=await supabase!.from('memberships').select('id').eq('user_id',userId).eq('status','active').lte('starts_at',new Date().toISOString()).gt('expires_at',new Date().toISOString()).limit(1).maybeSingle();if(!m){router.push('/premium');return;}}
  setBusy(true);const {error}=await supabase!.from('batch_enrollments').insert({batch_id:batch.id,user_id:userId});setBusy(false);if(error&&error.code!=='23505'){setError(error.message);return;}setEnrolled(true);
 }
 async function openItem(item:any){if(!enrolled){await enroll();if(!userId||busy)return;}
  if(item.item_type==='chapter'){const {data:q,error}=await supabase!.from('questions').select('id').eq('chapter_id',item.chapter_id).eq('is_published',true).eq('language',language).limit(150);if(error){setError(error.message);return;}const ids=(q||[]).map(x=>x.id);if(!ids.length){setError('No published questions are available for this chapter yet.');return;}router.push({pathname:'/quiz',params:{questionIds:JSON.stringify(ids),testTitle:item.title,batchItemId:item.id}});return;}
  if(item.item_type==='lecture'){const l=item.lectures;if(!l?.video_url){setError('This lecture is missing its video URL.');return;}router.push({pathname:'/lecture-player',params:{lectureId:l.id,url:l.video_url,title:l.title,batchItemId:item.id}});return;}
  if(item.item_type==='practice_set'){const {data:q,error}=await supabase!.from('practice_set_questions').select('question_id').eq('practice_set_id',item.practice_set_id).order('question_order');if(error){setError(error.message);return;}const ids=(q||[]).map(x=>x.question_id);if(!ids.length){setError('This practice set has no questions yet.');return;}router.push({pathname:'/quiz',params:{questionIds:JSON.stringify(ids),testTitle:item.title,batchItemId:item.id}});return;}
  if(item.item_type==='mock_test'){router.push({pathname:'/quiz',params:{testId:item.mock_test_id,testTitle:item.title,batchItemId:item.id}});return;}
  if(item.item_type==='pyq_paper'){const {data:q,error}=await supabase!.from('pyq_paper_questions').select('question_id').eq('paper_id',item.pyq_paper_id).order('question_order');if(error){setError(error.message);return;}const ids=(q||[]).map(x=>x.question_id);if(!ids.length){setError('This paper has no questions yet.');return;}router.push({pathname:'/quiz',params:{questionIds:JSON.stringify(ids),testTitle:item.title,batchItemId:item.id}});}
 }
 if(loading)return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={c.green}/></View>;
 if(error&&!batch)return <View style={{padding:20}}><EmptyState icon="alert-circle-outline" title="Batch unavailable" description={error}/></View>;
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:17,gap:15,paddingBottom:42}}>
  <View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1,color:c.green}}>LEARNING PROGRAMME</Text><Heading>{batch.title}</Heading><Copy>{batch.description||batch.syllabus_summary}</Copy></View>
  <Panel style={{gap:9}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Course progress</Text><Text style={{fontSize:12,fontWeight:'900',color:c.green}}>{percent}%</Text></View><ProgressBar value={percent}/><Copy>{completed.size} of {items.length} learning items completed</Copy>{!enrolled?<Button title={batch.access_tier==='premium'?'Enroll with Premium':'Enroll in Free Batch'} onPress={()=>void enroll()} loading={busy}/>:<Text style={{fontSize:10,fontWeight:'900',color:c.green}}>✓ ENROLLED</Text>}</Panel>
  {items.length?items.map((item:any,index:number)=>{const done=completed.has(item.id);const detail=item.item_type==='chapter'?item.chapters?.name:item.item_type==='lecture'?item.lectures?.title:item.item_type==='practice_set'?item.practice_sets?.title:item.item_type==='mock_test'?item.mock_tests?.title:item.pyq_papers?.title;return <Pressable key={item.id} onPress={()=>void openItem(item)}><Panel style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{width:38,height:38,borderRadius:12,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:12,fontWeight:'900',color:c.primary}}>{index+1}</Text></View><View style={{flex:1,gap:3}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>{item.title}</Text><Text style={{fontSize:10,color:c.textSecondary}}>{item.item_type.replace('_',' ')} · {detail||'Content item'}</Text></View><Ionicons name={done?'checkmark-circle':'play-circle'} size={23} color={done?c.success:c.green}/></Panel></Pressable>}) : <EmptyState icon="library-outline" title="Course content is being prepared" description="The admin can add chapters, lectures, practice sets, mock tests and PYQ papers to this batch."/>}
  {error?<Text style={{fontSize:11,color:c.error}}>{error}</Text>:null}
 </ScrollView>;
}
