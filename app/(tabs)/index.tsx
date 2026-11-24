import React,{useEffect,useMemo,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ScrollView,View,Text,Pressable,ActivityIndicator,Image,ImageBackground,RefreshControl,useWindowDimensions} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Copy,Heading,Panel,Button,ProgressRing,ProgressBar} from '../../components/ui';

const assamHero='https://commons.wikimedia.org/wiki/Special:FilePath/A_Tea_Garden_of_Assam.jpg?width=1400';
type HomeData={name:string;avatar:string|null;premium:boolean;attempts:number;publishedQuestions:number;attemptedQuestions:number;weeklyXp:number;unread:number;saved:number;latestLecture:{id:string;title:string;subject:string}|null;};

function QuickAction({icon,title,onPress,accent}:{icon:keyof typeof Ionicons.glyphMap;title:string;onPress:()=>void;accent:string}){
 const {c}=useTheme();
 return <Pressable onPress={()=>{void Haptics.selectionAsync();onPress()}} accessibilityRole="button" style={({pressed})=>({flex:1,minHeight:88,backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:17,alignItems:'center',justifyContent:'center',gap:9,opacity:pressed?.88:1,transform:[{scale:pressed?.97:1}],shadowColor:accent,shadowOpacity:pressed?.12:.07,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:2})}><View style={{width:40,height:40,borderRadius:14,backgroundColor:accent+'18',alignItems:'center',justifyContent:'center'}}><Ionicons name={icon} size={22} color={accent}/></View><Text style={{fontSize:11,fontWeight:'900',color:c.text}}>{title}</Text></Pressable>;
}
function SectionTitle({title,action,onPress}:{title:string;action?:string;onPress?:()=>void}){
 const {c}=useTheme();return <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Heading style={{fontSize:17}}>{title}</Heading>{action&&onPress?<Pressable onPress={onPress}><Text style={{fontSize:11,fontWeight:'800',color:c.green}}>{action}</Text></Pressable>:null}</View>;
}
export default function Home(){
 const {c,userEmail,userId,bookmarks,language}=useTheme();const {width:windowWidth}=useWindowDimensions();
 const [data,setData]=useState<HomeData>({name:'Student',avatar:null,premium:false,attempts:0,publishedQuestions:0,attemptedQuestions:0,weeklyXp:0,unread:0,saved:bookmarks.length,latestLecture:null});
 const [loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[refreshKey,setRefreshKey]=useState(0),[premiumDismissed,setPremiumDismissed]=useState(false);const [hero,setHero]=useState({title:'Assam CEE',year:'2027',description:'Complete preparation for Physics, Chemistry & Mathematics.',image:assamHero});
 useEffect(()=>{let live=true;void AsyncStorage.getItem('smartprep.premium.dismissed').then(v=>{if(live)setPremiumDismissed(v==='true')}).catch(()=>{});return()=>{live=false}},[]);
 useEffect(()=>{let live=true;void(async()=>{
  if(!supabase){setLoading(false);return;}
  try{
   const now=new Date().toISOString();
   const [{data:profile},{data:member},{count:attemptCount},{count:questionCount},{count:attemptedCount},{data:rank},{count:unread},{count:savedCount},{data:recentLecture},{data:heroSettings}] = await Promise.all([
    userId?supabase.from('profiles').select('display_name,avatar_path').eq('id',userId).maybeSingle():Promise.resolve({data:null}),
    userId?supabase.from('memberships').select('id').eq('user_id',userId).eq('status','active').lte('starts_at',now).gt('expires_at',now).limit(1).maybeSingle():Promise.resolve({data:null}),
    userId?supabase.from('attempts').select('id',{count:'exact',head:true}).eq('user_id',userId):Promise.resolve({count:0}),
    supabase.from('questions').select('id',{count:'exact',head:true}).eq('is_published',true),
    userId?supabase.from('student_question_history').select('question_id',{count:'exact',head:true}).eq('user_id',userId):Promise.resolve({count:0}),
    userId?supabase.from('leaderboard_profiles').select('xp').eq('user_id',userId).maybeSingle():Promise.resolve({data:null}),
    userId?supabase.from('user_notifications').select('id',{count:'exact',head:true}).eq('user_id',userId).is('read_at',null):Promise.resolve({count:0}),
    userId?supabase.from('user_bookmarks').select('question_id',{count:'exact',head:true}).eq('user_id',userId):Promise.resolve({count:bookmarks.length}),
    userId?supabase.from('lecture_progress').select('lecture_id,lectures(id,title,subject)').eq('user_id',userId).order('updated_at',{ascending:false}).limit(1).maybeSingle():Promise.resolve({data:null}),
    supabase.from('app_content_settings').select('setting_value').eq('setting_key','home_hero').maybeSingle()
   ]);
   let avatar:string|null=null;
   if(profile?.avatar_path){const {data:photo}=await supabase.storage.from('student-avatars').createSignedUrl(profile.avatar_path,3600);avatar=photo?.signedUrl||null;}
   if(!live)return;
   if(heroSettings?.setting_value){const cfg=heroSettings.setting_value;const raw=cfg.image||assamHero;const image=String(raw).startsWith('http')?String(raw):supabase.storage.from('learning-assets').getPublicUrl(String(raw)).data.publicUrl;setHero({title:cfg.title||'Assam CEE',year:cfg.year||'2027',description:cfg.description||'Complete preparation for Physics, Chemistry & Mathematics.',image});}
   const latest=(recentLecture as any)?.lectures;
   setData({name:profile?.display_name||userEmail?.split('@')[0]||'Student',avatar,premium:Boolean(member),attempts:attemptCount||0,publishedQuestions:questionCount||0,attemptedQuestions:attemptedCount||0,weeklyXp:Number(rank?.xp||0),unread:unread||0,saved:savedCount||bookmarks.length,latestLecture:latest?.id?{id:latest.id,title:latest.title,subject:latest.subject}:null});
  }catch(e){console.warn('Home dashboard load failed:',e instanceof Error?e.message:e)}
  finally{if(live){setLoading(false);setRefreshing(false)}}
 })();return()=>{live=false}},[userId,userEmail,bookmarks.length,refreshKey]);
 useEffect(()=>{if(!supabase)return;const channel=supabase.channel('smartprep-home-live-'+(userId||'guest')).on('postgres_changes',{event:'*',schema:'public',table:'app_content_settings'},()=>setRefreshKey(v=>v+1)).on('postgres_changes',{event:'*',schema:'public',table:'announcements'},()=>setRefreshKey(v=>v+1)).on('postgres_changes',{event:'*',schema:'public',table:'memberships',filter:userId?'user_id=eq.'+userId:undefined},()=>setRefreshKey(v=>v+1)).on('postgres_changes',{event:'*',schema:'public',table:'user_notifications',filter:userId?'user_id=eq.'+userId:undefined},()=>setRefreshKey(v=>v+1)).subscribe();return()=>{void supabase?.removeChannel(channel)}},[userId]);
 const coverage=useMemo(()=>data.publishedQuestions?Math.min(100,Math.round(data.attemptedQuestions/data.publishedQuestions*100)):0,[data]);
 const greeting=data.name.split(' ')[0]||'Student';
 const dismissPremium=()=>{setPremiumDismissed(true);void AsyncStorage.setItem('smartprep.premium.dismissed','true')};
 return <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);setRefreshKey(v=>v+1)}} tintColor={c.green} colors={[c.green]}/>} style={{flex:1,backgroundColor:c.bg}} contentContainerStyle={{paddingHorizontal:16,paddingTop:8,paddingBottom:38,gap:17}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
   {data.avatar?<Image source={{uri:data.avatar}} style={{width:42,height:42,borderRadius:21}}/>:<View style={{width:42,height:42,borderRadius:21,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Ionicons name="person" size={20} color={c.primary}/></View>}
   <View style={{flex:1,gap:2}}><Text style={{fontSize:16,fontWeight:'900',color:c.text}}>Hi, {greeting}</Text><Text style={{fontSize:11,color:c.textSecondary}}>Ready for today's study session?</Text></View>
   <View style={{backgroundColor:data.premium?c.amber:c.surfaceElevated,paddingHorizontal:10,paddingVertical:6,borderRadius:99}}><Text style={{fontSize:10,fontWeight:'900',color:data.premium?'#FFFFFF':c.textSecondary}}>{data.premium?'Premium Member':'Free Plan'}</Text></View>
  </View>
  <ImageBackground source={{uri:hero.image}} resizeMode="cover" imageStyle={{resizeMode:'cover',borderRadius:20}} style={{width:'100%',height:Math.round((windowWidth-32)/3.32),borderRadius:20,overflow:'hidden',backgroundColor:'#1D4735'}}>
   <View style={{flex:1,justifyContent:'flex-end',padding:14,backgroundColor:'rgba(0,0,0,0.08)'}}>
    <Pressable onPress={()=>{void Haptics.selectionAsync();router.push('/(tabs)/practice')}} accessibilityRole="button" style={({pressed})=>({alignSelf:'flex-start',backgroundColor:c.amber,paddingHorizontal:17,paddingVertical:12,borderRadius:14,flexDirection:'row',alignItems:'center',gap:8,shadowColor:'#000000',shadowOpacity:.22,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:4,transform:[{scale:pressed?.97:1}]})}><Text style={{fontSize:12,fontWeight:'900',color:'#FFFFFF'}}>Start Practising</Text><Ionicons name="arrow-forward" size={16} color="#FFFFFF"/></Pressable>
   </View>
  </ImageBackground>
  <View style={{flexDirection:'row',gap:8}}>
   <QuickAction icon="book-outline" title="Practice" accent="#16845B" onPress={()=>router.push('/(tabs)/practice')}/>
   <QuickAction icon="clipboard-outline" title="Tests" accent="#D97706" onPress={()=>router.push('/(tabs)/tests')}/>
   <QuickAction icon="document-text-outline" title="PYQs" accent="#3657A7" onPress={()=>router.push('/pyqs')}/>
   <QuickAction icon="play-circle-outline" title="Lectures" accent="#7C3AED" onPress={()=>router.push('/(tabs)/lectures')}/>
  </View>
  {!data.premium&&!premiumDismissed?<Pressable onPress={()=>{void Haptics.selectionAsync();router.push('/premium')}} style={({pressed})=>({backgroundColor:c.surfaceElevated,borderWidth:1,borderColor:'#E9C77D',borderRadius:17,padding:14,flexDirection:'row',alignItems:'center',gap:12,shadowColor:c.amber,shadowOpacity:.2,shadowRadius:12,shadowOffset:{width:0,height:4},elevation:4,opacity:pressed?.9:1,transform:[{scale:pressed?.985:1}]})}>
   <View style={{width:42,height:42,borderRadius:14,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Ionicons name="trophy" size={22} color="#A16207"/></View>
   <View style={{flex:1,gap:3}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>Upgrade to Premium</Text><Text style={{fontSize:11,color:c.textSecondary}}>Unlock full courses, PYQs, mock tests & more.</Text></View>
   <View style={{width:32,height:32,borderRadius:16,backgroundColor:c.amber,alignItems:'center',justifyContent:'center'}}><Ionicons name="arrow-forward" size={17} color="#FFFFFF"/></View>
   <Pressable onPress={e=>{void Haptics.selectionAsync();e.stopPropagation();dismissPremium()}} accessibilityLabel="Dismiss premium offer" style={{position:'absolute',right:5,top:4,padding:3}}><Ionicons name="close" size={13} color={c.textMuted}/></Pressable>
  </Pressable>:null}
  <Panel style={{flexDirection:'row',alignItems:'center',gap:14}}>
   <ProgressRing value={coverage} size={78}/>
   <View style={{flex:1,gap:4}}><Text style={{fontSize:14,fontWeight:'900',color:c.text}}>Your Progress</Text><Text style={{fontSize:11,color:c.textSecondary}}>You've attempted {data.attemptedQuestions} of {data.publishedQuestions} published questions.</Text><Text style={{fontSize:10,color:c.green,fontWeight:'800'}}>{coverage>0?'Keep going! You are building momentum.':'Start practising to build your progress.'}</Text></View>
  </Panel>
  <View style={{gap:10}}>
   <SectionTitle title="Quick Access"/>
   <View style={{flexDirection:'row',gap:10}}>
    <Pressable onPress={()=>{void Haptics.selectionAsync();data.latestLecture?router.push({pathname:'/lecture-player',params:{lectureId:data.latestLecture.id,title:data.latestLecture.title}}):router.push('/(tabs)/lectures')}} style={({pressed})=>({flex:1,backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:15,padding:14,gap:9,opacity:pressed?.88:1,transform:[{scale:pressed?.985:1}]})}>
     <Ionicons name="play-circle-outline" size={23} color={c.green}/><Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Continue Learning</Text><Text numberOfLines={2} style={{fontSize:10,color:c.textSecondary}}>{data.latestLecture?.title||'Explore available video lectures'}</Text>
    </Pressable>
    <Pressable onPress={()=>{void Haptics.selectionAsync();router.push('/saved')}} style={({pressed})=>({flex:1,backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:15,padding:14,gap:9,opacity:pressed?.88:1,transform:[{scale:pressed?.985:1}]})}>
     <Ionicons name="bookmark-outline" size={23} color={c.primary}/><Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Saved Questions</Text><Text style={{fontSize:10,color:c.textSecondary}}>{data.saved} saved questions ready for revision</Text>
    </Pressable>
   </View>
  </View>
  <Pressable onPress={()=>{void Haptics.selectionAsync();router.push('/leaderboard')}} style={({pressed})=>({backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:16,padding:15,flexDirection:'row',alignItems:'center',gap:12,opacity:pressed?.88:1,transform:[{scale:pressed?.985:1}]})}>
   <View style={{width:42,height:42,borderRadius:13,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Ionicons name="trophy-outline" size={22} color={c.amber}/></View>
   <View style={{flex:1,gap:3}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>Leaderboard & Leagues</Text><Text style={{fontSize:11,color:c.textSecondary}}>Your weekly score · {data.weeklyXp} XP</Text></View><Ionicons name="chevron-forward" size={18} color={c.textMuted}/>
  </Pressable>
  <View style={{flexDirection:'row',gap:10}}>
   <Pressable onPress={()=>{void Haptics.selectionAsync();router.push('/reviews')}} style={({pressed})=>({flex:1,backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:14,padding:14,gap:7,opacity:pressed?.88:1,transform:[{scale:pressed?.985:1}]})}><Ionicons name="star-outline" size={21} color={c.amber}/><Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Rate SmartPrep</Text><Text style={{fontSize:10,color:c.textSecondary}}>Share your review</Text></Pressable>
   <Pressable onPress={()=>{void Haptics.selectionAsync();router.push('/community')}} style={({pressed})=>({flex:1,backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:14,padding:14,gap:7,opacity:pressed?.88:1,transform:[{scale:pressed?.985:1}]})}><Ionicons name="chatbubbles-outline" size={21} color={c.green}/><Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Community</Text><Text style={{fontSize:10,color:c.textSecondary}}>Coming soon</Text></Pressable>
  </View>
  {loading?<ActivityIndicator color={c.green}/>:null}
  <View style={{flexDirection:'row',justifyContent:'space-between',gap:12}}><View style={{flex:1,gap:3}}><Text style={{fontSize:10,color:c.textMuted,fontWeight:'800'}}>TESTS ATTEMPTED</Text><Text style={{fontSize:19,color:c.text,fontWeight:'900'}}>{data.attempts}</Text></View><View style={{flex:1,gap:3}}><Text style={{fontSize:10,color:c.textMuted,fontWeight:'800'}}>WEEKLY XP</Text><Text style={{fontSize:19,color:c.text,fontWeight:'900'}}>{data.weeklyXp}</Text></View></View>
 </ScrollView>;
}
