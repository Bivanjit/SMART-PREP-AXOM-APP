import React,{useEffect,useMemo,useState} from 'react';
import {ScrollView,View,Text,Pressable,ActivityIndicator} from 'react-native';
import {router} from 'expo-router';
import {supabase} from '../lib/supabase';
import {useTheme} from './_layout';
import {Heading,Copy,Panel,Button,SegmentedTabs,EmptyState} from '../components/ui';

export default function TestBuilder(){
 const {c,language}=useTheme();const [subject,setSubject]=useState('All'),[chapter,setChapter]=useState('all'),[difficulty,setDifficulty]=useState('all'),[count,setCount]=useState('40'),[duration,setDuration]=useState('60');
 const [chapters,setChapters]=useState<any[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let live=true;void(async()=>{const {data,error}=await supabase!.from('chapters').select('id,name,subjects(name)').eq('is_active',true).order('display_order');if(!live)return;if(error)setError(error.message);setChapters(data||[]);setLoading(false)})();return()=>{live=false}},[]);
 const visible=useMemo(()=>chapters.filter(x=>subject==='All'||x.subjects?.name===subject),[chapters,subject]);
 async function start(){if(!supabase)return;setBusy(true);setError('');try{let q=supabase.from('questions').select('id,chapter_id').eq('is_published',true).eq('language',language);if(subject!=='All'){const ids=visible.map(x=>x.id);if(!ids.length)throw new Error('No chapters available for this subject.');q=q.in('chapter_id',ids);}if(chapter!=='all')q=q.eq('chapter_id',chapter);if(difficulty!=='all')q=q.eq('difficulty',difficulty);const {data,error}=await q.limit(1000);if(error)throw error;const ids=(data||[]).map(x=>x.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}const selected=ids.slice(0,Math.min(Number(count),ids.length));if(!selected.length)throw new Error('No published questions match your selection. Upload and publish questions first.');router.push({pathname:'/quiz',params:{questionIds:JSON.stringify(selected),customTest:'1',durationMinutes:duration,testTitle:'Custom Test'}});}catch(e){setError(e instanceof Error?e.message:'Could not prepare custom test.')}finally{setBusy(false)}}
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:18,gap:16,paddingBottom:42}}><View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:c.green}}>CUSTOM ASSESSMENT</Text><Heading>Create your own test</Heading><Copy>Configure a timed test using published questions from the SmartPrep question bank.</Copy></View>
  <Panel style={{gap:12}}><Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Subject</Text><SegmentedTabs options={[{label:'All',value:'All'},{label:'Physics',value:'Physics'},{label:'Chemistry',value:'Chemistry'},{label:'Maths',value:'Mathematics'}]} value={subject} onChange={v=>{setSubject(v);setChapter('all')}}/>
   <Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Chapter</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7}}>{[{id:'all',name:'All chapters'},...visible].map(x=><Pressable key={x.id} onPress={()=>setChapter(x.id)} style={{paddingHorizontal:12,paddingVertical:9,borderRadius:99,backgroundColor:chapter===x.id?c.green:c.surfaceElevated}}><Text style={{fontSize:10,fontWeight:'800',color:chapter===x.id?'#FFFFFF':c.text}}>{x.name}</Text></Pressable>)}</ScrollView>
   <Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Difficulty</Text><SegmentedTabs options={[{label:'All',value:'all'},{label:'Easy',value:'easy'},{label:'Medium',value:'medium'},{label:'Hard',value:'hard'}]} value={difficulty} onChange={setDifficulty}/>
   <Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Questions</Text><SegmentedTabs options={['10','20','40','60','120'].map(x=>({label:x+' Qs',value:x}))} value={count} onChange={setCount}/>
   <Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Duration</Text><SegmentedTabs options={['30','60','90','180'].map(x=>({label:x+' min',value:x}))} value={duration} onChange={setDuration}/>
  </Panel>
  {loading?<ActivityIndicator color={c.green}/>:null}{error?<EmptyState icon="alert-circle-outline" title="Test cannot start" description={error}/>:null}
  <Button title={busy?'Preparing test…':'Start custom test'} onPress={()=>void start()} loading={busy} disabled={loading||busy} icon="play-outline"/>
 </ScrollView>;
}
