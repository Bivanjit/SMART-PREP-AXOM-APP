import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,RefreshControl,ScrollView,Text,TextInput,View} from 'react-native';
import {Stack,useLocalSearchParams,router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '../app/_layout';
import {supabase} from '../lib/supabase';

type Row=Record<string,any>;
const slug=(v:string)=>v.toLowerCase().replace(/[^a-z]+/g,'-');
const fmt=(n:any)=>Number(n||0).toLocaleString('en-IN');
const titleFor=(path:string)=>({
 '/analytics':'Intelligence Dashboard','/analytics/pyq-analysis':'Chapter-wise PYQ Trends','/cee-outlook':'CEE Chapter Outlook','/analytics/exam-difficulty':'Exam Difficulty','/analytics/cee-2027-predictions':'CEE 2027 Predictions','/predictor/rank':'Rank Predictor','/predictor/marks-to-rank':'Marks-to-Rank','/predictor/college':'College Predictor','/analytics/college-cutoff-analysis':'College Cutoff Explorer','/cee-tools':'Workspace Home','/daily-10':'Daily 10','/practice-arena':'Practice Arena','/chapter-intelligence':'Chapter Intelligence','/my-college-path':'Preference Simulator','/admission-navigator':'Admission Navigator','/my-cee-journey':'My CEE Journey','/my-target-card':'My CEE Target Card'
} as Record<string,string>)[path]||'CEE Workspace';
function Action({label,onPress,colors,icon='arrow-forward'}:{label:string;onPress:()=>void;colors:any;icon?:any}){return <Pressable onPress={onPress} style={({pressed})=>({flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:14,borderRadius:14,backgroundColor:colors.soft,opacity:pressed?.8:1})}><Text style={{fontSize:13,fontWeight:'800',color:colors.text}}>{label}</Text><Ionicons name={icon} size={18} color={colors.blue}/></Pressable>}
export default function CEEToolNative(){
 const {path}=useLocalSearchParams<{path?:string}>();const route=typeof path==='string'?path:'/analytics';const title=titleFor(route);const {c,mode,userId}=useTheme();
 const [loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState(''),[rows,setRows]=useState<Row[]>([]),[annual,setAnnual]=useState<Row[]>([]),[versions,setVersions]=useState<Row[]>([]),[extra,setExtra]=useState<Row[]>([]);
 const [subject,setSubject]=useState('Physics'),[search,setSearch]=useState(''),[score,setScore]=useState(''),[rank,setRank]=useState(''),[college,setCollege]=useState(''),[branch,setBranch]=useState(''),[category,setCategory]=useState(''),[answer,setAnswer]=useState<Record<string,number>>({}),[submitted,setSubmitted]=useState(false),[submitting,setSubmitting]=useState(false),[challengeResult,setChallengeResult]=useState<Row|null>(null);
 const load=useCallback(async()=>{
  if(!supabase){setError('SmartPrep database is not configured in this build.');setLoading(false);return;}
  setError('');
  try{
   const isPrediction=route.includes('prediction');
   const isAdmission=route.includes('college')||route.includes('cutoff')||route.includes('my-college-path');
   const jobs:any[]=[
    supabase.from('analytics_dataset_versions').select('id,version,label,source_description,created_at').eq('dataset_key','cee_paper_analysis').eq('status','published').order('created_at',{ascending:false}).limit(1),
    supabase.from('cee_chapter_aggregate_analytics').select('subject,chapter,total_questions_9yr,avg_questions_per_year,avg_subject_weightage_pct,avg_overall_weightage_pct,min_questions,max_questions,years_appeared,priority_tier').order('total_questions_9yr',{ascending:false}).limit(300),
    supabase.from('cee_chapter_year_analytics').select('exam_year,subject,chapter,question_count,weightage_percent_subject,difficulty_label,question_numbers').order('exam_year',{ascending:true}).limit(1000)
   ];
   if(isPrediction)jobs.push(supabase.from('prediction_versions').select('id,version,label,model_type,source_description').eq('status','published').order('created_at',{ascending:false}).limit(1));
   if(isAdmission)jobs.push(supabase.from('engineering_institutions').select('id,name,city').eq('is_active',true).order('name'),supabase.from('engineering_branches').select('id,name').eq('is_active',true).order('name'),supabase.from('admission_categories').select('id,name,code').order('name'));
   const results=await Promise.all(jobs);
   for(const r of results){if(r.error)throw r.error;}
   setVersions(isPrediction?(results[3]?.data||[]):(results[0].data||[]));setRows(results[1].data||[]);setAnnual(results[2].data||[]);
   const rest=results.slice(3).flatMap((r:any)=>r.data||[]);setExtra(rest);
   if(isPrediction&&results[3]?.data?.[0]){const {data,error}=await supabase.from('chapter_predictions').select('subject_slug,chapter_name,predicted_questions,likelihood,confidence,rationale').eq('prediction_version_id',results[3].data[0].id).order('predicted_questions',{ascending:false});if(error)throw error;setExtra(data||[]);}
   if(route==='/daily-10'){
    const {data,error}=await supabase.rpc('get_website_daily_challenge');if(error)throw error;
    if(!data)throw new Error("Today's Daily 10 is not published yet.");
    const qs=Array.isArray(data.questions)?data.questions:[];
    if(qs.length!==10)throw new Error("Today's Daily 10 is being prepared. Please try again shortly.");
    setExtra([{challenge:data,questions:qs}]);
   }
   if(route==='/predictor/rank'||route==='/predictor/marks-to-rank'){
    const {data,error}=await supabase.from('cee_score_rank_points').select('exam_year,total_marks,score,merit_rank').order('exam_year',{ascending:false}).limit(1000);if(error)throw error;setExtra(data||[]);
   }
   if(route==='/analytics/college-cutoff-analysis'||route==='/predictor/college'||route==='/my-college-path'){
    const {data,error}=await supabase.from('admission_cutoffs').select('admission_year,opening_rank,closing_rank,quota_code,verification_status,engineering_institutions(name),engineering_branches(name),admission_categories(name)').eq('verification_status','verified').order('admission_year',{ascending:false}).limit(500);
    if(error)throw error;setExtra(prev=>[...prev,...(data||[])]);
   }
  }catch(e:any){setError(e?.message||'Could not load CEE data. Please retry.');}
  finally{setLoading(false);setRefreshing(false);}
 },[route]);
 useEffect(()=>{setLoading(true);void load()},[load]);
 const refresh=()=>{setRefreshing(true);void load()};
 const filtered=useMemo(()=>rows.filter(r=>(route==='/analytics'||route==='/analytics/pyq-analysis'||route==='/cee-outlook'||route==='/chapter-intelligence'||route==='/analytics/exam-difficulty'?true:r.subject===subject)&&String(r.chapter||'').toLowerCase().includes(search.toLowerCase())),[rows,route,subject,search]);
 const total=filtered.reduce((n,r)=>n+Number(r.total_questions_9yr||0),0);
 const rankEstimate=useMemo(()=>{const marks=Number(score);if(!Number.isFinite(marks)||!extra.length)return null;const ordered=[...extra].sort((a,b)=>Math.abs(Number(a.score)-marks)-Math.abs(Number(b.score)-marks));return ordered[0]||null},[score,extra]);
 const card=(label:string,value:string,sub?:string)=><View key={label} style={{flex:1,minWidth:'43%',padding:14,borderRadius:16,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:5}}><Text style={{fontSize:10,color:c.textSecondary,fontWeight:'700'}}>{label}</Text><Text style={{fontSize:22,color:c.text,fontWeight:'900'}}>{value}</Text>{!!sub&&<Text style={{fontSize:10,color:c.textMuted}}>{sub}</Text>}</View>;
 const panel=(heading:string,children:React.ReactNode)=><View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:12}}><Text style={{fontSize:15,fontWeight:'900',color:c.text}}>{heading}</Text>{children}</View>;
 const pill=(value:string,selected:boolean,onPress:()=>void)=><Pressable key={value} onPress={onPress} style={{paddingHorizontal:13,paddingVertical:9,borderRadius:30,backgroundColor:selected?c.blue:c.soft,borderWidth:1,borderColor:selected?c.blue:c.border}}><Text style={{fontSize:11,fontWeight:'800',color:selected?'#FFFFFF':c.textSecondary}}>{value}</Text></Pressable>;
 const field=(label:string,value:string,set:(v:string)=>void,placeholder:string,keyboardType:any='default')=><View style={{gap:6}}><Text style={{fontSize:11,fontWeight:'800',color:c.textSecondary}}>{label}</Text><TextInput value={value} onChangeText={set} placeholder={placeholder} placeholderTextColor={c.textMuted} keyboardType={keyboardType} style={{backgroundColor:c.input,color:c.text,borderWidth:1,borderColor:c.border,borderRadius:12,paddingHorizontal:13,paddingVertical:11,fontSize:14}}/></View>;
 const body=()=>{
  if(route==='/daily-10'){
   const bundle=extra[0],qs=bundle?.questions||[];
   const finish=async()=>{
    if(!supabase||!bundle?.challenge||submitting||challengeResult)return;
    setSubmitting(true);
    try{
     const {data,error}=await supabase.rpc('submit_website_daily_challenge',{p_challenge_id:bundle.challenge.id,p_answers:answer});
     if(error)throw error;
     setChallengeResult(data);setSubmitted(true);
    }catch(e:any){setError(e?.message||'Could not submit the challenge. Please retry.');}
    finally{setSubmitting(false);}
   };
   return (
    <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:12}}>
     <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Daily 10 challenge</Text>
     <Text style={{fontSize:12,color:c.textSecondary}}>10 questions · PCM · 40 maximum marks</Text>
     {qs.map((q:Row,i:number)=>(
      <View key={q.id||i} style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:c.border,gap:8}}>
       <Text style={{fontSize:12,fontWeight:'900',color:c.blue}}>Q{i+1} · {q.subject} · {q.chapter||'Mixed practice'}</Text>
       <Text style={{fontSize:14,color:c.text,lineHeight:21}}>{q.prompt}</Text>
       {(q.options||[]).map((opt:string,j:number)=>(
        <Pressable key={j} disabled={submitted} onPress={()=>setAnswer(v=>({...v,[q.id]:j}))} style={{padding:11,borderRadius:11,borderWidth:1,borderColor:answer[q.id]===j?c.blue:c.border,backgroundColor:answer[q.id]===j?c.soft:c.input}}>
         <Text style={{fontSize:12,color:c.text,fontWeight:'700'}}>{String.fromCharCode(65+j)}. {opt}</Text>
        </Pressable>
       ))}
      </View>
     ))}
     <Pressable disabled={submitting||submitted||Object.keys(answer).length===0} onPress={()=>void finish()} style={{backgroundColor:c.blue,padding:14,borderRadius:12,alignItems:'center',opacity:submitting||submitted?0.6:1}}>
      <Text style={{color:'#fff',fontWeight:'900'}}>{submitting?'Submitting…':submitted?'Submitted':'Submit challenge'}</Text>
     </Pressable>
     {challengeResult?(
      <View style={{padding:14,borderRadius:14,backgroundColor:c.soft,gap:5}}>
       <Text style={{fontSize:10,fontWeight:'900',color:c.green}}>YOUR RESULT</Text>
       <Text style={{fontSize:25,fontWeight:'900',color:c.text}}>{fmt(challengeResult.score)} / 40</Text>
       <Text style={{fontSize:11,color:c.textSecondary}}>{fmt(challengeResult.correct)} correct · {fmt(challengeResult.wrong)} incorrect · {fmt(challengeResult.unanswered)} unanswered</Text>
      </View>
     ):null}
    </View>
   );
  }
  if(route==='/predictor/rank'||route==='/predictor/marks-to-rank'){
   return (
    <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:12}}>
     <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Estimate your rank</Text>
     {field('Expected marks',score,setScore,'Enter your CEE marks','decimal-pad')}
     {field('Exam year reference',rank,setRank,'e.g. 2026','numeric')}
     {rankEstimate?(
      <View style={{backgroundColor:c.soft,padding:14,borderRadius:14,gap:4}}>
       <Text style={{color:c.textSecondary,fontSize:11}}>Nearest historical reference · {rankEstimate.exam_year}</Text>
       <Text style={{color:c.text,fontSize:26,fontWeight:'900'}}>Rank {fmt(rankEstimate.merit_rank)}</Text>
       <Text style={{color:c.textSecondary,fontSize:11}}>At {fmt(rankEstimate.score)} marks · historical comparison, not a guaranteed prediction</Text>
      </View>
     ):<Text style={{fontSize:11,color:c.textMuted}}>Enter marks to compare with published historical score–rank data.</Text>}
     {card('Reference points',fmt(extra.length),'Published score–rank records')}
    </View>
   );
  }
  if(route==='/predictor/college'||route==='/analytics/college-cutoff-analysis'||route==='/my-college-path'){
   const cutoffs=extra.filter(x=>x.closing_rank);
   const filteredCuts=cutoffs.filter(x=>(!college||JSON.stringify(x).toLowerCase().includes(college.toLowerCase()))&&(!branch||JSON.stringify(x.engineering_branches||'').toLowerCase().includes(branch.toLowerCase()))&&(!category||String(x.admission_categories?.name||'').toLowerCase().includes(category.toLowerCase())||String(x.admission_categories?.code||'').toLowerCase().includes(category.toLowerCase())));
   return (
    <View style={{gap:14}}>
     <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:12}}>
      <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Admission filters</Text>
      {field('Search college',college,setCollege,'Type college name')}
      {field('Search branch',branch,setBranch,'Type branch name')}
      {field('Category',category,setCategory,'e.g. OPEN / OBC / SC')}
     </View>
     <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:10}}>
      <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Verified historical cutoffs</Text>
      {filteredCuts.length?filteredCuts.slice(0,50).map((x,i)=>(
       <View key={i} style={{paddingVertical:10,borderBottomWidth:1,borderBottomColor:c.border,gap:3}}>
        <Text style={{color:c.text,fontWeight:'900',fontSize:13}}>{x.engineering_institutions?.name||'Engineering college'}</Text>
        <Text style={{color:c.textSecondary,fontSize:11}}>{x.engineering_branches?.name||'Branch'} · {x.admission_categories?.name||'Category'} · {x.admission_year}</Text>
        <Text style={{color:c.blue,fontWeight:'900',fontSize:13}}>Closing rank: {fmt(x.closing_rank)}</Text>
       </View>
      )):<Text style={{color:c.textSecondary,fontSize:12}}>No verified cutoff rows match these filters yet. Only verified records are displayed.</Text>}
     </View>
    </View>
   );
  }
  if(route==='/admission-navigator'){
   const tasks=['Keep your CEE admit card and score/rank details ready','Check DTE Assam counselling notifications and schedules','Prepare Class 10 and 12 marksheets and certificates','Keep category / reservation certificates ready where applicable','Review college, branch, category and round-wise cutoff references'];
   return (
    <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:12}}>
     <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Counselling checklist</Text>
     {tasks.map((task,i)=><Text key={i} style={{color:c.textSecondary,fontSize:12,lineHeight:20}}>• {task}</Text>)}
     <Text style={{fontSize:13,fontWeight:'900',color:c.text}}>Official admission source</Text>
     <Text style={{color:c.textSecondary,fontSize:12}}>Use the Directorate of Technical Education, Assam official website for current counselling notices and documents. Verify dates and eligibility from the current notice.</Text>
    </View>
   );
  }
  if(route==='/practice-arena'){
   return (
    <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:12}}>
     <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Choose a subject</Text>
     {['Physics','Chemistry','Mathematics'].map(subjectName=>(
      <Action key={subjectName} label={subjectName+' practice'} colors={c} onPress={()=>router.push({pathname:'/practice/[subject]',params:{subject:subjectName.toLowerCase()}} as never)} icon="book-outline"/>
     ))}
    </View>
   );
  }
  if(route==='/my-cee-journey'){
   return (
    <View style={{padding:16,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:12}}>
     <Text style={{color:c.text,fontWeight:'900',fontSize:15}}>Your preparation journey</Text>
     <Text style={{color:c.textSecondary,fontSize:12,lineHeight:19}}>Keep your daily study routine consistent. Use the study timer, planner, saved questions and practice history to track progress.</Text>
     <Action label="Open study planner" colors={c} onPress={()=>router.push('/planner')}/>
     <Action label="Open practice history" colors={c} onPress={()=>router.push('/(tabs)/insights' as never)}/>
    </View>
   );
  }
  if(route==='/my-target-card'){
   return (
    <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:12}}>
     <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Your CEE target</Text>
     {field('Your target rank',rank,setRank,'e.g. 500','numeric')}
     {field('Your target marks',score,setScore,'e.g. 120','numeric')}
     <View style={{padding:16,backgroundColor:c.soft,borderRadius:14,alignItems:'center',gap:5}}>
      <Text style={{fontSize:10,fontWeight:'900',letterSpacing:1,color:c.green}}>SMARTPREP AXOM · ASSAM CEE 2027</Text>
      <Text style={{fontSize:22,fontWeight:'900',color:c.text}}>MY CEE TARGET</Text>
      <Text style={{fontSize:17,color:c.blue,fontWeight:'900'}}>Rank {rank||'—'} · {score||'—'} marks</Text>
     </View>
    </View>
   );
  }
  if(route==='/analytics/cee-2027-predictions'){
   const predictionRows=extra.filter(x=>x.chapter_name);
   return (
    <View style={{gap:14}}>
     <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:6}}>
      <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Published prediction model</Text>
      <Text style={{color:c.text,fontWeight:'900'}}>{versions[0]?.label||versions[0]?.version||'No published model'}</Text>
      <Text style={{color:c.textSecondary,fontSize:11}}>{versions[0]?.source_description||'Prediction data is published by SmartPrep administrators.'}</Text>
     </View>
     <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:10}}>
      <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Chapter priority signals</Text>
      {predictionRows.length?predictionRows.map((r,i)=>(
       <View key={i} style={{paddingVertical:8,borderBottomWidth:1,borderBottomColor:c.border}}>
        <Text style={{color:c.text,fontWeight:'900'}}>{r.chapter_name}</Text>
        <Text style={{color:c.textSecondary,fontSize:11}}>{r.subject_slug} · {r.predicted_questions} predicted questions · {r.likelihood} likelihood</Text>
       </View>
      )):<Text style={{color:c.textSecondary,fontSize:12}}>Prediction records are not available in the published dataset.</Text>}
     </View>
    </View>
   );
  }
  const isChapter=['/analytics','/analytics/pyq-analysis','/cee-outlook','/analytics/exam-difficulty','/chapter-intelligence'].includes(route);
  const difficultyCounts=annual.filter(x=>(subject==='All'||x.subject===subject)&&x.difficulty_label).reduce((acc:any,x:any)=>{const key=String(x.difficulty_label).toLowerCase();acc[key]=(acc[key]||0)+Number(x.question_count||0);return acc;},{});
  if(isChapter){
   const subjectOptions=['Physics','Chemistry','Mathematics'];
   const list=filtered.sort((a,b)=>Number(b.total_questions_9yr||0)-Number(a.total_questions_9yr||0));
   return (
    <View style={{gap:14}}>
     <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:12}}>
      <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Explore by subject</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
       {(['All subjects',...subjectOptions]).map(name=>pill(name,(name==='All subjects'&&subject==='All')||name===subject,()=>setSubject(name==='All subjects'?'All':name)))}
      </View>
      {route==='/analytics/exam-difficulty'?(
       <View style={{gap:8}}>
        <Text style={{fontSize:13,fontWeight:'900',color:c.text}}>Question difficulty distribution</Text>
        {Object.keys(difficultyCounts).length?Object.entries(difficultyCounts).map(([key,value]:any)=>card(key,fmt(value),'classified questions')):<Text style={{color:c.textSecondary,fontSize:12}}>Difficulty labels are not yet published for this selection.</Text>}
       </View>
      ):null}
     </View>
     {field('Find a chapter',search,setSearch,'Search chapter name')}
     <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:10}}>
      <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>{route==='/analytics/exam-difficulty'?'Chapter coverage':'Chapter frequency & weightage'}</Text>
      {list.length?list.slice(0,100).map((r,i)=>(
       <View key={r.chapter+r.subject} style={{paddingVertical:10,borderBottomWidth:1,borderBottomColor:c.border,gap:5}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',gap:8}}>
         <Text style={{flex:1,color:c.text,fontWeight:'900',fontSize:13}}>{r.chapter}</Text>
         <Text style={{color:c.blue,fontWeight:'900'}}>{fmt(r.total_questions_9yr)} Q</Text>
        </View>
        <Text style={{color:c.textSecondary,fontSize:11}}>{r.subject} · {r.years_appeared||'—'}/9 years · {Number(r.avg_subject_weightage_pct||0).toFixed(1)}% avg subject weightage</Text>
        <View style={{height:6,backgroundColor:c.soft,borderRadius:6,overflow:'hidden'}}>
         <View style={{height:6,width:(Math.min(100,Number(r.avg_subject_weightage_pct||0)*4)+'%') as `${number}%`,backgroundColor:c.green,borderRadius:6}}/>
        </View>
       </View>
      )):<Text style={{color:c.textSecondary,fontSize:12}}>No published chapter records found for this selection.</Text>}
     </View>
    </View>
   );
  }
  return (
   <View style={{padding:15,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:10}}>
    <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Workspace tools</Text>
    <Action label="Daily 10 challenge" colors={c} onPress={()=>router.push({pathname:'/cee-tool',params:{path:'/daily-10'}} as never)}/>
    <Action label="Practice Arena" colors={c} onPress={()=>router.push({pathname:'/cee-tool',params:{path:'/practice-arena'}} as never)}/>
    <Action label="Chapter Intelligence" colors={c} onPress={()=>router.push({pathname:'/cee-tool',params:{path:'/chapter-intelligence'}} as never)}/>
    <Action label="Preference Simulator" colors={c} onPress={()=>router.push({pathname:'/cee-tool',params:{path:'/my-college-path'}} as never)}/>
    <Action label="Admission Navigator" colors={c} onPress={()=>router.push({pathname:'/cee-tool',params:{path:'/admission-navigator'}} as never)}/>
    <Action label="My CEE Journey" colors={c} onPress={()=>router.push({pathname:'/cee-tool',params:{path:'/my-cee-journey'}} as never)}/>
    <Action label="My CEE Target Card" colors={c} onPress={()=>router.push({pathname:'/cee-tool',params:{path:'/my-target-card'}} as never)}/>
   </View>
  );
 };
 const isBusy=loading||refreshing;
 return (
  <View style={{flex:1,backgroundColor:c.bg}}>
   <Stack.Screen options={{title,headerStyle:{backgroundColor:c.bg},headerTintColor:c.text}}/>
   <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:36,gap:14}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.green}/>}>
     <View style={{gap:7,paddingBottom:4}}>
      <Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.5,color:c.green}}>SMARTPREP AXOM · ASSAM CEE 2027</Text>
      <Text style={{fontSize:26,fontWeight:'900',letterSpacing:-.6,color:c.text}}>{title}</Text>
      <Text style={{fontSize:12,lineHeight:19,color:c.textSecondary}}>Explore published Assam CEE data, chapter patterns and preparation tools.</Text>
     </View>
     <View style={{padding:12,borderRadius:14,backgroundColor:c.surfaceElevated,flexDirection:'row',alignItems:'center',gap:9}}>
      <Ionicons name="cloud-done-outline" size={19} color={c.green}/>
      <Text style={{flex:1,fontSize:10,lineHeight:16,color:c.textSecondary}}>Native app interface · Shared SmartPrep Supabase data · {mode==='dark'?'Dark':'Light'} theme</Text>
     </View>
     {isBusy ? (
      <View style={{padding:30,alignItems:'center',gap:10}}><ActivityIndicator color={c.green} size="large"/><Text style={{color:c.textSecondary,fontSize:12}}>Loading SmartPrep data…</Text></View>
     ) : error ? (
      <View style={{padding:16,borderRadius:16,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:9}}>
       <Ionicons name="cloud-offline-outline" size={24} color={c.red}/>
       <Text style={{color:c.text,fontWeight:'900'}}>Unable to load this tool</Text>
       <Text style={{color:c.textSecondary,fontSize:12,lineHeight:18}}>{error}</Text>
       <Action label="Retry" colors={c} onPress={refresh} icon="refresh"/>
      </View>
     ) : (
      <View style={{gap:14}}>
       {(route==='/analytics'||route==='/analytics/pyq-analysis'||route==='/cee-outlook'||route==='/chapter-intelligence') ? (
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:9}}>{card('Chapters',fmt(rows.length),'Published aggregate rows')}{card('Historical questions',fmt(total),'Across selected chapters')}</View>
       ) : null}
       {body()}
      </View>
     )}
    </ScrollView>
   </KeyboardAvoidingView>
  </View>
 );
}