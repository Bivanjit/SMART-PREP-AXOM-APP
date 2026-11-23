import React,{useEffect,useState} from 'react';
import {ScrollView,ActivityIndicator,View,Text,Pressable} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel,Button} from '../../components/ui';

export default function Batches(){
 const {c,userId}=useTheme();
 const [loading,setLoading]=useState(true),[membership,setMembership]=useState<string|null>(null),[expiry,setExpiry]=useState<string|null>(null);
 useEffect(()=>{let live=true;void(async()=>{
  if(!supabase||!userId){setLoading(false);return}
  const {data,error}=await supabase.from('memberships').select('product_code,expires_at').eq('user_id',userId).eq('status','active').lte('starts_at',new Date().toISOString()).gt('expires_at',new Date().toISOString()).order('expires_at',{ascending:false}).limit(1).maybeSingle();
  if(!live)return;if(error)console.warn(error.message);setMembership(data?.product_code||null);setExpiry(data?.expires_at||null);setLoading(false);
 })();return()=>{live=false}},[userId]);
 return <ScrollView style={{flex:1,backgroundColor:c.bg}} contentContainerStyle={{padding:18,paddingTop:16,gap:16,paddingBottom:40}}>
  <View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:c.green}}>YOUR CLASSROOM</Text><Heading>My batches</Heading><Copy>Learning paths, available study material and your active membership.</Copy></View>
  <Panel style={{gap:12}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:11}}>
    <View style={{width:45,height:45,borderRadius:14,backgroundColor:'#DCFCE7',alignItems:'center',justifyContent:'center'}}><Ionicons name="book-outline" size={22} color="#166534"/></View>
    <View style={{flex:1,gap:3}}><Text style={{fontSize:15,fontWeight:'900',color:c.text}}>Assam CEE Foundation</Text><Text style={{fontSize:10,fontWeight:'900',color:c.green}}>FREE LEARNING ACCESS</Text></View>
    <View style={{paddingHorizontal:9,paddingVertical:5,borderRadius:20,backgroundColor:'#DCFCE7'}}><Text style={{fontSize:9,fontWeight:'900',color:'#166534'}}>FREE</Text></View>
   </View>
   <Copy>Start with the free chapter syllabus, available practice sets and published video lessons. Your progress is saved when you sign in.</Copy>
   <View style={{flexDirection:'row',gap:8}}>
    <Pressable onPress={()=>router.push('/(tabs)/practice')} style={{flex:1,backgroundColor:c.soft,borderRadius:11,padding:12,alignItems:'center'}}><Text style={{fontSize:12,fontWeight:'800',color:c.blue}}>Explore practice</Text></Pressable>
    <Pressable onPress={()=>router.push('/(tabs)/lectures')} style={{flex:1,backgroundColor:c.soft,borderRadius:11,padding:12,alignItems:'center'}}><Text style={{fontSize:12,fontWeight:'800',color:c.blue}}>View lectures</Text></Pressable>
   </View>
  </Panel>
  <Panel style={{gap:12}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:11}}>
    <View style={{width:45,height:45,borderRadius:14,backgroundColor:'#FEF3C7',alignItems:'center',justifyContent:'center'}}><Ionicons name="ribbon-outline" size={22} color="#92400E"/></View>
    <View style={{flex:1,gap:3}}><Text style={{fontSize:15,fontWeight:'900',color:c.text}}>CEE Complete</Text><Text style={{fontSize:10,fontWeight:'900',color:c.amber}}>PREMIUM PROGRAMME</Text></View>
    <View style={{paddingHorizontal:9,paddingVertical:5,borderRadius:20,backgroundColor:'#FEF3C7'}}><Text style={{fontSize:9,fontWeight:'900',color:'#92400E'}}>PREMIUM</Text></View>
   </View>
   {loading?<ActivityIndicator color={c.blue}/>:membership?<><Text style={{fontSize:13,fontWeight:'900',color:c.green}}>Active membership</Text><Copy>{membership.replace(/_/g,' ')}{expiry?' · Valid until '+new Date(expiry).toLocaleDateString():''}</Copy></>:<Copy>Unlock eligible premium lectures, mock tests and complete preparation resources with a verified membership.</Copy>}
   <Button title={membership?'Manage membership':'Explore membership plans'} onPress={()=>router.push('/payment')} icon="arrow-forward"/>
  </Panel>
  <Panel style={{gap:8}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:9}}><Ionicons name="school-outline" size={20} color={c.blue}/><Text style={{fontSize:14,fontWeight:'900',color:c.text}}>My enrolments</Text></View>
   {loading?<ActivityIndicator color={c.blue}/>:membership?<Copy>Your active membership is recognised. Purchased batch schedules and classes will appear here when assigned to your account.</Copy>:<Copy>You have access to the free learning path. Purchased programmes will appear here after membership verification.</Copy>}
  </Panel>
 </ScrollView>;
}
