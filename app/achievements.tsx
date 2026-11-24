import React,{useEffect,useMemo,useState} from 'react';
import {ScrollView,View,Text,Pressable,ActivityIndicator} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {supabase} from '../lib/supabase';
import {useTheme} from './_layout';
import {Heading,Copy,Panel} from '../components/ui';
export default function Achievements(){
 const {c,userId}=useTheme();
 const [catalog,setCatalog]=useState<any[]>([]);
 const [earned,setEarned]=useState<any[]>([]);
 const [loading,setLoading]=useState(true);
 const [filter,setFilter]=useState<'all'|'earned'|'locked'>('all');
 useEffect(()=>{let live=true;void(async()=>{if(!supabase||!userId){setLoading(false);return;}const [{data:a,error:ae},{data:e,error:ee}]=await Promise.all([supabase.from('achievements').select('id,title,description,icon,xp_reward').order('xp_reward',{ascending:true}).order('title',{ascending:true}),supabase.from('user_achievements').select('achievement_id,unlocked_at').eq('user_id',userId)]);if(!live)return;if(!ae)setCatalog(a||[]);if(!ee)setEarned(e||[]);setLoading(false)})();return()=>{live=false}},[userId]);
 const earnedIds=useMemo(()=>new Set(earned.map(x=>x.achievement_id)),[earned]);
 const shown=catalog.filter(a=>filter==='all'||(filter==='earned'?earnedIds.has(a.id):!earnedIds.has(a.id)));
 const count=earnedIds.size;
 return <ScrollView style={{flex:1,backgroundColor:c.bg}} contentContainerStyle={{padding:18,gap:15,paddingBottom:40}}>
  <Pressable onPress={()=>router.back()} style={{flexDirection:'row',alignItems:'center',gap:7,paddingVertical:4}}><Ionicons name="arrow-back" size={19} color={c.blue}/><Text style={{fontSize:13,fontWeight:'800',color:c.blue}}>Profile</Text></Pressable>
  <View style={{gap:5}}><Heading>Achievements</Heading><Copy>Every milestone counts. Unlock badges as you practise and improve.</Copy></View>
  <Panel><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View><Text style={{fontSize:12,fontWeight:'800',color:c.muted}}>YOUR PROGRESS</Text><Text style={{fontSize:27,fontWeight:'900',color:c.text,marginTop:3}}>{count} / {catalog.length||50}</Text><Text style={{fontSize:11,color:c.muted}}>Achievements unlocked</Text></View><View style={{width:62,height:62,borderRadius:31,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name="trophy" size={29} color={c.amber}/></View></View><View style={{height:8,backgroundColor:c.border,borderRadius:8,overflow:'hidden',marginTop:13}}><View style={{height:8,width:((catalog.length?Math.min(100,count/catalog.length*100):0)+'%') as `${number}%`,backgroundColor:c.green}}/></View></Panel>
  <View style={{flexDirection:'row',gap:7}}>{([{key:'all',label:'All'},{key:'earned',label:'Unlocked'},{key:'locked',label:'Locked'}] as const).map(x=><Pressable key={x.key} onPress={()=>setFilter(x.key)} style={{flex:1,paddingVertical:10,borderRadius:11,alignItems:'center',backgroundColor:filter===x.key?c.blue:c.card,borderWidth:1,borderColor:filter===x.key?c.blue:c.border}}><Text style={{fontSize:11,fontWeight:'900',color:filter===x.key?'#FFFFFF':c.text}}>{x.label}</Text></Pressable>)}</View>
  {loading?<ActivityIndicator color={c.blue}/>:shown.length?shown.map(a=>{const unlocked=earnedIds.has(a.id);return <Panel key={a.id}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{width:54,height:54,borderRadius:17,backgroundColor:unlocked?c.soft:c.bg,borderWidth:1,borderColor:c.border,alignItems:'center',justifyContent:'center'}}><Ionicons name={(a.icon||'ribbon') as any} size={27} color={unlocked?c.amber:c.muted}/></View><View style={{flex:1,gap:3}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>{a.title}</Text><Text style={{fontSize:11,color:c.muted,lineHeight:16}}>{a.description}</Text><Text style={{fontSize:10,fontWeight:'900',color:c.amber}}>+{a.xp_reward||0} XP</Text></View><View style={{alignItems:'center',gap:3}}><Ionicons name={unlocked?'checkmark-circle':'lock-closed'} size={19} color={unlocked?c.green:c.muted}/><Text style={{fontSize:9,fontWeight:'900',color:unlocked?c.green:c.muted}}>{unlocked?'Done':'Locked'}</Text></View></View></Panel>}):<Panel><Copy>No achievements in this category yet.</Copy></Panel>}
 </ScrollView>
}
