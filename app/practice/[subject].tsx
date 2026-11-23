import React,{useEffect,useMemo,useState} from 'react';
import {ScrollView,ActivityIndicator,TextInput,Pressable,View,Text} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel,Button,EmptyState,SubjectBadge} from '../../components/ui';
type Chapter={id:string;name:string;slug:string;display_order:number;questionCount:number;topicCount:number};
type SubjectName='Physics'|'Chemistry'|'Mathematics';
const validSubjects:SubjectName[]=['Physics','Chemistry','Mathematics'];
export default function Chapters(){
 const {subject}=useLocalSearchParams<{subject:string;subjectId?:string}>();const {c,language}=useTheme();
 const name=(validSubjects.includes(subject as SubjectName)?subject:subject==='Maths'?'Mathematics':'Physics') as SubjectName;
 const [rows,setRows]=useState<Chapter[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[search,setSearch]=useState('');
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setLoading(false);setError('Backend is not configured.');return;}try{
  const {data:sub,error:se}=await supabase.from('subjects').select('id').eq('name',name).eq('is_active',true).maybeSingle();if(se)throw se;if(!sub)throw new Error('This subject is not currently available.');
  const [{data:chapters,error:ce},{data:questions,error:qe},{data:topics,error:te}]=await Promise.all([
   supabase.from('chapters').select('id,name,slug,display_order').eq('subject_id',sub.id).eq('is_active',true).order('display_order'),
   supabase.from('questions').select('id,chapter_id').eq('is_published',true).eq('language',language),
   supabase.from('topics').select('id,chapter_id').eq('is_active',true)
  ]);
  if(ce)throw ce;if(qe)throw qe;if(te)throw te;
  let available=questions||[];
  if(!available.length&&language==='as'){const {data:fallback,error:fe}=await supabase.from('questions').select('id,chapter_id').eq('is_published',true).eq('language','en');if(fe)throw fe;available=fallback||[];}
  const counts=new Map<string,number>();for(const q of available)counts.set(q.chapter_id,(counts.get(q.chapter_id)||0)+1);
  const topicCounts=new Map<string,number>();for(const t of topics||[])topicCounts.set(t.chapter_id,(topicCounts.get(t.chapter_id)||0)+1);
  if(live)setRows((chapters||[]).map(ch=>({...ch,questionCount:counts.get(ch.id)||0,topicCount:topicCounts.get(ch.id)||0})));
 }catch(e){if(live)setError(e instanceof Error?e.message:'Could not load chapters.')}finally{if(live)setLoading(false)}})();return()=>{live=false}},[name,language]);
 const filtered=useMemo(()=>rows.filter(x=>x.name.toLowerCase().includes(search.trim().toLowerCase())),[rows,search]);
 const totalQuestions=rows.reduce((sum,x)=>sum+x.questionCount,0);
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:18,gap:14,paddingBottom:42}}>
  <View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1,color:c.green}}>CHAPTER-WISE PRACTICE</Text><Heading>{name}</Heading><Copy>Explore active chapters and start practising with the published questions available in your account.</Copy></View>
  <View style={{flexDirection:'row',gap:8}}><Panel style={{flex:1,gap:3}}><Text style={{fontSize:20,fontWeight:'900',color:c.text}}>{rows.length}</Text><Text style={{fontSize:10,color:c.textSecondary}}>Active chapters</Text></Panel><Panel style={{flex:1,gap:3}}><Text style={{fontSize:20,fontWeight:'900',color:c.text}}>{totalQuestions.toLocaleString('en-IN')}</Text><Text style={{fontSize:10,color:c.textSecondary}}>Available questions</Text></Panel></View>
  <TextInput value={search} onChangeText={setSearch} placeholder="Search chapters…" placeholderTextColor={c.textMuted} style={{borderWidth:1,borderColor:c.border,borderRadius:13,padding:13,color:c.text,backgroundColor:c.card}}/>
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:14,fontWeight:'900',color:c.text}}>Chapter catalogue</Text><Text style={{fontSize:11,color:c.textMuted}}>{filtered.length} shown</Text></View>
  {loading?<ActivityIndicator color={c.green}/>:error?<EmptyState icon="cloud-offline-outline" title="Chapters unavailable" description={error}/>:filtered.length?filtered.map((ch,i)=><Pressable key={ch.id} disabled={!ch.questionCount} onPress={()=>router.push({pathname:'/quiz',params:{subject:name,chapter:ch.name,chapterId:ch.id}})} style={({pressed})=>({backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:15,padding:14,gap:10,opacity:!ch.questionCount?.55:pressed?.75:1})}>
   <View style={{flexDirection:'row',alignItems:'center',gap:11}}><View style={{width:36,height:36,borderRadius:11,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Text style={{fontWeight:'900',fontSize:12,color:c.primary}}>{i+1}</Text></View><View style={{flex:1,gap:3}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>{ch.name}</Text><Text style={{fontSize:10,color:ch.questionCount?c.green:c.textMuted}}>{ch.questionCount?ch.questionCount+' published questions': 'Questions coming soon'} · {ch.topicCount} topics</Text></View><Ionicons name={ch.questionCount?'chevron-forward':'lock-closed-outline'} size={17} color={c.textMuted}/></View>
  </Pressable>):!loading?<EmptyState icon="book-outline" title="No chapters found" description="Active chapters will appear here when configured in the admin console."/>:null}
  <Panel style={{gap:8}}><Heading style={{fontSize:15}}>Your subject workspace</Heading><Copy>All active chapters are listed here. Chapters without published questions remain visible but cannot be started yet. Premium questions are protected by membership checks.</Copy><Button title="Back to practice" variant="secondary" onPress={()=>router.back()}/></Panel>
 </ScrollView>;
}
