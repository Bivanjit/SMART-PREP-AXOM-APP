import React,{useEffect,useMemo,useState} from 'react';
import {ScrollView,View,Text,Pressable,ActivityIndicator} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../lib/supabase';
import {useTheme} from './_layout';
import {Heading,Copy,Panel,Button,SegmentedTabs,EmptyState} from '../components/ui';

type Subject='All'|'Physics'|'Chemistry'|'Mathematics';
export default function PracticeBuilder(){
 const {c,language}=useTheme();const params=useLocalSearchParams<{type?:string}>();
 const type=params.type==='mixed'?'mixed':'custom';
 const [subject,setSubject]=useState<Subject>('All'),[chapter,setChapter]=useState('all'),[difficulty,setDifficulty]=useState('all'),[count,setCount]=useState('20'),[duration,setDuration]=useState('30');
 const [chapters,setChapters]=useState<any[]>([]),[loading,setLoading]=useState(true),[starting,setStarting]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setLoading(false);return;}const {data,error}=await supabase.from('chapters').select('id,name,subjects(name)').eq('is_active',true).order('display_order');if(!live)return;if(error)setError(error.message);setChapters(data||[]);setLoading(false)})();return()=>{live=false}},[]);
 const visibleChapters=useMemo(()=>chapters.filter(x=>subject==='All'||x.subjects?.name===subject),[chapters,subject]);
 async function start(){if(!supabase)return;setStarting(true);setError('');try{
  let query=supabase.from('questions').select('id,chapter_id').eq('is_published',true).eq('language',language);
  if(subject!=='All'){const ids=visibleChapters.map(x=>x.id);if(!ids.length)throw new Error('No active chapters are available for this subject.');query=query.in('chapter_id',ids);}
  if(chapter!=='all')query=query.eq('chapter_id',chapter);
  if(difficulty!=='all')query=query.eq('difficulty',difficulty);
  let {data,error}=await query.limit(1000);if(error)throw error;
  if(language==='as'&&(data||[]).length<Number(count)){let fallback=supabase.from('questions').select('id,chapter_id').eq('is_published',true).eq('language','en');if(subject!=='All')fallback=fallback.in('chapter_id',visibleChapters.map(x=>x.id)) as any;if(chapter!=='all')fallback=fallback.eq('chapter_id',chapter) as any;if(difficulty!=='all')fallback=fallback.eq('difficulty',difficulty) as any;const {data:english,error:englishError}=await fallback.limit(1000);if(englishError)throw englishError;const seen=new Set((data||[]).map(x=>x.id));data=[...(data||[]),...(english||[]).filter(x=>!seen.has(x.id))] as any;}
  const ids=(data||[]).map(x=>x.id);
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  const selected=ids.slice(0,Math.min(Number(count),ids.length));
  if(!selected.length)throw new Error('No published questions match these filters yet. Upload and publish questions in the admin console first.');
  router.push({pathname:'/quiz',params:{questionIds:JSON.stringify(selected),testTitle:type==='mixed'?'Mixed Practice':'Custom Practice',customTest:'1',durationMinutes:duration}});
 }catch(e){setError(e instanceof Error?e.message:'Could not create the practice session.');}finally{setStarting(false)}}
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:18,gap:16,paddingBottom:40}}><View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1,color:c.green}}>{type==='mixed'?'MIXED PRACTICE':'CUSTOM PRACTICE'}</Text><Heading>{type==='mixed'?'Mixed Practice':'Build your practice set'}</Heading><Copy>{type==='mixed'?'Create a balanced session from published questions across chapters.':'Choose the subjects, chapter, difficulty and number of questions for your own session.'}</Copy></View>
  <Panel style={{gap:12}}><Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Subject</Text><SegmentedTabs options={[{label:'All',value:'All'},{label:'Physics',value:'Physics'},{label:'Chemistry',value:'Chemistry'},{label:'Maths',value:'Mathematics'}]} value={subject} onChange={v=>{setSubject(v);setChapter('all')}}/>
   <Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Chapter</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7}}>{[{id:'all',name:'All chapters'},...visibleChapters].map(x=><Pressable key={x.id} onPress={()=>setChapter(x.id)} style={{paddingHorizontal:12,paddingVertical:9,borderRadius:99,backgroundColor:chapter===x.id?c.green:c.surfaceElevated}}><Text style={{fontSize:10,fontWeight:'800',color:chapter===x.id?'#FFFFFF':c.text}}>{x.name}</Text></Pressable>)}</ScrollView>
   <Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Difficulty</Text><SegmentedTabs options={[{label:'All',value:'all'},{label:'Easy',value:'easy'},{label:'Medium',value:'medium'},{label:'Hard',value:'hard'}]} value={difficulty} onChange={setDifficulty}/>
   <Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Question count</Text><SegmentedTabs options={['10','20','30','40','60','100'].map(x=>({label:x+' Qs',value:x}))} value={count} onChange={setCount}/>
   <Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Time limit</Text><SegmentedTabs options={['15','30','45','60','90'].map(x=>({label:x+' min',value:x}))} value={duration} onChange={setDuration}/>
  </Panel>
  {loading?<ActivityIndicator color={c.green}/>:null}{error?<EmptyState icon="alert-circle-outline" title="Cannot start this set" description={error}/>:null}
  <Button title={starting?'Preparing questions…':'Start practice'} onPress={()=>void start()} loading={starting} disabled={loading||starting} icon="play-outline"/>
 </ScrollView>;
}
