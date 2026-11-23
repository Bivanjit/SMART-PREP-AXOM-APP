import React,{useEffect,useState} from 'react';
import {ScrollView,ActivityIndicator,View,Text,Pressable} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel,Button} from '../../components/ui';

type TestRow={id:string;title:string;description:string|null;duration_minutes:number;total_marks:number;access_tier:string;status:string};
export default function Tests(){
 const {c,userId}=useTheme();
 const [tests,setTests]=useState<TestRow[]>([]),[canAccessPaid,setCanAccessPaid]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [filter,setFilter]=useState<'all'|'free'|'paid'>('all');
 useEffect(()=>{let active=true;void(async()=>{
  if(!supabase){setLoading(false);return}
  const {data,error}=await supabase.from('mock_tests').select('id,title,description,duration_minutes,total_marks,access_tier,status').eq('status','published').order('created_at');
  if(!active)return;if(error)setError(error.message);setTests((data||[]) as TestRow[]);
  if(userId){const {data:member}=await supabase.from('memberships').select('id').eq('user_id',userId).eq('product_code','cee_complete').eq('status','active').lte('starts_at',new Date().toISOString()).gt('expires_at',new Date().toISOString()).maybeSingle();if(active)setCanAccessPaid(Boolean(member))}
  setLoading(false);
 })();return()=>{active=false}},[userId]);
 const visible=tests.filter(t=>filter==='all'||(filter==='free'?t.access_tier==='free':t.access_tier==='premium'));
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:18,paddingTop:16,gap:16,paddingBottom:40}}>
  <View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:c.green}}>ASSESSMENT CENTRE</Text><Heading>Mock tests</Heading><Copy>Practise under timed conditions and review your performance after each submission.</Copy></View>
  <View style={{backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:17,padding:15,flexDirection:'row',alignItems:'center',gap:12}}>
   <View style={{width:43,height:43,borderRadius:13,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name="clipboard-outline" size={22} color={c.blue}/></View>
   <View style={{flex:1,gap:3}}><Text style={{fontSize:14,fontWeight:'900',color:c.text}}>Assam CEE test series</Text><Copy>Published tests follow the configured PCM exam structure.</Copy></View>
  </View>
  <View style={{flexDirection:'row',gap:8}}>{(['all','free','paid'] as const).map(x=><Pressable key={x} onPress={()=>setFilter(x)} style={{flex:1,paddingVertical:11,borderRadius:11,alignItems:'center',backgroundColor:filter===x?c.blue:c.card,borderWidth:1,borderColor:filter===x?c.blue:c.border}}><Text style={{color:filter===x?'#FFFFFF':c.text,fontWeight:'800',fontSize:12}}>{x==='all'?'All tests':x==='free'?'Free':'Premium'}</Text></Pressable>)}</View>
  {loading?<ActivityIndicator color={c.blue} size="large"/>:error?<Panel><Copy>{error}</Copy></Panel>:visible.length?visible.map(t=><Panel key={t.id} style={{gap:12}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
    <View style={{width:42,height:42,borderRadius:13,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name="document-text-outline" size={21} color={c.blue}/></View>
    <View style={{flex:1,gap:2}}><Text style={{fontSize:15,fontWeight:'900',color:c.text}}>{t.title}</Text><Text style={{fontSize:10,fontWeight:'900',color:t.access_tier==='free'?c.green:c.amber}}>{t.access_tier==='free'?'FREE TEST':'PREMIUM TEST'}</Text></View>
    <Ionicons name="chevron-forward" size={18} color={c.muted}/>
   </View>
   {t.description?<Copy>{t.description}</Copy>:null}
   <View style={{flexDirection:'row',gap:8}}>
    <View style={{flex:1,backgroundColor:c.bg,borderRadius:10,padding:10}}><Text style={{fontSize:15,fontWeight:'900',color:c.text}}>{t.duration_minutes} min</Text><Text style={{fontSize:10,color:c.muted}}>Duration</Text></View>
    <View style={{flex:1,backgroundColor:c.bg,borderRadius:10,padding:10}}><Text style={{fontSize:15,fontWeight:'900',color:c.text}}>{t.total_marks}</Text><Text style={{fontSize:10,color:c.muted}}>Total marks</Text></View>
   </View>
   <Button title={t.access_tier==='premium'&&!canAccessPaid?'View membership':'Start test'} onPress={()=>t.access_tier==='premium'&&!canAccessPaid?router.push('/payment'):router.push({pathname:'/quiz',params:{testId:t.id,testTitle:t.title,durationMinutes:String(t.duration_minutes)}})} icon={t.access_tier==='premium'&&!canAccessPaid?'lock-closed-outline':'play-outline'}/>
  </Panel>):<Panel><View style={{alignItems:'center',gap:8,paddingVertical:12}}><Ionicons name="documents-outline" size={30} color={c.muted}/><Text style={{fontWeight:'900',color:c.text}}>No published tests yet</Text><Copy style={{textAlign:'center'}}>New tests will appear here when the SmartPrep team publishes them.</Copy></View></Panel>}
 </ScrollView>;
}
