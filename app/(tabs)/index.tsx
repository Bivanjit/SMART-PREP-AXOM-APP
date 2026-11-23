import React,{useEffect,useMemo,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ScrollView,View,Text,Pressable,ActivityIndicator,Image,ImageBackground} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Copy,Heading,Panel,Button,ProgressRing,ProgressBar} from '../../components/ui';

const assamHero='https://commons.wikimedia.org/wiki/Special:FilePath/A_Tea_Garden_of_Assam.jpg?width=1400';
type HomeData={name:string;avatar:string|null;premium:boolean;attempts:number;publishedQuestions:number;attemptedQuestions:number;weeklyXp:number;unread:number;saved:number;latestLecture:{id:string;title:string;subject:string}|null;};

function QuickAction({icon,title,onPress}:{icon:keyof typeof Ionicons.glyphMap;title:string;onPress:()=>void}){
 const {c}=useTheme();
 return <Pressable onPress={onPress} accessibilityRole="button" style={({pressed})=>({flex:1,minHeight:76,backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:14,alignItems:'center',justifyContent:'center',gap:7,opacity:pressed?.75:1})}><Ionicons name={icon} size={22} color={c.green}/><Text style={{fontSize:11,fontWeight:'800',color:c.text}}>{title}</Text></Pressable>;
}
function SectionTitle({title,action,onPress}:{title:string;action?:string;onPress?:()=>void}){
 const {c}=useTheme();return <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Heading style={{fontSize:17}}>{title}</Heading>{action&&onPress?<Pressable onPress={onPress}><Text style={{fontSize:11,fontWeight:'800',color:c.green}}>{action}</Text></Pressable>:null}</View>;
}
export default function Home(){
 const {c,userEmail,userId,bookmarks,language}=useTheme();
 const [data,setData]=useState<HomeData>({name:'Student',avatar:null,premium:false,attempts:0,publishedQuestions:0,attemptedQuestions:0,weeklyXp:0,unread:0,saved:bookmarks.length,latestLecture:null});
 const [loading,setLoading]=useState(true),[premiumDismissed,setPremiumDismissed]=useState(false);const [hero,setHero]=useState({title:'Assam CEE',year:'2027',description:'Complete preparation for Physics, Chemistry & Mathematics.',image:assamHero});
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
  finally{if(live)setLoading(false)}
 })();return()=>{live=false}},[userId,userEmail,bookmarks.length]);
 const coverage=useMemo(()=>data.publishedQuestions?Math.min(100,Math.round(data.attemptedQuestions/data.publishedQuestions*100)):0,[data]);
 const greeting=data.name.split(' ')[0]||'Student';
 const dismissPremium=()=>{setPremiumDismissed(true);void AsyncStorage.setItem('smartprep.premium.dismissed','true')};
 return <ScrollView style={{flex:1,backgroundColor:c.bg}} contentContainerStyle={{paddingHorizontal:16,paddingTop:10,paddingBottom:38,gap:17}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
   <Image source={require('../../assets/icon.png')} style={{width:38,height:38,borderRadius:11}} resizeMode="contain"/>
   <View style={{flex:1,gap:1}}><Text style={{fontSize:15,fontWeight:'900',color:c.text}}>SmartPrep Axom</Text><Text style={{fontSize:9,color:c.textMuted}}>Prepare Smarter. Perform Better.</Text></View>
   <Pressable onPress={()=>router.push('/leaderboard')} accessibilityLabel="Leaderboard" style={{width:38,height:38,borderRadius:12,backgroundColor:c.card,borderWidth:1,borderColor:c.border,alignItems:'center',justifyContent:'center'}}><Ionicons name="trophy-outline" size={19} color={c.amber}/></Pressable>
   <Pressable onPress={()=>router.push('/notifications')} accessibilityLabel="Notifications" style={{width:38,height:38,borderRadius:12,backgroundColor:c.card,borderWidth:1,borderColor:c.border,alignItems:'center',justifyContent:'center'}}><Ionicons name="notifications-outline" size={19} color={c.text}/>{data.unread>0?<View style={{position:'absolute',right:7,top:7,width:7,height:7,borderRadius:4,backgroundColor:c.error}}/>:null}</Pressable>
  </View>
  <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
   {data.avatar?<Image source={{uri:data.avatar}} style={{width:42,height:42,borderRadius:21}}/>:<View style={{width:42,height:42,borderRadius:21,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Ionicons name="person" size={20} color={c.primary}/></View>}
   <View style={{flex:1,gap:2}}><Text style={{fontSize:16,fontWeight:'900',color:c.text}}>Hi, {greeting} 👋</Text><Text style={{fontSize:11,color:c.textSecondary}}>Ready for today's study session?</Text></View>
   <View style={{backgroundColor:data.premium?c.amber:c.surfaceElevated,paddingHorizontal:10,paddingVertical:6,borderRadius:99}}><Text style={{fontSize:10,fontWeight:'900',color:data.premium?'#FFFFFF':c.textSecondary}}>{data.premium?'Premium Member':'Free Plan'}</Text></View>
  </View>
  <ImageBackground source={{uri:hero.image}} imageStyle={{borderRadius:20}} style={{minHeight:184,borderRadius:20,overflow:'hidden',backgroundColor:'#1D4735'}}>
   <View style={{flex:1,minHeight:184,padding:18,justifyContent:'space-between',backgroundColor:'rgba(8,28,27,.48)'}}>
    <View style={{gap:8}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={{fontSize:21,fontWeight:'900',color:'#FFFFFF'}} >{hero.title}</Text><View style={{backgroundColor:'rgba(255,255,255,.92)',paddingHorizontal:9,paddingVertical:4,borderRadius:99}}><Text style={{fontSize:11,fontWeight:'900',color:'#173A31'}} >{hero.year}</Text></View></View><Text style={{fontSize:12,lineHeight:18,color:'#F4F8F4',maxWidth:270}}>{hero.description}</Text></View>
    <Pressable onPress={()=>router.push('/(tabs)/practice')} style={{alignSelf:'flex-start',backgroundColor:c.amber,paddingHorizontal:14,paddingVertical:10,borderRadius:11,flexDirection:'row',alignItems:'center',gap:7}}><Text style={{fontSize:12,fontWeight:'900',color:'#FFFFFF'}}>Start Practising</Text><Ionicons name="arrow-forward" size={15} color="#FFFFFF"/></Pressable>
   </View>
  </ImageBackground>
  <View style={{flexDirection:'row',gap:8}}>
   <QuickAction icon="pencil-outline" title="Practice" onPress={()=>router.push('/(tabs)/practice')}/>
   <QuickAction icon="clipboard-outline" title="Tests" onPress={()=>router.push('/(tabs)/tests')}/>
   <QuickAction icon="layers-outline" title="PYQs" onPress={()=>router.push('/pyqs')}/>
   <QuickAction icon="play-outline" title="Lectures" onPress={()=>router.push('/(tabs)/lectures')}/>
  </View>
  {!data.premium&&!premiumDismissed?<Pressable onPress={()=>router.push('/premium')} style={{backgroundColor:c.surfaceElevated,borderWidth:1,borderColor:c.border,borderRadius:16,padding:14,flexDirection:'row',alignItems:'center',gap:12}}>
   <View style={{width:42,height:42,borderRadius:14,backgroundColor:'#FDE8B4',alignItems:'center',justifyContent:'center'}}><Ionicons name="trophy" size={22} color="#A16207"/></View>
   <View style={{flex:1,gap:3}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>Upgrade to Premium</Text><Text style={{fontSize:11,color:c.textSecondary}}>Unlock full courses, PYQs, mock tests & more.</Text></View>
   <View style={{width:32,height:32,borderRadius:16,backgroundColor:c.amber,alignItems:'center',justifyContent:'center'}}><Ionicons name="arrow-forward" size={17} color="#FFFFFF"/></View>
   <Pressable onPress={e=>{e.stopPropagation();dismissPremium()}} accessibilityLabel="Dismiss premium offer" style={{position:'absolute',right:5,top:4,padding:3}}><Ionicons name="close" size={13} color={c.textMuted}/></Pressable>
  </Pressable>:null}
  <Panel style={{flexDirection:'row',alignItems:'center',gap:14}}>
   <ProgressRing value={coverage} size={78}/>
   <View style={{flex:1,gap:4}}><Text style={{fontSize:14,fontWeight:'900',color:c.text}}>Your Progress</Text><Text style={{fontSize:11,color:c.textSecondary}}>You've attempted {data.attemptedQuestions} of {data.publishedQuestions} published questions.</Text><Text style={{fontSize:10,color:c.green,fontWeight:'800'}}>{coverage>0?'Keep going! You are building momentum.':'Start practising to build your progress.'}</Text></View>
  </Panel>
  <View style={{gap:10}}>
   <SectionTitle title="Quick Access"/>
   <View style={{flexDirection:'row',gap:10}}>
    <Pressable onPress={()=>data.latestLecture?router.push({pathname:'/lecture-player',params:{lectureId:data.latestLecture.id,title:data.latestLecture.title}}):router.push('/(tabs)/lectures')} style={{flex:1,backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:15,padding:14,gap:9}}>
     <Ionicons name="play-circle-outline" size={23} color={c.green}/><Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Continue Learning</Text><Text numberOfLines={2} style={{fontSize:10,color:c.textSecondary}}>{data.latestLecture?.title||'Explore available video lectures'}</Text>
    </Pressable>
    <Pressable onPress={()=>router.push('/saved')} style={{flex:1,backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:15,padding:14,gap:9}}>
     <Ionicons name="bookmark-outline" size={23} color={c.primary}/><Text style={{fontSize:12,fontWeight:'900',color:c.text}}>Saved Questions</Text><Text style={{fontSize:10,color:c.textSecondary}}>{data.saved} saved questions ready for revision</Text>
    </Pressable>
   </View>
  </View>
  <Pressable onPress={()=>router.push('/leaderboard')} style={{backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:16,padding:15,flexDirection:'row',alignItems:'center',gap:12}}>
   <View style={{width:42,height:42,borderRadius:13,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Ionicons name="trophy-outline" size={22} color={c.amber}/></View>
   <View style={{flex:1,gap:3}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>Leaderboard & Leagues</Text><Text style={{fontSize:11,color:c.textSecondary}}>Your weekly score · {data.weeklyXp} XP</Text></View><Ionicons name="chevron-forward" size={18} color={c.textMuted}/>
  </Pressable>
  {loading?<ActivityIndicator color={c.green}/>:null}
  <View style={{flexDirection:'row',justifyContent:'space-between',gap:12}}><View style={{flex:1,gap:3}}><Text style={{fontSize:10,color:c.textMuted,fontWeight:'800'}}>TESTS ATTEMPTED</Text><Text style={{fontSize:19,color:c.text,fontWeight:'900'}}>{data.attempts}</Text></View><View style={{flex:1,gap:3}}><Text style={{fontSize:10,color:c.textMuted,fontWeight:'800'}}>WEEKLY XP</Text><Text style={{fontSize:19,color:c.text,fontWeight:'900'}}>{data.weeklyXp}</Text></View></View>
 </ScrollView>;
}
