import React,{useEffect,useState} from 'react';
import {ScrollView,View,Text,ActivityIndicator,Pressable} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel,CardRow,SegmentedTabs,SubjectBadge,EmptyState} from '../../components/ui';

type SubjectRow={id:string;name:'Physics'|'Chemistry'|'Mathematics';chapters:number;questions:number};
type Tab='chapter'|'pyq'|'mixed'|'custom';
const subjectMeta={Physics:{icon:'atom-outline',tint:'#1D4ED8'},Chemistry:{icon:'flask-outline',tint:'#166534'},Mathematics:{icon:'calculator-outline',tint:'#92400E'}} as const;
export default function Practice(){
 const {c,language}=useTheme();
 const [tab,setTab]=useState<Tab>('chapter'),[rows,setRows]=useState<SubjectRow[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setLoading(false);return;}try{
  const {data:subjects,error}=await supabase.from('subjects').select('id,name').eq('is_active',true).order('display_order');
  if(error)throw error;
  const result:SubjectRow[]=[];
  for(const subject of subjects||[]){
   const {data:chapters,error:chapterError}=await supabase.from('chapters').select('id',{count:'exact'}).eq('subject_id',subject.id).eq('is_active',true);
   if(chapterError)throw chapterError;
   const ids=(chapters||[]).map((x:any)=>x.id);
   let questionCount=0;
   if(ids.length){const {count,error:qError}=await supabase.from('questions').select('id',{count:'exact',head:true}).in('chapter_id',ids).eq('is_published',true);if(qError)throw qError;questionCount=count||0;}
   if(['Physics','Chemistry','Mathematics'].includes(subject.name))result.push({id:subject.id,name:subject.name,chapters:ids.length,questions:questionCount});
  }
  if(live)setRows(result);
 }catch(e){if(live)setError(e instanceof Error?e.message:'Could not load the subject catalogue.');}finally{if(live)setLoading(false)}})();return()=>{live=false}},[]);
 const options=[{label:'By Chapter',value:'chapter' as const},{label:'PYQs',value:'pyq' as const},{label:'Mixed',value:'mixed' as const},{label:'Custom',value:'custom' as const}];
 const chooseTab=(value:Tab)=>{setTab(value);if(value==='pyq')router.push('/pyqs');if(value==='mixed')router.push({pathname:'/practice-builder',params:{type:'mixed'}});if(value==='custom')router.push({pathname:'/practice-builder',params:{type:'custom'}})};
 const subjectCards=rows.map(row=>{const meta=subjectMeta[row.name];return <Pressable key={row.id} onPress={()=>router.push({pathname:'/practice/[subject]',params:{subject:row.name,subjectId:row.id}})} style={({pressed})=>({backgroundColor:c.card,borderRadius:16,borderWidth:1,borderColor:c.border,padding:15,gap:12,opacity:pressed?.75:1})}>
  <View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{width:48,height:48,borderRadius:15,backgroundColor:row.name==='Physics'?c.physicsBg:row.name==='Chemistry'?c.chemistryBg:c.mathematicsBg,alignItems:'center',justifyContent:'center'}}><Ionicons name={meta.icon as any} size={24} color={meta.tint}/></View><View style={{flex:1,gap:4}}><Text style={{fontSize:15,fontWeight:'900',color:c.text}}>{row.name}</Text><Text style={{fontSize:11,color:c.textSecondary}}>{row.chapters} Chapters · {row.questions.toLocaleString('en-IN')} Questions</Text></View><Ionicons name="chevron-forward" size={19} color={c.textMuted}/></View>
 </Pressable>});
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:17,paddingTop:14,gap:16,paddingBottom:44}}>
  <View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:c.green}}>STUDY WORKSPACE</Text><Heading>{'Practice'}</Heading><Copy>Build concepts and master questions with structured practice.</Copy></View>
  <SegmentedTabs options={options} value={tab} onChange={chooseTab}/>
  {tab==='chapter'?<><View style={{gap:4}}><Heading style={{fontSize:17}}>Choose a subject</Heading><Copy>Open a subject to explore its chapters and published question sets.</Copy></View>{loading?<ActivityIndicator color={c.green}/>:error?<EmptyState icon="cloud-offline-outline" title="Catalogue unavailable" description={error}/>:rows.length?subjectCards:<EmptyState icon="book-outline" title="No subjects available" description="Subjects will appear here once they are enabled in the admin console."/>}</>:null}
  <View style={{gap:10}}><Heading style={{fontSize:17}}>More Practice</Heading>
   <CardRow icon="calendar-outline" title="Previous Year Questions" description="Assam CEE papers, filterable by year and subject" onPress={()=>router.push('/pyqs')}/>
   <CardRow icon="filter-outline" title="Topic-wise PYQs" description="Narrow previous-year questions by chapter and topic" onPress={()=>router.push({pathname:'/pyqs',params:{mode:'topic'}})}/>
   <CardRow icon="layers-outline" title="Mixed Practice" description="Curated question sets from multiple chapters" onPress={()=>router.push({pathname:'/practice-builder',params:{type:'mixed'}})}/>
   <CardRow icon="options-outline" title="Custom Practice" description="Build your own session by subject, chapter and difficulty" onPress={()=>router.push({pathname:'/practice-builder',params:{type:'custom'}})}/>
  </View>
  <Panel style={{gap:9}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Ionicons name="bookmark-outline" size={19} color={c.primary}/><Text style={{fontWeight:'900',color:c.text}}>Revision tools</Text></View><Copy>Review saved questions and revisit mistakes from your previous practice sessions.</Copy><View style={{flexDirection:'row',gap:9}}><Pressable onPress={()=>router.push('/saved')} style={{flex:1,padding:12,borderRadius:11,backgroundColor:c.surfaceElevated,alignItems:'center'}}><Text style={{fontSize:12,fontWeight:'800',color:c.primary}}>Saved Questions</Text></Pressable><Pressable onPress={()=>router.push('/mistakes')} style={{flex:1,padding:12,borderRadius:11,backgroundColor:c.surfaceElevated,alignItems:'center'}}><Text style={{fontSize:12,fontWeight:'800',color:c.primary}}>Mistake Notebook</Text></Pressable></View></Panel>
 </ScrollView>;
}
