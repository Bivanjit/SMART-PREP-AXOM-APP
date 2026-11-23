import React,{useEffect,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ScrollView,View,Text,Pressable,ActivityIndicator,Image,Modal} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel,Button} from '../../components/ui';
import {tr} from '../../lib/i18n';

type Lecture={id:string;title:string;subject:string;video_url:string;description:string|null};
type Announcement={id:string;title:string;body:string;audience:'all'|'guest'|'student';created_at:string};
function Shortcut({icon,label,detail,onPress}:{icon:keyof typeof Ionicons.glyphMap;label:string;detail:string;onPress:()=>void}){
 const {c}=useTheme();
 return <Pressable onPress={onPress} accessibilityRole="button" style={({pressed})=>({width:'48.4%',minHeight:104,backgroundColor:c.card,borderRadius:16,borderWidth:1,borderColor:c.border,padding:13,gap:7,opacity:pressed?.72:1})}>
  <View style={{width:36,height:36,borderRadius:11,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name={icon} size={20} color={c.blue}/></View>
  <Text style={{fontSize:13,fontWeight:'800',color:c.text}}>{label}</Text><Text style={{fontSize:11,color:c.muted}}>{detail}</Text>
 </Pressable>;
}
function Metric({icon,label,value}:{icon:keyof typeof Ionicons.glyphMap;label:string;value:string}){
 const {c}=useTheme();
 return <View style={{flex:1,backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:15,padding:13,gap:7}}>
  <Ionicons name={icon} size={18} color={c.green}/><Text style={{fontSize:23,fontWeight:'900',color:c.text}}>{value}</Text><Text style={{fontSize:11,color:c.muted,fontWeight:'700'}}>{label}</Text>
 </View>;
}
export default function Home(){
 const {c,mode,userEmail,userId,bookmarks,language}=useTheme();
 const [lecture,setLecture]=useState<Lecture|null>(null),[count,setCount]=useState(0),[loading,setLoading]=useState(true);
 const [announcement,setAnnouncement]=useState<Announcement|null>(null),[announcementVisible,setAnnouncementVisible]=useState(false),[isPremium,setIsPremium]=useState(false);
 useEffect(()=>{let live=true;void(async()=>{
  if(!supabase){setLoading(false);return;}
  try{
   const {data:lec}=await supabase.from('lectures').select('id,title,subject,video_url,description').eq('is_published',true).order('lecture_order').limit(1).maybeSingle();
   if(live)setLecture(lec as Lecture|null);
   if(userId){
    const {count:total}=await supabase.from('attempts').select('id',{count:'exact',head:true}).eq('user_id',userId);
    if(live)setCount(total||0);
    const now=new Date().toISOString();
    const {data:member}=await supabase.from('memberships').select('id').eq('user_id',userId).eq('status','active').lte('starts_at',now).gt('expires_at',now).limit(1).maybeSingle();
    if(live)setIsPremium(Boolean(member));
   }
  }catch(e){console.warn('Dashboard load failed',e)}finally{if(live)setLoading(false)}
 })();return()=>{live=false}},[userId]);
 useEffect(()=>{let live=true;void(async()=>{
  if(!supabase)return;
  try{
   const now=new Date().toISOString();
   const {data,error}=await supabase.from('announcements').select('id,title,body,audience,created_at').eq('is_published',true).lte('starts_at',now).or('ends_at.is.null,ends_at.gt.'+now).order('created_at',{ascending:false}).limit(10);
   if(error)throw error;
   for(const item of (data||[]) as Announcement[]){
    if(item.audience==='guest'&&userId)continue;if(item.audience==='student'&&!userId)continue;
    const dismissed=await AsyncStorage.getItem('smartprep.announcement.dismissed.'+item.id);
    if(dismissed)continue;if(live){setAnnouncement(item);setAnnouncementVisible(true)}break;
   }
  }catch(e){console.warn('Announcement load failed',e)}
 })();return()=>{live=false}},[userId]);
 async function dismissAnnouncement(){if(announcement)await AsyncStorage.setItem('smartprep.announcement.dismissed.'+announcement.id,'1');setAnnouncementVisible(false)}
 const greeting=userEmail?userEmail.split('@')[0]:'Aspirant';
 return <>
  <Modal visible={announcementVisible&&!!announcement} transparent animationType="fade" onRequestClose={()=>void dismissAnnouncement()}>
   <View style={{flex:1,backgroundColor:'#0009',justifyContent:'center',padding:24}}><View style={{backgroundColor:c.card,borderRadius:20,padding:22,gap:14,borderWidth:1,borderColor:c.border}}>
    <View style={{width:44,height:44,borderRadius:13,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name="megaphone-outline" size={22} color={c.blue}/></View>
    <Text style={{fontSize:19,fontWeight:'900',color:c.text}}>{announcement?.title}</Text><Text style={{fontSize:14,lineHeight:22,color:c.muted}}>{announcement?.body}</Text>
    <Button title="Got it" onPress={()=>void dismissAnnouncement()}/>
   </View></View>
  </Modal>
  <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{paddingHorizontal:18,paddingTop:14,paddingBottom:38,gap:18}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:8,flex:1}}>
     <Pressable onPress={()=>router.push('/leaderboard')} accessibilityLabel="Open leaderboard" style={{width:38,height:38,borderRadius:12,backgroundColor:c.card,borderWidth:1,borderColor:c.border,alignItems:'center',justifyContent:'center'}}><Ionicons name="trophy-outline" size={19} color={c.amber}/></Pressable>
     <Image source={require('../../assets/icon.png')} style={{width:42,height:42,borderRadius:12}}/>
     <View style={{flex:1,gap:2}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1,color:c.blue}}>SMARTPREP AXOM</Text><Text numberOfLines={1} style={{fontSize:18,fontWeight:'900',color:c.text}}>{tr(language,'Hi')}, {greeting} 👋</Text></View>
    </View>
    <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
     <View style={{paddingHorizontal:10,paddingVertical:6,borderRadius:20,backgroundColor:isPremium?(mode==='dark'?'#1C3D32':'#14532D'):c.soft}}><Text style={{fontSize:10,fontWeight:'900',color:isPremium?'#FFFFFF':c.blue}}>{isPremium?'PREMIUM':'FREE PLAN'}</Text></View>
     <Pressable onPress={()=>router.push('/notifications')} accessibilityLabel="Notifications" style={{width:40,height:40,borderRadius:13,backgroundColor:c.card,borderWidth:1,borderColor:c.border,alignItems:'center',justifyContent:'center'}}><Ionicons name="notifications-outline" size={20} color={c.text}/></Pressable>
    </View>
   </View>
   <View style={{backgroundColor:mode==='dark'?'#1C3D32':'#14532D',borderRadius:22,padding:19,gap:11,overflow:'hidden'}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.3,color:'#D7EBDD'}}>YOUR NEXT MILESTONE</Text><View style={{backgroundColor:'#FFFFFF20',paddingHorizontal:10,paddingVertical:5,borderRadius:20}}><Text style={{fontSize:10,fontWeight:'900',color:'#FFFFFF'}}>2027</Text></View></View>
    <Text style={{fontSize:28,fontWeight:'900',letterSpacing:-.7,color:'#FFFFFF'}}>Assam CEE</Text>
    <Text style={{fontSize:13,lineHeight:19,color:'#E4F0E7'}}>A focused preparation space for Physics, Chemistry and Mathematics.</Text>
    <View style={{flexDirection:'row',gap:7,marginTop:1}}>{['PHYSICS','CHEMISTRY','MATHEMATICS'].map(x=><View key={x} style={{backgroundColor:'#FFFFFF20',paddingHorizontal:9,paddingVertical:6,borderRadius:8}}><Text style={{color:'#FFFFFF',fontSize:9,fontWeight:'900'}}>{x}</Text></View>)}</View>
    <Pressable onPress={()=>router.push('/(tabs)/practice')} style={{alignSelf:'flex-start',backgroundColor:'#FFFFFF',paddingHorizontal:14,paddingVertical:10,borderRadius:10,flexDirection:'row',alignItems:'center',gap:7,marginTop:2}}><Text style={{fontWeight:'900',fontSize:12,color:'#14532D'}}>Start practising</Text><Ionicons name="arrow-forward" size={14} color={c.green}/></Pressable>
   </View>
   <View style={{flexDirection:'row',gap:10}}>
    <Metric icon="clipboard-outline" label="Test attempts" value={loading?'—':String(count)}/>
    <Metric icon="bookmark-outline" label="Saved questions" value={String(bookmarks.length)}/>
   </View>
   <View style={{gap:4}}><Heading>{tr(language,'Quick access')}</Heading><Copy>Jump straight into the work that matters today.</Copy></View>
   <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:10}}>
    <Shortcut icon="book-outline" label="Practice" detail="Chapters and mixed MCQs" onPress={()=>router.push('/(tabs)/practice')}/>
    <Shortcut icon="clipboard-outline" label="Mock tests" detail="Full CEE test papers" onPress={()=>router.push('/(tabs)/tests')}/>
    <Shortcut icon="time-outline" label="Previous papers" detail="Explore past questions" onPress={()=>router.push('/(tabs)/practice')}/>
    <Shortcut icon="play-circle-outline" label="Video lectures" detail="Learn from lessons" onPress={()=>router.push('/(tabs)/lectures')}/>
    <Shortcut icon="bookmark-outline" label="Saved questions" detail="Your revision list" onPress={()=>router.push('/saved')}/>
    <Shortcut icon="stats-chart-outline" label="Learning insights" detail="Review your performance" onPress={()=>router.push('/(tabs)/insights')}/>
   </View>
   <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View style={{gap:3}}><Heading>{tr(language,'Continue learning')}</Heading><Copy>Pick up with the latest published lesson.</Copy></View><Ionicons name="play-circle-outline" size={23} color={c.green}/></View>
   {loading?<ActivityIndicator color={c.blue}/>:lecture?<Panel><View style={{flexDirection:'row',alignItems:'center',gap:11}}><View style={{width:43,height:43,borderRadius:13,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name="play" size={20} color={c.blue}/></View><View style={{flex:1,gap:3}}><Text style={{fontWeight:'900',color:c.text,fontSize:14}}>{lecture.title}</Text><Copy>{lecture.subject} · Latest published lecture</Copy></View></View><Button title="Open lecture library" onPress={()=>router.push('/(tabs)/lectures')}/></Panel>:<Panel><Copy>No lectures have been published yet. New lessons will appear here when they are available.</Copy><Button title="Browse lecture library" variant="secondary" onPress={()=>router.push('/(tabs)/lectures')}/></Panel>}
   {!isPremium?<Panel style={{backgroundColor:c.card,borderColor:c.border,gap:9}}><View style={{flexDirection:'row',alignItems:'center',gap:9}}><View style={{width:38,height:38,borderRadius:12,backgroundColor:'#FFF2D8',alignItems:'center',justifyContent:'center'}}><Ionicons name="ribbon-outline" size={20} color={c.amber}/></View><View style={{flex:1,gap:2}}><Text style={{fontSize:14,fontWeight:'900',color:c.text}}>Go further with Premium</Text><Copy>Unlock eligible courses, tests and advanced practice.</Copy></View></View><Button title="Explore membership" onPress={()=>router.push('/payment')} icon="arrow-forward"/></Panel>:null}
   <Panel style={{gap:9}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:38,height:38,borderRadius:12,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name="people-outline" size={20} color={c.blue}/></View><View style={{flex:1,gap:2}}><Text style={{fontWeight:'900',fontSize:14,color:c.text}}>My batches</Text><Copy>Find your enrolled programmes and available classes.</Copy></View></View><Button title="View batches" variant="secondary" onPress={()=>router.push('/(tabs)/batches')}/></Panel>
  </ScrollView>
 </>;
}
