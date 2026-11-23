import React,{useEffect,useState} from 'react';
import {ScrollView,View,Text,Pressable,ImageBackground,ActivityIndicator} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../lib/supabase';
import {useTheme} from './_layout';
import {Heading,Copy,Button,Panel,EmptyState} from '../components/ui';
const backdrop='https://commons.wikimedia.org/wiki/Special:FilePath/A_Tea_Garden_of_Assam.jpg?width=1400';
export default function Premium(){
 const {c,userId}=useTheme();const [plan,setPlan]=useState<any>(null),[benefits,setBenefits]=useState<any[]>([]),[member,setMember]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setLoading(false);return;}try{const now=new Date().toISOString();const [{data:p,error:pe},{data:m}]=await Promise.all([supabase.from('product_plans').select('*').eq('product_code','cee_complete').eq('is_active',true).maybeSingle(),userId?supabase.from('memberships').select('id').eq('user_id',userId).eq('product_code','cee_complete').eq('status','active').lte('starts_at',now).gt('expires_at',now).limit(1).maybeSingle():Promise.resolve({data:null})]);if(pe)throw pe;if(p){const {data:b,error:be}=await supabase.from('product_plan_benefits').select('benefit_text,icon,display_order').eq('plan_id',p.id).eq('is_active',true).order('display_order');if(be)throw be;if(live){setPlan(p);setBenefits(b||[])}}if(live)setMember(Boolean(m));}catch(e){if(live)setError(e instanceof Error?e.message:'Could not load membership details.')}finally{if(live)setLoading(false)}})();return()=>{live=false}},[userId]);
 const discount=plan?.compare_at_price_inr?Math.round((1-Number(plan.price_inr)/Number(plan.compare_at_price_inr))*100):0;
 return <ScrollView style={{flex:1,backgroundColor:c.bg}} contentContainerStyle={{padding:16,gap:15,paddingBottom:40}}>
  <ImageBackground source={{uri:backdrop}} imageStyle={{borderRadius:24}} style={{minHeight:270,borderRadius:24,overflow:'hidden',backgroundColor:'#0C2A20'}}>
   <View style={{flex:1,minHeight:270,padding:20,backgroundColor:'rgba(5,25,19,.82)',alignItems:'center',justifyContent:'center',gap:11}}>
    <Pressable onPress={()=>router.back()} style={{position:'absolute',top:13,right:13,width:34,height:34,borderRadius:17,backgroundColor:'rgba(255,255,255,.16)',alignItems:'center',justifyContent:'center'}}><Ionicons name="close" size={20} color="#FFFFFF"/></Pressable>
    <Ionicons name="trophy" size={48} color="#FBBF24"/>
    <Text style={{fontSize:22,fontWeight:'900',color:'#FBBF24',textAlign:'center'}}>Upgrade to SmartPrep Premium</Text>
    <Text style={{fontSize:12,lineHeight:19,color:'#F1F5F9',textAlign:'center',maxWidth:280}}>Unlock the complete Assam CEE preparation experience.</Text>
    {member?<View style={{backgroundColor:'rgba(34,197,94,.18)',paddingHorizontal:13,paddingVertical:8,borderRadius:99}}><Text style={{fontSize:11,fontWeight:'900',color:'#86EFAC'}}>✓ PREMIUM MEMBER</Text></View>:null}
   </View>
  </ImageBackground>
  {loading?<ActivityIndicator color={c.green}/>:error?<EmptyState icon="alert-circle-outline" title="Membership details unavailable" description={error}/>:member?<Panel style={{alignItems:'center',gap:8}}><Ionicons name="checkmark-circle" size={34} color={c.success}/><Heading>You already have Premium</Heading><Copy>Your active membership is verified by SmartPrep Axom.</Copy></Panel>:plan?<Panel style={{gap:13}}><Heading style={{fontSize:17}}>Everything included</Heading>{benefits.length?benefits.map(b=><View key={b.display_order} style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:23,height:23,borderRadius:12,backgroundColor:c.success,alignItems:'center',justifyContent:'center'}}><Ionicons name="checkmark" size={15} color="#FFFFFF"/></View><Text style={{fontSize:12,fontWeight:'700',color:c.text,flex:1}}>{b.benefit_text}</Text></View>):<Copy>Premium benefits are being configured by the admin.</Copy>}
   <View style={{height:1,backgroundColor:c.border,marginVertical:3}}/>
   <View style={{flexDirection:'row',alignItems:'flex-end',gap:8}}><Text style={{fontSize:31,fontWeight:'900',color:c.text}}>₹{Number(plan.price_inr).toLocaleString('en-IN')}</Text><Text style={{fontSize:12,color:c.textSecondary,marginBottom:5}}>/ year</Text><View style={{flex:1}}/>{plan.compare_at_price_inr?<View style={{alignItems:'flex-end',gap:3}}><Text style={{fontSize:12,color:c.textMuted,textDecorationLine:'line-through'}}>₹{Number(plan.compare_at_price_inr).toLocaleString('en-IN')}</Text>{discount>0?<Text style={{fontSize:10,fontWeight:'900',color:'#FFFFFF',backgroundColor:c.review,paddingHorizontal:8,paddingVertical:4,borderRadius:99}}>{discount}% OFF</Text>:null}</View>:null}</View>
   <Copy>{plan.duration_days} days of premium access after admin-verified payment.</Copy>
   <Button title="Upgrade Now" icon="trophy" onPress={()=>router.push('/payment')}/>
   <Pressable onPress={()=>router.back()} style={{alignItems:'center',padding:8}}><Text style={{fontSize:12,color:c.textSecondary,fontWeight:'700'}}>Maybe Later</Text></Pressable>
  </Panel>:<EmptyState icon="star-outline" title="Premium plan not configured" description="The admin console can configure the plan and benefits before it is made available."/>}
 </ScrollView>;
}
