import React,{useEffect,useMemo,useState} from 'react';
import {ScrollView,View,Text,Pressable,ActivityIndicator,TextInput} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../lib/supabase';
import {useTheme} from './_layout';
import {Heading,Copy,Panel,SegmentedTabs,EmptyState,Button,SubjectBadge} from '../components/ui';

type QuestionRow={id:string;chapter_id:string;prompt:string;difficulty:string;source_year:number|null;source_exam:string|null;chapters?:{name:string;subjects?:{name:string}}};
type Paper={id:string;title:string;exam_year:number;description:string|null;duration_minutes:number;total_marks:number;access_tier:string};
export default function PYQs(){
 const {c,language}=useTheme();const params=useLocalSearchParams<{mode?:string}>();
 const [rows,setRows]=useState<QuestionRow[]>([]),[papers,setPapers]=useState<Paper[]>([]),[chapters,setChapters]=useState<any[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const [year,setYear]=useState('all'),[subject,setSubject]=useState('All'),[difficulty,setDifficulty]=useState('all'),[chapter,setChapter]=useState('all'),[search,setSearch]=useState('');
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setLoading(false);return;}try{
  const [q,p,ch]=await Promise.all([
   supabase.from('questions').select('id,chapter_id,prompt,difficulty,source_year,source_exam,chapters(name,subjects(name))').eq('is_published',true).eq('source_type','pyq').order('source_year',{ascending:false}).limit(1000),
   supabase.from('pyq_papers').select('id,title,exam_year,description,duration_minutes,total_marks,access_tier').eq('status','published').order('exam_year',{ascending:false}),
   supabase.from('chapters').select('id,name,subjects(name)').eq('is_active',true).order('display_order')
  ]);
  if(q.error)throw q.error;if(p.error)throw p.error;if(ch.error)throw ch.error;
  if(live){setRows((q.data||[]) as any);setPapers((p.data||[]) as Paper[]);setChapters(ch.data||[]);}
 }catch(e){if(live)setError(e instanceof Error?e.message:'Could not load PYQs.')}finally{if(live)setLoading(false)}})();return()=>{live=false}},[]);
 const years=useMemo(()=>Array.from(new Set(rows.map(x=>x.source_year).filter(Boolean))).sort((a,b)=>Number(b)-Number(a)).map(String),[rows]);
 const filtered=useMemo(()=>rows.filter(q=>(year==='all'||String(q.source_year)===year)&&(subject==='All'||q.chapters?.subjects?.name===subject)&&(chapter==='all'||q.chapter_id===chapter)&&(difficulty==='all'||q.difficulty===difficulty)&&(!search||q.prompt.toLowerCase().includes(search.toLowerCase()))),[rows,year,subject,chapter,difficulty,search]);
 const subjectOptions=[{label:'All',value:'All'},{label:'Physics',value:'Physics'},{label:'Chemistry',value:'Chemistry'},{label:'Mathematics',value:'Mathematics'}];
 const startIds=(ids:string[],title:string)=>{if(!ids.length)return;router.push({pathname:'/quiz',params:{questionIds:JSON.stringify(ids),testTitle:title}})};
 async function startPaper(p:Paper){if(!supabase)return;const {data,error}=await supabase.from('pyq_paper_questions').select('question_id').eq('paper_id',p.id).order('question_order');if(error){setError(error.message);return;}startIds((data||[]).map(x=>x.question_id),p.title);}
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:17,paddingTop:12,gap:15,paddingBottom:42}}>
  <View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:c.green}}>ASSAM CEE · PREVIOUS YEAR QUESTIONS</Text><Heading>PYQ Archive</Heading><Copy>Explore verified previous-year questions and papers. Only content published by the admin appears here.</Copy></View>
  {loading?<ActivityIndicator color={c.green} size="large"/>:error?<EmptyState icon="cloud-offline-outline" title="Could not load the archive" description={error}/>:null}
  {papers.length>0?<View style={{gap:9}}><Heading style={{fontSize:17}}>Published papers</Heading>{papers.map(p=><Panel key={p.id} style={{gap:9}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:40,height:40,borderRadius:12,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Ionicons name="document-text-outline" size={21} color={c.primary}/></View><View style={{flex:1,gap:2}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>{p.title}</Text><Text style={{fontSize:10,color:c.textSecondary}}>Assam CEE {p.exam_year} · {p.duration_minutes} min · {p.total_marks} marks</Text></View><Text style={{fontSize:9,fontWeight:'900',color:p.access_tier==='free'?c.green:c.amber}}>{p.access_tier.toUpperCase()}</Text></View>{p.description?<Copy>{p.description}</Copy>:null}<Button title="Start paper" onPress={()=>void startPaper(p)} icon="play-outline"/></Panel>)}</View>:null}
  <View style={{gap:9}}><Heading style={{fontSize:17}}>Filter questions</Heading><TextInput value={search} onChangeText={setSearch} placeholder="Search question text…" placeholderTextColor={c.textMuted} style={{borderWidth:1,borderColor:c.border,backgroundColor:c.card,color:c.text,borderRadius:12,padding:13,fontSize:13}}/>
   <Text style={{fontSize:11,fontWeight:'800',color:c.textSecondary}}>Subject</Text><SegmentedTabs options={subjectOptions} value={subject} onChange={setSubject}/>
   <Text style={{fontSize:11,fontWeight:'800',color:c.textSecondary}}>Year</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7}}>{['all',...years].map(y=><Pressable key={y} onPress={()=>setYear(y)} style={{paddingHorizontal:13,paddingVertical:9,borderRadius:99,backgroundColor:year===y?c.green:c.card,borderWidth:1,borderColor:year===y?c.green:c.border}}><Text style={{fontSize:11,fontWeight:'800',color:year===y?'#FFFFFF':c.text}}>{y==='all'?'All years':y}</Text></Pressable>)}</ScrollView>
   <Text style={{fontSize:11,fontWeight:'800',color:c.textSecondary}}>Chapter</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7}}>{[{id:'all',name:'All chapters'},...chapters.filter(x=>subject==='All'||x.subjects?.name===subject)].map(x=><Pressable key={x.id} onPress={()=>setChapter(x.id)} style={{paddingHorizontal:12,paddingVertical:9,borderRadius:99,backgroundColor:chapter===x.id?c.green:c.card,borderWidth:1,borderColor:chapter===x.id?c.green:c.border}}><Text style={{fontSize:10,fontWeight:'800',color:chapter===x.id?'#FFFFFF':c.text}}>{x.name}</Text></Pressable>)}</ScrollView>
   <Text style={{fontSize:11,fontWeight:'800',color:c.textSecondary}}>Difficulty</Text><SegmentedTabs options={[{label:'All',value:'all'},{label:'Easy',value:'easy'},{label:'Medium',value:'medium'},{label:'Hard',value:'hard'}]} value={difficulty} onChange={setDifficulty}/>
  </View>
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Heading style={{fontSize:17}}>Questions</Heading><Text style={{fontSize:11,fontWeight:'800',color:c.green}}>{filtered.length} available</Text></View>
  {filtered.length?filtered.slice(0,30).map(q=><Panel key={q.id} style={{gap:8}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><SubjectBadge subject={(q.chapters?.subjects?.name||'Physics') as any}/><Text style={{fontSize:10,color:c.textMuted}}>{q.source_year||'Year not tagged'} · {q.difficulty}</Text></View><Text style={{fontSize:13,lineHeight:20,color:c.text}}>{q.prompt}</Text><Text style={{fontSize:10,color:c.textSecondary}}>{q.chapters?.name||'Chapter not tagged'}</Text></Panel>):!loading?<EmptyState icon="archive-outline" title="No PYQs match these filters" description="The archive will populate when PYQ questions are uploaded, tagged with their exam year and published in the admin console."/>:null}
  {filtered.length>0?<Button title={'Start filtered practice · '+filtered.length+' questions'} onPress={()=>startIds(filtered.map(x=>x.id),'Assam CEE PYQ Practice')} icon="play-outline"/>:null}
 </ScrollView>;
}
