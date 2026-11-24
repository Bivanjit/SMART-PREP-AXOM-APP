import React,{useEffect,useState} from 'react';
import {ScrollView,View,Text,ActivityIndicator} from 'react-native';
import {useLocalSearchParams,router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../lib/supabase';
import {useTheme} from './_layout';
import {Heading,Copy,Panel,Button,EmptyState} from '../components/ui';
type Entry={rank:number;display_name:string;score:number;max_score:number;elapsed_seconds:number;xp_awarded:number;is_you:boolean};
export default function MockLeaderboard(){
 const {c,userId}=useTheme();const {testId,title}=useLocalSearchParams<{testId:string;title?:string}>();
 const [rows,setRows]=useState<Entry[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setError('Backend unavailable.');setLoading(false);return;}const {data,error}=await supabase.functions.invoke('get-mock-leaderboard',{body:{test_id:String(testId||'')}});if(!live)return;if(error||data?.error)setError(data?.error||error?.message||'Could not load leaderboard.');else setRows(data?.leaderboard||[]);setLoading(false)})();return()=>{live=false}},[testId]);
 const time=(n:number)=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:18,gap:14,paddingBottom:40}}>
  <Button title="Back to tests" variant="secondary" onPress={()=>router.back()}/>
  <View style={{gap:4}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1,color:c.green}}>SMARTPREP AXOM · MOCK RANKINGS</Text><Heading>{title||'Mock Test Leaderboard'}</Heading><Copy>Top 10 students ranked by marks, then by fastest completion time. XP is displayed separately.</Copy></View>
  {loading?<ActivityIndicator color={c.green}/>:error?<EmptyState icon="trophy-outline" title="Leaderboard unavailable" description={error}/>:rows.length?rows.map(r=><Panel key={r.rank} style={{flexDirection:'row',alignItems:'center',gap:11,borderWidth:r.is_you?1:0,borderColor:c.green}}>
   <View style={{width:34,height:34,borderRadius:12,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Text style={{fontWeight:'900',color:r.rank<=3?c.amber:c.text}}>#{r.rank}</Text></View>
   <View style={{flex:1,gap:3}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>{r.display_name}{r.is_you?' · You':''}</Text><Text style={{fontSize:10,color:c.textSecondary}}>Time {time(r.elapsed_seconds)} · {r.xp_awarded} XP</Text></View>
   <View style={{alignItems:'flex-end',gap:2}}><Text style={{fontSize:17,fontWeight:'900',color:c.green}}>{r.score}</Text><Text style={{fontSize:10,color:c.textMuted}}>/{r.max_score}</Text></View>
  </Panel>):<EmptyState icon="trophy-outline" title="No released results yet" description="The top 10 will appear once the mock closes and its results are released."/>}
 </ScrollView>;
}