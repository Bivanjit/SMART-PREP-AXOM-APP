import React,{useEffect,useMemo,useState} from 'react';
import {ScrollView,View,Text,Pressable,ActivityIndicator,ImageBackground} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel,Button,SegmentedTabs,ProgressBar,EmptyState} from '../../components/ui';

type Batch={id:string;slug:string;title:string;subtitle:string|null;description:string|null;access_tier:'free'|'premium';cover_image_path:string|null;subject_label:string|null;syllabus_summary:string|null;items:any[];enrolled:boolean;progress:number;};
type Filter='all'|'free'|'premium';
export default function Batches(){
 const {c,userId}=useTheme();const [rows,setRows]=useState<Batch[]>([]),[filter,setFilter]=useState<Filter>('all');
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[enrolling,setEnrolling]=useState<string|null>(null);
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setLoading(false);return;}try{
  const [{data:batches,error:bError},{data:enrollments},{data:progress}]=await Promise.all([
   supabase.from('batches').select('id,slug,title,subtitle,description,access_tier,cover_image_path,subject_label,syllabus_summary,display_order,batch_items(id,title,item_type,is_published,display_order)').eq('status','published').order('display_order'),
   userId?supabase.from('batch_enrollments').select('batch_id,status').eq('user_id',userId).eq('status','enrolled'):Promise.resolve({data:[]}),
   userId?supabase.from('batch_item_progress').select('batch_item_id,progress_percent,batch_items!inner(batch_id)').eq('user_id',userId):Promise.resolve({data:[]})
  ]);
  if(bError)throw bError;
  const enrolled=new Set((enrollments||[]).map((x:any)=>x.batch_id));
  const progressRows=progress||[];
  const mapped=(batches||[]).map((b:any)=>{const items=(b.batch_items||[]).filter((x:any)=>x.is_published);const p=progressRows.filter((x:any)=>items.some((i:any)=>i.id===x.batch_item_id));const pct=p.length?Math.round(p.reduce((sum:number,x:any)=>sum+Number(x.progress_percent||0),0)/Math.max(1,items.length)):0;return {...b,items,enrolled:enrolled.has(b.id),progress:pct} as Batch});
  if(live)setRows(mapped);
 }catch(e){if(live)setError(e instanceof Error?e.message:'Could not load batches.')}finally{if(live)setLoading(false)}})();return()=>{live=false}},[userId]);
 const visible=useMemo(()=>rows.filter(b=>filter==='all'||b.access_tier===filter),[rows,filter]);
 async function enroll(batch:Batch){if(!userId){router.push('/auth');return;}if(batch.access_tier==='premium'){const {data:member}=await supabase!.from('memberships').select('id').eq('user_id',userId).eq('status','active').lte('starts_at',new Date().toISOString()).gt('expires_at',new Date().toISOString()).limit(1).maybeSingle();if(!member){router.push('/payment');return;}}
  setEnrolling(batch.id);const {error}=await supabase!.from('batch_enrollments').insert({batch_id:batch.id,user_id:userId});setEnrolling(null);if(error&&error.code!=='23505'){setError(error.message);return;}setRows(old=>old.map(x=>x.id===batch.id?{...x,enrolled:true}:x));router.push({pathname:'/batch/[id]',params:{id:batch.id}});
 }
 const filters=[{label:'All Batches',value:'all' as const},{label:'Free',value:'free' as const},{label:'Premium',value:'premium' as const}];
 return <ScrollView style={{flex:1,backgroundColor:c.bg}} contentContainerStyle={{padding:17,paddingTop:14,gap:16,paddingBottom:44}}>
  <View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:c.green}}>YOUR CLASSROOM</Text><Heading>My Batches</Heading><Copy>Your learning programs, classes and preparation tracks.</Copy></View>
  <SegmentedTabs options={filters} value={filter} onChange={setFilter}/>
  {loading?<ActivityIndicator color={c.green} size="large"/>:error?<EmptyState icon="cloud-offline-outline" title="Batches unavailable" description={error}/>:null}
  {visible.length?visible.map(batch=>{const image=batch.cover_image_path?supabase?.storage.from('learning-assets').getPublicUrl(batch.cover_image_path).data.publicUrl:null;return <Panel key={batch.id} style={{padding:0,overflow:'hidden',gap:0}}>
   <ImageBackground source={image?{uri:image}:undefined} style={{height:116,backgroundColor:batch.access_tier==='free'?'#245A3C':'#32465A'}} imageStyle={{resizeMode:'cover'}}>
    <View style={{flex:1,backgroundColor:'rgba(9,25,28,.28)',padding:13,alignItems:'flex-end',justifyContent:'flex-start'}}><View style={{backgroundColor:batch.access_tier==='free'?c.green:c.amber,paddingHorizontal:10,paddingVertical:6,borderRadius:99}}><Text style={{fontSize:9,fontWeight:'900',color:'#FFFFFF'}}>{batch.access_tier.toUpperCase()}</Text></View></View>
   </ImageBackground>
   <View style={{padding:15,gap:9}}>
    <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>{batch.title}</Text>
    {batch.subtitle?<Text style={{fontSize:11,fontWeight:'800',color:c.green}}>{batch.subtitle}</Text>:null}
    <Copy>{batch.description||batch.syllabus_summary||'Course content and learning resources will appear here after the batch is configured.'}</Copy>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:10,color:c.textSecondary}}>{batch.items.length} published learning items</Text><Text style={{fontSize:10,fontWeight:'900',color:c.green}}>{batch.progress}%</Text></View>
    <ProgressBar value={batch.progress}/>
    <Button title={batch.enrolled?'Resume Learning':batch.access_tier==='premium'?'Enroll with Premium':'Enroll in Free Batch'} icon={batch.enrolled?'play':'arrow-forward'} loading={enrolling===batch.id} disabled={enrolling===batch.id} onPress={()=>batch.enrolled?router.push({pathname:'/batch/[id]',params:{id:batch.id}}):void enroll(batch)}/>
   </View>
  </Panel>}) : !loading&&!error?<EmptyState icon="school-outline" title="No published batches yet" description="Your batch catalogue is ready. The Foundation Batch, Crash Course and Chapter Wise Concept Series will appear here after they are configured and published in the admin console."/>:null}
 </ScrollView>;
}
