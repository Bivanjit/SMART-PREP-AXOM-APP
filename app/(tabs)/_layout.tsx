import React,{useEffect,useRef,useState} from 'react';
import {Tabs,router} from 'expo-router';
import {Pressable,Modal,View,Text,ScrollView,Animated,Easing,useWindowDimensions} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../_layout';
type Icon=keyof typeof Ionicons.glyphMap;
export default function TabsLayout(){
 const {c,userEmail,mode,setMode}=useTheme();const insets=useSafeAreaInsets();const {width:W}=useWindowDimensions();const [open,setOpen]=useState(false);
 const translateX=useRef(new Animated.Value(-Math.max(200,Math.min(W*.52,300)))).current;
 const backdrop=useRef(new Animated.Value(0)).current;
 const drawerWidth=Math.max(200,Math.min(W*.52,300));
 useEffect(()=>{if(open){translateX.setValue(-drawerWidth);backdrop.setValue(0);Animated.parallel([Animated.spring(translateX,{toValue:0,useNativeDriver:true,damping:24,stiffness:210,mass:.85}),Animated.timing(backdrop,{toValue:1,duration:210,easing:Easing.out(Easing.quad),useNativeDriver:true})]).start();}},[open,drawerWidth,translateX,backdrop]);
 const close=()=>{Animated.parallel([Animated.timing(translateX,{toValue:-drawerWidth,duration:190,easing:Easing.in(Easing.cubic),useNativeDriver:true}),Animated.timing(backdrop,{toValue:0,duration:170,useNativeDriver:true})]).start(({finished})=>{if(finished)setOpen(false)})};
 const icons:Record<string,Icon>={index:'home-outline',batches:'people-outline',practice:'book-outline',tests:'clipboard-outline',profile:'person-circle-outline',lectures:'play-circle-outline',insights:'stats-chart-outline'};
 const go=(path:string)=>{close();setTimeout(()=>router.push(path as never),70)};
 const item=(icon:Icon,label:string,path:string)=><Pressable key={label} onPress={()=>go(path)} accessibilityRole="button" style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:13,paddingVertical:14,borderBottomWidth:1,borderBottomColor:c.border,opacity:pressed?.65:1})}><Ionicons name={icon} size={21} color={c.blue}/><Text style={{fontSize:15,fontWeight:'600',color:c.text}}>{label}</Text><View style={{flex:1}}/><Ionicons name="chevron-forward" size={16} color={c.muted}/></Pressable>;
 return <>
 <Tabs screenOptions={({route})=>({headerShown:true,headerTitle:route.name==='index'?'SmartPrep Axom':route.name==='batches'?'My Batches':route.name==='practice'?'Study':route.name==='insights'?'Learning insights':route.name==='tests'?'Mock tests':route.name==='lectures'?'Video lectures':'Your profile',headerTitleStyle:{fontWeight:'800',fontSize:17,color:c.text},headerStyle:{backgroundColor:c.bg},headerShadowVisible:false,headerTintColor:c.text,headerLeft:()=> <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" onPress={()=>setOpen(true)} style={{marginLeft:14,width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center'}}><Ionicons name="menu" size={27} color={c.text}/></Pressable>,tabBarActiveTintColor:c.blue,tabBarInactiveTintColor:c.muted,tabBarStyle:{backgroundColor:c.card,borderTopColor:c.border,height:62+insets.bottom,paddingBottom:Math.max(8,insets.bottom),paddingTop:5},tabBarIcon:({color,size})=><Ionicons name={icons[route.name]||'ellipse-outline'} color={color} size={size}/>})}>
 <Tabs.Screen name="index" options={{title:'Home'}}/><Tabs.Screen name="batches" options={{title:'Batches'}}/><Tabs.Screen name="practice" options={{title:'Study'}}/><Tabs.Screen name="tests" options={{title:'Tests'}}/><Tabs.Screen name="profile" options={{title:'Profile'}}/><Tabs.Screen name="lectures" options={{href:null}}/><Tabs.Screen name="insights" options={{href:null}}/>
 </Tabs>
 <Modal visible={open} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
  <View style={{flex:1,flexDirection:'row'}}>
   <Animated.View style={{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'#000',opacity:backdrop.interpolate({inputRange:[0,1],outputRange:[0,.52]})}}/>
   <Animated.View style={{width:drawerWidth,height:'100%',backgroundColor:c.card,paddingTop:insets.top+12,paddingBottom:insets.bottom+12,paddingHorizontal:16,transform:[{translateX}],shadowColor:'#000',shadowOpacity:.2,shadowRadius:18,elevation:18}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:12,paddingBottom:20,borderBottomWidth:1,borderBottomColor:c.border}}>
     <View style={{width:48,height:48,borderRadius:16,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name="school" size={25} color={c.blue}/></View>
     <View style={{flex:1}}><Text style={{fontSize:17,fontWeight:'800',color:c.text}}>SmartPrep Axom</Text><Text numberOfLines={1} style={{fontSize:12,color:c.muted}}>{userEmail||'Assam CEE · PCM'}</Text></View>
     <Pressable onPress={close} accessibilityLabel="Close navigation drawer"><Ionicons name="close" size={25} color={c.text}/></Pressable>
    </View>
    <ScrollView showsVerticalScrollIndicator={false}>
     <Text style={{fontSize:11,fontWeight:'800',letterSpacing:1,color:c.muted,marginTop:20,marginBottom:5}}>STUDY</Text>
     {item('home-outline','Home','/(tabs)')}{item('people-outline','My Batches','/(tabs)/batches')}{item('book-outline','Practice by subject','/(tabs)/practice')}{item('play-circle-outline','Video lectures','/(tabs)/lectures')}{item('clipboard-outline','PCM mock tests','/(tabs)/tests')}{item('stats-chart-outline','Learning insights','/(tabs)/insights')}
     <Text style={{fontSize:11,fontWeight:'800',letterSpacing:1,color:c.muted,marginTop:22,marginBottom:5}}>YOUR SPACE</Text>
     {item('person-circle-outline','Profile & account','/(tabs)/profile')}{item('bookmark-outline','Saved questions','/saved')}{item('alert-circle-outline','Mistake Notebook','/mistakes')}{item('card-outline','Membership & payments','/payment')}{item('receipt-outline','Payment history','/payment-history')}{item('calendar-outline','Study planner','/planner')}{item('notifications-outline','Notifications','/notifications')}{item('settings-outline','Settings','/settings')}{item('information-circle-outline','About SmartPrep Axom','/about')}
     <Pressable onPress={()=>setMode(mode==='dark'?'light':'dark')} style={{flexDirection:'row',alignItems:'center',gap:13,paddingVertical:16}}><Ionicons name={mode==='dark'?'sunny-outline':'moon-outline'} size={21} color={c.blue}/><Text style={{fontSize:15,fontWeight:'600',color:c.text}}>{mode==='dark'?'Light mode':'Dark mode'}</Text></Pressable>
     <Pressable onPress={()=>go('/auth')} style={{flexDirection:'row',alignItems:'center',gap:13,paddingVertical:16,borderTopWidth:1,borderTopColor:c.border}}><Ionicons name={userEmail?'log-out-outline':'log-in-outline'} size={21} color={c.red}/><Text style={{fontSize:15,fontWeight:'700',color:c.red}}>{userEmail?'Account & sign out':'Login / Sign up'}</Text></Pressable>
     <Text style={{fontSize:12,color:c.muted,paddingVertical:18}}>Prepare Smarter. Perform Better. · Made in Assam</Text>
    </ScrollView>
   </Animated.View>
   <Pressable style={{position:'absolute',left:drawerWidth,right:0,top:0,bottom:0}} onPress={close} accessibilityLabel="Close navigation drawer"/>
  </View>
 </Modal>
 </>;
}
