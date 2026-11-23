import React,{useEffect,useRef,useState} from 'react';
import {Tabs,router,usePathname} from 'expo-router';
import {Pressable,Modal,View,Text,ScrollView,Animated,Easing,useWindowDimensions,Image} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../_layout';
import {tr} from '../../lib/i18n';
import {supabase} from '../../lib/supabase';
type Icon=keyof typeof Ionicons.glyphMap;
export default function TabsLayout(){
 const {c,userEmail,userId,mode,setMode,language}=useTheme();const pathname=usePathname();const insets=useSafeAreaInsets();const {width:W}=useWindowDimensions();const [open,setOpen]=useState(false);const [profile,setProfile]=useState<{name:string;avatar:string|null;premium:boolean}>({name:'Student',avatar:null,premium:false});
 const translateX=useRef(new Animated.Value(-Math.min(W*.8,340))).current;
 const backdrop=useRef(new Animated.Value(0)).current;
 const drawerWidth=Math.max(260,Math.min(W*.8,340));
 useEffect(()=>{if(open){translateX.setValue(-drawerWidth);backdrop.setValue(0);Animated.parallel([Animated.spring(translateX,{toValue:0,useNativeDriver:true,damping:24,stiffness:210,mass:.85}),Animated.timing(backdrop,{toValue:1,duration:210,easing:Easing.out(Easing.quad),useNativeDriver:true})]).start();}},[open,drawerWidth,translateX,backdrop]);
 useEffect(()=>{let live=true;if(!open||!supabase||!userId)return()=>{live=false};void(async()=>{const now=new Date().toISOString();const [{data:p},{data:m}]=await Promise.all([supabase!.from('profiles').select('display_name,avatar_path').eq('id',userId).maybeSingle(),supabase!.from('memberships').select('id').eq('user_id',userId).eq('status','active').lte('starts_at',now).gt('expires_at',now).limit(1).maybeSingle()]);let avatar:string|null=null;if(p?.avatar_path){const {data}=await supabase!.storage.from('student-avatars').createSignedUrl(p.avatar_path,3600);avatar=data?.signedUrl||null;}if(live)setProfile({name:p?.display_name||userEmail?.split('@')[0]||'Student',avatar,premium:Boolean(m)});})();return()=>{live=false}},[open,userId,userEmail]);
 const close=()=>{Animated.parallel([Animated.timing(translateX,{toValue:-drawerWidth,duration:190,easing:Easing.in(Easing.cubic),useNativeDriver:true}),Animated.timing(backdrop,{toValue:0,duration:170,useNativeDriver:true})]).start(({finished})=>{if(finished)setOpen(false)})};
 const icons:Record<string,Icon>={index:'home-outline',batches:'people-outline',practice:'book-outline',tests:'clipboard-outline',profile:'person-circle-outline',lectures:'play-circle-outline',insights:'stats-chart-outline'};
 const go=(path:string)=>{close();setTimeout(()=>router.push(path as never),70)};
 const item=(icon:Icon,label:string,path:string)=>{const active=(path==='/(tabs)'&&(pathname==='/'||pathname==='/(tabs)'))||pathname===path||(path!=='/'&&path!=='/(tabs)'&&pathname.startsWith(path));return <Pressable key={label} onPress={()=>go(path)} accessibilityRole="button" accessibilityState={{selected:active}} style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:13,minHeight:46,paddingHorizontal:11,paddingVertical:10,borderRadius:12,backgroundColor:active?c.green:'transparent',opacity:pressed?.65:1})}><Ionicons name={icon} size={20} color={active?'#FFFFFF':c.textSecondary}/><Text style={{fontSize:13,fontWeight:active?'900':'600',color:active?'#FFFFFF':c.text,flex:1}}>{label}</Text><Ionicons name="chevron-forward" size={15} color={active?'#FFFFFF':c.textMuted}/></Pressable>};
 return <>
 <Tabs screenOptions={({route})=>({headerShown:route.name!=='index',headerTitle:route.name==='index'?'SmartPrep Axom':route.name==='batches'?tr(language,'My Batches'):route.name==='practice'?'Study':route.name==='insights'?tr(language,'Learning insights'):route.name==='tests'?'Mock tests':route.name==='lectures'?tr(language,'Video lectures'):'Your profile',headerTitleStyle:{fontWeight:'800',fontSize:17,color:c.text},headerStyle:{backgroundColor:c.bg},headerShadowVisible:false,headerTintColor:c.text,headerLeft:()=> <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" onPress={()=>setOpen(true)} style={{marginLeft:14,width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center'}}><Ionicons name="menu" size={27} color={c.text}/></Pressable>,tabBarActiveTintColor:c.green,tabBarInactiveTintColor:c.textMuted,tabBarStyle:{backgroundColor:c.card,borderTopColor:c.border,height:64+insets.bottom,paddingBottom:Math.max(8,insets.bottom),paddingTop:6},tabBarIcon:({color,size})=><Ionicons name={icons[route.name]||'ellipse-outline'} color={color} size={size}/>})}>
 <Tabs.Screen name="index" options={{title:tr(language,'Home')}}/><Tabs.Screen name="batches" options={{title:'Batches'}}/><Tabs.Screen name="practice" options={{title:'Study'}}/><Tabs.Screen name="tests" options={{title:'Tests'}}/><Tabs.Screen name="profile" options={{title:'More',tabBarIcon:({color,size})=><Ionicons name="grid-outline" color={color} size={size}/>,tabBarButton:()=> <Pressable onPress={()=>setOpen(true)} accessibilityRole="button" accessibilityLabel="Open more menu" style={{flex:1,alignItems:'center',justifyContent:'center',gap:3}}><Ionicons name="grid-outline" size={22} color={c.muted}/><Text style={{fontSize:10,fontWeight:'700',color:c.muted}}>More</Text></Pressable>}}/><Tabs.Screen name="lectures" options={{href:null}}/><Tabs.Screen name="insights" options={{href:null}}/>
 </Tabs>
 <Modal visible={open} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
  <View style={{flex:1,flexDirection:'row'}}>
   <Animated.View style={{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'#000',opacity:backdrop.interpolate({inputRange:[0,1],outputRange:[0,.52]})}}/>
   <Animated.View style={{width:drawerWidth,height:'100%',backgroundColor:c.card,paddingTop:insets.top+12,paddingBottom:insets.bottom+12,paddingHorizontal:18,transform:[{translateX}],shadowColor:'#000',shadowOpacity:.2,shadowRadius:18,elevation:18}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:12,paddingBottom:15,borderBottomWidth:1,borderBottomColor:c.border}}>
     <View style={{width:46,height:46,borderRadius:13,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Image source={require('../../assets/icon.png')} resizeMode="contain" style={{width:44,height:44,borderRadius:12}}/></View>
     <View style={{flex:1}}><Text style={{fontSize:15,fontWeight:'900',color:c.text}}>SmartPrep Axom</Text><Text style={{fontSize:10,color:c.textMuted}}>Prepare Smarter. Perform Better.</Text></View>
     <Pressable onPress={close} accessibilityLabel="Close navigation drawer"><Ionicons name="close" size={24} color={c.text}/></Pressable>
    </View>
    <Pressable onPress={()=>go('/(tabs)/profile')} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:15,borderBottomWidth:1,borderBottomColor:c.border}}>
     {profile.avatar?<Image source={{uri:profile.avatar}} style={{width:42,height:42,borderRadius:21}}/>:<View style={{width:42,height:42,borderRadius:21,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Ionicons name="person" size={20} color={c.primary}/></View>}
     <View style={{flex:1,gap:2}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>{profile.name}</Text><Text numberOfLines={1} style={{fontSize:10,color:c.textSecondary}}>{userEmail||'Sign in to sync your progress'}</Text><Text style={{fontSize:9,fontWeight:'900',color:profile.premium?c.amber:c.green}}>{profile.premium?'♛ PREMIUM MEMBER':'FREE PLAN'}</Text></View><Ionicons name="chevron-forward" size={17} color={c.textMuted}/>
    </Pressable>
    <ScrollView showsVerticalScrollIndicator={false}>
     <Text style={{fontSize:11,fontWeight:'800',letterSpacing:1,color:c.muted,marginTop:20,marginBottom:5}}>STUDY</Text>
     {item('home-outline','Home','/(tabs)')}
     {item('people-outline','My Batches','/(tabs)/batches')}
     {item('book-outline','Practice by Subject','/(tabs)/practice')}
     {item('calendar-outline','PYQs','/pyqs')}
     {item('clipboard-outline','Mock Tests','/(tabs)/tests')}
     {item('play-circle-outline','Video Lectures','/(tabs)/lectures')}
     {item('stats-chart-outline','Learning Insights','/(tabs)/insights')}
     {item('trophy-outline','Leaderboard & Leagues','/leaderboard')}
     <Text style={{fontSize:11,fontWeight:'800',letterSpacing:1,color:c.textMuted,marginTop:22,marginBottom:5}}>ACCOUNT & MORE</Text>
     {item('person-circle-outline','Profile & Account','/(tabs)/profile')}
     {item('ribbon-outline','Membership & Plans','/premium')}
     {item('bookmark-outline','Saved Questions','/saved')}
     {item('alert-circle-outline','Mistake Notebook','/mistakes')}
     {item('receipt-outline','Payment History','/payment-history')}
     {item('settings-outline','Settings','/settings')}
     {item('help-circle-outline','Help & Support','/about')}
     <Pressable onPress={()=>setMode(mode==='dark'?'light':'dark')} style={{flexDirection:'row',alignItems:'center',gap:13,paddingVertical:16}}><Ionicons name={mode==='dark'?'sunny-outline':'moon-outline'} size={21} color={c.blue}/><Text style={{fontSize:15,fontWeight:'600',color:c.text}}>{mode==='dark'?tr(language,'Light mode'):tr(language,'Dark mode')}</Text></Pressable>
     <Pressable onPress={()=>go('/auth')} style={{flexDirection:'row',alignItems:'center',gap:13,paddingVertical:16,borderTopWidth:1,borderTopColor:c.border}}><Ionicons name={userEmail?'log-out-outline':'log-in-outline'} size={21} color={c.red}/><Text style={{fontSize:15,fontWeight:'700',color:c.red}}>{userEmail?tr(language,'Account & sign out'):tr(language,'Login / Sign up')}</Text></Pressable>
     <Text style={{fontSize:11,color:c.textMuted,paddingVertical:18}}>Prepare Smarter. Perform Better. · Made in Assam</Text>
    </ScrollView>
   </Animated.View>
   <Pressable style={{position:'absolute',left:drawerWidth,right:0,top:0,bottom:0}} onPress={close} accessibilityLabel="Close navigation drawer"/>
  </View>
 </Modal>
 </>;
}
