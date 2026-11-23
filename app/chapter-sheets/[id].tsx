import React,{useEffect,useMemo,useState} from 'react';
import {ScrollView,View,Text,Pressable,ActivityIndicator} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel,Button,EmptyState} from '../../components/ui';

type Q={id:string};
export default function ChapterSheets(){
 const {c,userId,language}=useTheme();
 const {id,chapter,subject}=useLocalSearchParams<{id:string;chapter:string;subject:string}>();
 const [ids,setIds]=useState<string[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[premium,setPremium]=useState(false),[tier,setTier]=useState<'free'|'premium'>('free');
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setError('Backend is not configured.');setLoading(false);return;}try{
  const [{data:ch,error:ce},{data:q,error:qe},{data:m}]=await Promise.all([
   supabase.from('chapters').select('access_tier').eq('id',String(id)).maybeSingle(),
   supabase.from('questions').select('id').eq('chapter_id',String(id)).eq('is_published',true).eq('language',language).order('created_at'),
   userId?supabase.from('memberships').select('id').eq('user_id',userId).in('product_code',['chapter_practice','cee_complete']).eq('status','active').lte('starts_at',new Date().toISOString()).gt('expires_at',new Date().toISOString()).limit(1).maybeSingle():Promise.resolve({data:null})
  ]);
  if(ce)throw ce;if(qe)throw qe;
  let list=q||[];
  if(language==='as'){const fallback=await supabase.from('questions').select('id').eq('chapter_id',String(id)).eq('is_published',true).eq('language','en').order('created_at');if(fallback.error)throw fallback.error;const seen=new Set(list.map((x:Q)=>x.id));list=[...list,...(fallback.data||[]).filter((x:Q)=>!seen.has(x.id))];}
  if(live){setTier(ch?.access_tier==='free'?'free':'premium');setPremium(Boolean(m));setIds(list.map((x:Q)=>x.id));}
 }catch(e){if(live)setError(e instanceof Error?e.message:'Could not load chapter sheets.')}finally{if(live)setLoading(false)}})();return()=>{live=false}},[id,userId,language]);
 const sheets=useMemo(()=>Array.from({length:Math.ceil(ids.length/40)},(_,i)=>ids.slice(i*40,(i+1)*40)),[ids]);
 const locked=tier==='premium'&&!premium;
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:18,gap:14,paddingBottom:42}}>
  <View style={{gap:4}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1,color:c.green}}>{subject||'CHAPTER PRACTICE'}</Text><Heading>{chapter||'Chapter practice'}</Heading><Copy>Questions are arranged into practice sheets of up to 40 questions each.</Copy></View>
  <Panel style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{width:44,height:44,borderRadius:13,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Ionicons name="layers-outline" size={22} color={c.blue}/></View><View style={{flex:1,gap:3}}><Text style={{fontSize:14,fontWeight:'900',color:c.text}}>{ids.length} published questions</Text><Text style={{fontSize:11,color:c.textSecondary}}>{sheets.length} practice sheets · 40 questions per sheet</Text></View><Text style={{fontSize:10,fontWeight:'900',color:tier==='free'?c.green:c.amber}}>{tier==='free'?'FREE':'PREMIUM'}</Text></Panel>
  {loading?<ActivityIndicator color={c.green}/>:error?<EmptyState icon="cloud-offline-outline" title="Could not load practice sheets" description={error}/>:locked?<Panel style={{gap:9}}><Heading style={{fontSize:17}}>Unlock this chapter</Heading><Copy>This chapter is included in the ₹149 Chapter Practice Library and the ₹999 Complete CEE plan.</Copy><Button title="View plans" onPress={()=>router.push('/premium')} icon="lock-closed-outline"/></Panel>:sheets.length?sheets.map((sheet,i)=><Pressable key={i} onPress={()=>router.push({pathname:'/quiz',params:{questionIds:JSON.stringify(sheet),chapter:String(chapter||''),subject:String(subject||''),testTitle:String(chapter||'Chapter')+' · Practice Sheet '+(i+1)}})}><Panel style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{width:42,height:42,borderRadius:13,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:14,fontWeight:'900',color:c.primary}}>{i+1}</Text></View><View style={{flex:1,gap:3}}><Text style={{fontSize:14,fontWeight:'900',color:c.text}}>Practice Sheet {i+1}</Text><Text style={{fontSize:11,color:c.textSecondary}}>{sheet.length} questions</Text></View><Ionicons name="chevron-forward" size={20} color={c.green}/></Panel></Pressable>):<EmptyState icon="book-outline" title="Questions are being added" description="This chapter is available in the catalogue. Its practice sheets will appear as soon as questions are uploaded and published."/>}
  <Button title="Back to chapters" variant="secondary" onPress={()=>router.back()}/>
 </ScrollView>;
}
