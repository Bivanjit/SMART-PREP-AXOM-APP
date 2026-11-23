import React,{useEffect,useMemo,useState} from 'react';
import {ScrollView,View,Text,Pressable,ActivityIndicator} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../lib/supabase';
import {useTheme} from './_layout';
import {Heading,Copy,Panel,SegmentedTabs,EmptyState,Button,SubjectBadge} from '../components/ui';

type Row={id:string;chapter_id:string;source_year:number|null;prompt:string;chapters?:{name:string;subjects?:{name:string}}};
export default function PYQs(){
 const {c,language}=useTheme();
 const [rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[year,setYear]=useState('all');
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setLoading(false);setError('Backend is not configured.');return;}try{
  let {data,error}=await supabase.from('questions').select('id,chapter_id,source_year,prompt,chapters(name,subjects(name))') .eq('is_published',true).eq('source_type','pyq').eq('language',language).order('source_year',{ascending:false}).limit(2000);
  if(error)throw error;
  if(language==='as'&&(data||[]).length===0){const fallback=await supabase.from('questions').select('id,chapter_id,source_year,prompt,chapters(name,subjects(name))').eq('is_published',true).eq('source_type','pyq').eq('language','en').order('source_year',{ascending:false}).limit(2000);if(fallback.error)throw fallback.error;data=fallback.data;}
  if(live)setRows((data||[]) as any);
 }catch(e){if(live)setError(e instanceof Error?e.message:'Could not load PYQs.')}finally{if(live)setLoading(false)}})();return()=>{live=false}},[language]);
 const years=useMemo(()=>Array.from(new Set(rows.map(x=>x.source_year).filter(Boolean))).sort((a,b)=>Number(b)-Number(a)).map(String),[rows]);
 const filtered=useMemo(()=>rows.filter(x=>year==='all'||String(x.source_year)===year),[rows,year]);
 const groups=useMemo(()=>{const map=new Map<string,{id:string;name:string;subject:string;ids:string[];years:Set<number>}>();for(const q of filtered){const name=q.chapters?.name||'Uncategorised';const key=q.chapter_id;const item=map.get(key)||{id:key,name,subject:q.chapters?.subjects?.name||'Physics',ids:[],years:new Set<number>()};item.ids.push(q.id);if(q.source_year)item.years.add(q.source_year);map.set(key,item);}return [...map.values()].sort((a,b)=>a.subject.localeCompare(b.subject)||a.name.localeCompare(b.name));},[filtered]);
 function start(group:{name:string;ids:string[]}){const ids=[...group.ids];for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}router.push({pathname:'/quiz',params:{questionIds:JSON.stringify(ids),testTitle:'PYQ · '+group.name,customTest:'1',durationMinutes:String(Math.max(15,Math.ceil(ids.length*1.5)))}})}
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:17,paddingTop:12,gap:14,paddingBottom:42}}>
  <View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:c.green}}>ASSAM CEE · PREVIOUS YEAR QUESTIONS</Text><Heading>PYQ Archive</Heading><Copy>Free previous-year questions, arranged by chapter. Filter only by examination year.</Copy></View>
  <View style={{gap:7}}><Text style={{fontSize:11,fontWeight:'800',color:c.textSecondary}}>Examination year</Text><SegmentedTabs options={[{label:'All years',value:'all'},...years.map(y=>({label:y,value:y}))]} value={year} onChange={setYear}/></View>
  {loading?<ActivityIndicator color={c.green} size="large"/>:error?<EmptyState icon="cloud-offline-outline" title="PYQ archive unavailable" description={error}/>:groups.length?groups.map(g=><Panel key={g.id} style={{gap:9}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:40,height:40,borderRadius:12,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Ionicons name="document-text-outline" size={21} color={c.primary}/></View><View style={{flex:1,gap:3}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>{g.name}</Text><Text style={{fontSize:10,color:c.textSecondary}}>{g.ids.length} questions · {g.years.size?Array.from(g.years).sort((a,b)=>b-a).join(', '):'Year not tagged'}</Text></View><SubjectBadge subject={(g.subject==='Maths'?'Mathematics':g.subject) as any}/></View><Button title="Start chapter PYQs" icon="play-outline" onPress={()=>start(g)}/></Panel>):<EmptyState icon="archive-outline" title="No published PYQs yet" description="The archive is ready. Upload verified Assam CEE PYQ questions, tag each with its year and chapter, then publish them from the admin console."/>}
  <Copy>PYQs are available to free students. No premium subscription is required.</Copy>
 </ScrollView>;
}
