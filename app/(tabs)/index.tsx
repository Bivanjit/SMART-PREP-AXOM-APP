import React,{useEffect,useState} from 'react';
import {ScrollView,View,Text,Pressable,ActivityIndicator,Image} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel,Button} from '../../components/ui';
import {tr} from '../../lib/i18n';
type Lecture={id:string;title:string;subject:string;video_url:string;description:string|null};
function Shortcut({icon,label,detail,onPress}:{icon:keyof typeof Ionicons.glyphMap;label:string;detail:string;onPress:()=>void}){const {c}=useTheme();return <Pressable onPress={onPress} style={({pressed})=>({width:'48.2%',minHeight:112,backgroundColor:c.card,borderRadius:18,borderWidth:1,borderColor:c.border,padding:14,gap:8,opacity:pressed?.72:1})}><View style={{width:38,height:38,borderRadius:12,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name={icon} size={21} color={c.blue}/></View><Text style={{fontSize:14,fontWeight:'900',color:c.text}}>{label}</Text><Text style={{fontSize:11,color:c.muted}}>{detail}</Text></Pressable>}
export default function Home(){
 const {c,userEmail,userId,bookmarks,language}=useTheme();const [lecture,setLecture]=useState<Lecture|null>(null);const [count,setCount]=useState(0);const [loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setLoading(false);return;}try{const {data:lec}=await supabase.from('lectures').select('id,title,subject,video_url,description').eq('is_published',true).order('lecture_order').limit(1).maybeSingle();if(live)setLecture(lec as Lecture|null);if(userId){const {count:total}=await supabase.from('attempts').select('id',{count:'exact',head:true}).eq('user_id',userId);if(live)setCount(total||0)}}catch(e){console.warn('Dashboard load failed',e)}finally{if(live)setLoading(false)}})();return()=>{live=false}},[userId]);
 const greeting=userEmail?userEmail.split('@')[0]:'Aspirant';
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{paddingHorizontal:18,paddingTop:14,paddingBottom:42,gap:18}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:10,flex:1}}><Image source={require('../../assets/icon.png')} style={{width:43,height:43,borderRadius:13}}/><View style={{flex:1,gap:2}}><Text style={{fontSize:11,fontWeight:'900',letterSpacing:1,color:c.blue}}>SMARTPREP AXOM</Text><Text style={{fontSize:19,fontWeight:'900',color:c.text}}>{tr(language,'Hi')}, {greeting} 👋</Text></View></View>
   <Pressable onPress={()=>router.push('/notifications')} style={{width:44,height:44,borderRadius:15,backgroundColor:c.card,borderWidth:1,borderColor:c.border,alignItems:'center',justifyContent:'center'}}><Ionicons name="notifications-outline" size={21} color={c.text}/></Pressable>
  </View>
  <View style={{backgroundColor:'#071B49',borderRadius:24,padding:21,gap:13,overflow:'hidden'}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:'#9CCBFF',fontSize:10,fontWeight:'900',letterSpacing:1.5}}>YOUR EXAM. YOUR MISSION.</Text><View style={{backgroundColor:'#173C79',paddingHorizontal:10,paddingVertical:6,borderRadius:20}}><Text style={{color:'#B8DCFF',fontSize:10,fontWeight:'900'}}>2027</Text></View></View>
   <Text style={{fontSize:29,fontWeight:'900',color:'#FFFFFF',letterSpacing:-.8}}>Assam CEE</Text>
   <Text style={{fontSize:13,color:'#C4D9F7',lineHeight:20}}>A smarter path through Physics, Chemistry and Mathematics.</Text>
   <View style={{flexDirection:'row',gap:7,marginTop:2}}>{['PHYSICS','CHEMISTRY','MATHEMATICS'].map(x=><View key={x} style={{backgroundColor:'#FFFFFF18',paddingHorizontal:9,paddingVertical:7,borderRadius:9}}><Text style={{color:'#FFFFFF',fontSize:9,fontWeight:'900'}}>{x}</Text></View>)}</View>
   <Pressable onPress={()=>router.push('/(tabs)/practice')} style={{alignSelf:'flex-start',backgroundColor:'#FFFFFF',paddingHorizontal:15,paddingVertical:11,borderRadius:11,flexDirection:'row',alignItems:'center',gap:8,marginTop:4}}><Text style={{fontWeight:'900',fontSize:12,color:'#071B49'}}>Start practising</Text><Ionicons name="arrow-forward" size={15} color="#071B49"/></Pressable>
  </View>
  <View style={{flexDirection:'row',gap:10}}>
   <Panel style={{flex:1,gap:5}}><View style={{flexDirection:'row',alignItems:'center',gap:6}}><Ionicons name="clipboard-outline" size={17} color={c.blue}/><Copy>Attempts</Copy></View><Text style={{fontSize:25,fontWeight:'900',color:c.text}}>{loading?'—':count}</Text><Text style={{fontSize:10,color:c.muted}}>Server-scored</Text></Panel>
   <Panel style={{flex:1,gap:5}}><View style={{flexDirection:'row',alignItems:'center',gap:6}}><Ionicons name="bookmark-outline" size={17} color={c.blue}/><Copy>Saved</Copy></View><Text style={{fontSize:25,fontWeight:'900',color:c.text}}>{bookmarks.length}</Text><Text style={{fontSize:10,color:c.muted}}>Questions bookmarked</Text></Panel>
  </View>
  <View style={{gap:4}}><Heading>{tr(language,'Quick access')}</Heading><Copy>Everything you need to keep moving.</Copy></View>
  <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:10}}>
   <Shortcut icon="book-outline" label={tr(language,'Practice')} detail="Chapter-wise MCQs" onPress={()=>router.push('/(tabs)/practice')}/>
   <Shortcut icon="clipboard-outline" label="Mock tests" detail="Full CEE papers" onPress={()=>router.push('/(tabs)/tests')}/>
   <Shortcut icon="calendar-outline" label={tr(language,'Study planner')} detail="Plan your week" onPress={()=>router.push('/planner')}/>
   <Shortcut icon="play-circle-outline" label="Video lectures" detail="Learn from lessons" onPress={()=>router.push('/(tabs)/lectures')}/>
  </View>
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View style={{gap:3}}><Heading>{tr(language,'Continue learning')}</Heading><Copy>Pick up where your preparation begins.</Copy></View><Ionicons name="trending-up" size={24} color={c.blue}/></View>
  {loading?<ActivityIndicator color={c.blue}/>:lecture?<Panel><View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{width:45,height:45,borderRadius:14,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name="play" size={22} color={c.blue}/></View><View style={{flex:1,gap:3}}><Text style={{fontWeight:'900',color:c.text,fontSize:14}}>{lecture.title}</Text><Copy>{lecture.subject} · Latest published lecture</Copy></View></View><Button title="Open lecture library" onPress={()=>router.push('/(tabs)/lectures')}/></Panel>:<Panel><Copy>No lectures have been published yet. Your latest lessons will appear here.</Copy><Button title="Browse lecture library" onPress={()=>router.push('/(tabs)/lectures')}/></Panel>}
  <Panel style={{gap:10}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:40,height:40,borderRadius:13,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name="people-outline" size={21} color={c.blue}/></View><View style={{flex:1,gap:2}}><Text style={{fontWeight:'900',fontSize:15,color:c.text}}>My batches</Text><Copy>Find your enrolled programmes and class schedule.</Copy></View></View><Button title="View batches" onPress={()=>router.push('/(tabs)/batches')}/></Panel>
 </ScrollView>
}