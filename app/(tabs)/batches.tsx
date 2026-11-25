import React,{useEffect,useMemo,useState} from 'react';
import {ScrollView,View,Text,Pressable,ActivityIndicator,ImageBackground,useWindowDimensions} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel,Button,SegmentedTabs,ProgressBar,EmptyState} from '../../components/ui';

type Batch={id:string;slug:string;title:string;subtitle:string|null;description:string|null;access_tier:'free'|'premium';cover_image_path:string|null;subject_label:string|null;syllabus_summary:string|null;items:any[];enrolled:boolean;progress:number;hasAccess:boolean;hasMembershipAccess:boolean;};
type Filter='all'|'free'|'premium';
const assamHero='https://commons.wikimedia.org/wiki/Special:FilePath/A_Tea_Garden_of_Assam.jpg?width=1400';
export default function Batches(){
 const {c,userId}=useTheme();const {width:windowWidth}=useWindowDimensions();const [rows,setRows]=useState<Batch[]>([]),[filter,setFilter]=useState<Filter>('all');
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[enrolling,setEnrolling]=useState<string|null>(null),[planPrices,setPlanPrices]=useState<Record<string,number>>({chapter_practice:99,cee_complete:299});
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setLoading(false);return;}try{
  const [{data:batches,error:bError},{data:enrollments},{data:progress},{data:memberships},{data:plans}]=await Promise.all([
   supabase.from('batches').select('id,slug,title,subtitle,description,access_tier,cover_image_path,subject_label,syllabus_summary,display_order,batch_items(id,title,item_type,is_published,display_order)').eq('status','published').order('display_order'),
   userId?supabase.from('batch_enrollments').select('batch_id,status').eq('user_id',userId).eq('status','enrolled'):Promise.resolve({data:[]}),
   userId?supabase.from('batch_item_progress').select('batch_item_id,progress_percent,batch_items!inner(batch_id)').eq('user_id',userId):Promise.resolve({data:[]}),
   userId?supabase.from('memberships').select('product_code').eq('user_id',userId).eq('status','active').lte('starts_at',new Date().toISOString()).gt('expires_at',new Date().toISOString()):Promise.resolve({data:[]}),
   supabase.from('product_plans').select('product_code,price_inr,is_active').in('product_code',['chapter_practice','cee_complete']).eq('is_active',true)
  ]);
  if(bError)throw bError;
  const enrolled=new Set((enrollments||[]).map((x:any)=>x.batch_id));
  const progressRows=progress||[];const codes=new Set((memberships||[]).map((m:any)=>m.product_code));setPlanPrices(old=>({...old,...Object.fromEntries((plans||[]).map((p:any)=>[p.product_code,Number(p.price_inr)]))}));
  const mapped=(batches||[]).map((b:any)=>{const items=(b.batch_items||[]).filter((x:any)=>x.is_published);const p=progressRows.filter((x:any)=>items.some((i:any)=>i.id===x.batch_item_id));const pct=p.length?Math.round(p.reduce((sum:number,x:any)=>sum+Number(x.progress_percent||0),0)/Math.max(1,items.length)):0;const hasAccess=b.access_tier==='free'||(b.slug==='chapter-practice-library'&&(codes.has('chapter_practice')||codes.has('cee_complete')))||(b.slug==='cee-complete-premium'&&codes.has('cee_complete'))||(b.access_tier==='premium'&&!['chapter-practice-library','cee-complete-premium'].includes(b.slug)&&codes.has('cee_complete'));return {...b,items,enrolled:enrolled.has(b.id),progress:pct,hasAccess} as Batch});
  if(live)setRows(mapped);
 }catch(e){if(live)setError(e instanceof Error?e.message:'Could not load batches.')}finally{if(live)setLoading(false)}})();return()=>{live=false}},[userId]);
 const visible=useMemo(()=>rows.filter(b=>filter==='all'||b.access_tier===filter),[rows,filter]);
 async function enroll(batch:Batch){if(!userId){router.push('/auth');return;}if(batch.access_tier==='premium'&&!batch.hasAccess){router.push('/premium');return;}if(batch.hasMembershipAccess){router.push({pathname:'/batch/[id]',params:{id:batch.id}});return;}
  setEnrolling(batch.id);const {error}=await supabase!.from('batch_enrollments').insert({batch_id:batch.id,user_id:userId});setEnrolling(null);if(error&&error.code!=='23505'){setError(error.message);return;}setRows(old=>old.map(x=>x.id===batch.id?{...x,enrolled:true}:x));router.push({pathname:'/batch/[id]',params:{id:batch.id}});
 }
 const filters=[{label:'All Batches',value:'all' as const},{label:'Free',value:'free' as const},{label:'Premium',value:'premium' as const}];
 return <ScrollView style={{flex:1,backgroundColor:c.bg}} contentContainerStyle={{padding:17,paddingTop:14,gap:16,paddingBottom:44}}>
  <View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:c.green}}>YOUR CLASSROOM</Text><Heading>My Batches</Heading><Copy>Your learning programs, classes and preparation tracks.</Copy></View>
  <SegmentedTabs options={filters} value={filter} onChange={setFilter}/>
  {loading?<ActivityIndicator color={c.green} size="large"/>:error?<EmptyState icon="cloud-offline-outline" title="Batches unavailable" description={error}/>:null}
  {visible.length?visible.map(batch=>{const image=batch.cover_image_path?supabase?.storage.from('learning-assets').getPublicUrl(batch.cover_image_path).data.publicUrl:null;return <Panel key={batch.id} style={{padding:0,overflow:'hidden',gap:0}}>
   <ImageBackground source={image?{uri:image}:{uri:assamHero}} resizeMode="contain" style={{width:'100%',height:Math.round((windowWidth-34)/3.32),borderTopLeftRadius:16,borderTopRightRadius:16,overflow:'hidden',backgroundColor:batch.access_tier==='free'?'#245A3C':'#182B46'}} imageStyle={{resizeMode:'contain',borderTopLeftRadius:16,borderTopRightRadius:16}}>
    <View style={{position:'absolute',top:12,right:12,backgroundColor:batch.access_tier==='free'?c.green:c.amber,paddingHorizontal:11,paddingVertical:7,borderRadius:99}}><Text style={{fontSize:9,fontWeight:'900',color:'#FFFFFF'}}>{batch.access_tier.toUpperCase()}</Text></View>
   </ImageBackground>
   <View style={{padding:15,gap:9}}>
    <Text style={{fontSize:15,fontWeight:'900',color:c.text}}>{batch.title}</Text>
    {batch.subtitle?<Text style={{fontSize:11,fontWeight:'800',color:c.green}}>{batch.subtitle}</Text>:null}
    <Copy>{batch.description||batch.syllabus_summary||'Course content and learning resources will appear here after the batch is configured.'}</Copy>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:10,color:c.textSecondary}}>{batch.access_tier==='premium'&&!batch.hasAccess?'Premium learning content':`${batch.items.length} published ${batch.items.length===1?'learning item':'learning items'}`}</Text><Text style={{fontSize:10,fontWeight:'900',color:c.green}}>{batch.progress}%</Text></View>
    <ProgressBar value={batch.progress}/>
    <Button title={batch.enrolled?'Resume Learning':batch.access_tier==='premium'?(batch.hasMembershipAccess?'Open included access':batch.slug==='chapter-practice-library'?'Unlock · ₹'+planPrices.chapter_practice:'Unlock · ₹'+planPrices.cee_complete):'Enroll in Free Batch'} icon={batch.enrolled?'play':'arrow-forward'} loading={enrolling===batch.id} disabled={enrolling===batch.id} onPress={()=>batch.enrolled?router.push({pathname:'/batch/[id]',params:{id:batch.id}}):void enroll(batch)}/>
   </View>
  </Panel>}) : !loading&&!error?<EmptyState icon="school-outline" title="No published batches yet" description="Your batch catalogue is ready. The Foundation Batch, Crash Course and Chapter Wise Concept Series will appear here after they are configured and published in the admin console."/>:null}
 </ScrollView>;
}
