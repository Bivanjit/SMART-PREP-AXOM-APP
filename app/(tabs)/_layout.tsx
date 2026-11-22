import React,{useState} from 'react';
import {Tabs,router} from 'expo-router';
import {Pressable,Modal,View,Text,ScrollView,Dimensions} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '../_layout';
// Drawer width intentionally stays partial-width to match the requested reference.
const W=Dimensions.get('window').width;
type Icon=keyof typeof Ionicons.glyphMap;
export default function TabsLayout(){
 const {c,userEmail,mode,setMode}=useTheme();const [open,setOpen]=useState(false);
 const icons:Record<string,Icon>={index:'home-outline',practice:'book-outline',lectures:'play-circle-outline',tests:'clipboard-outline',insights:'stats-chart-outline',profile:'person-circle-outline'};
 const go=(path:string)=>{setOpen(false);router.push(path as never)};
 const item=(icon:Icon,label:string,path:string)=> <Pressable key={label} onPress={()=>go(path)} style={{flexDirection:'row',alignItems:'center',gap:13,paddingVertical:15,borderBottomWidth:1,borderBottomColor:c.border}}><Ionicons name={icon} size={21} color={c.blue}/><Text style={{fontSize:15,fontWeight:'600',color:c.text}}>{label}</Text><View style={{flex:1}}/><Ionicons name="chevron-forward" size={16} color={c.muted}/></Pressable>;
 return <>
 <Tabs screenOptions={({route})=>({headerShown:true,headerTitle:route.name==='index'?'SmartPrep Axom':route.name==='insights'?'Learning insights':route.name==='tests'?'Mock tests':route.name==='practice'?'Practice':route.name==='lectures'?'Video lectures':'Your profile',headerTitleStyle:{fontWeight:'800',fontSize:17,color:c.text},headerStyle:{backgroundColor:c.bg},headerShadowVisible:false,headerTintColor:c.text,headerLeft:()=> <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" onPress={()=>setOpen(true)} style={{marginLeft:14,width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center'}}><Ionicons name="menu" size={27} color={c.text}/></Pressable>,tabBarActiveTintColor:c.blue,tabBarInactiveTintColor:c.muted,tabBarStyle:{backgroundColor:c.card,borderTopColor:c.border,height:66,paddingBottom:8,paddingTop:5},tabBarIcon:({color,size})=><Ionicons name={icons[route.name]||'ellipse-outline'} color={color} size={size}/>})}>
 <Tabs.Screen name="index" options={{title:'Home'}}/><Tabs.Screen name="practice" options={{title:'Practice'}}/><Tabs.Screen name="lectures" options={{title:'Lectures'}}/><Tabs.Screen name="tests" options={{title:'Tests'}}/><Tabs.Screen name="insights" options={{title:'Progress'}}/><Tabs.Screen name="profile" options={{title:'Profile'}}/>
 </Tabs>
 <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)} statusBarTranslucent>
  <View style={{flex:1,flexDirection:'row',backgroundColor:'#0008'}}>
   <View style={{width:Math.min(W*.78,340),height:'100%',backgroundColor:c.card,paddingTop:48,paddingHorizontal:20}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:12,paddingBottom:20,borderBottomWidth:1,borderBottomColor:c.border}}>
     <View style={{width:48,height:48,borderRadius:16,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name="school" size={25} color={c.blue}/></View>
     <View style={{flex:1}}><Text style={{fontSize:17,fontWeight:'800',color:c.text}}>SmartPrep Axom</Text><Text style={{fontSize:12,color:c.muted}}>{userEmail||'Assam CEE · PCM'}</Text></View>
     <Pressable onPress={()=>setOpen(false)}><Ionicons name="close" size={25} color={c.text}/></Pressable>
    </View>
    <ScrollView showsVerticalScrollIndicator={false}>
     <Text style={{fontSize:11,fontWeight:'800',letterSpacing:1,color:c.muted,marginTop:20,marginBottom:5}}>STUDY</Text>
     {item('home-outline','Home','/(tabs)')}{item('book-outline','Practice by subject','/(tabs)/practice')}{item('play-circle-outline','Video lectures','/(tabs)/lectures')}{item('clipboard-outline','PCM mock tests','/(tabs)/tests')}{item('stats-chart-outline','Learning insights','/(tabs)/insights')}
     <Text style={{fontSize:11,fontWeight:'800',letterSpacing:1,color:c.muted,marginTop:22,marginBottom:5}}>YOUR SPACE</Text>
     {item('person-circle-outline','Profile & account','/(tabs)/profile')}{item('bookmark-outline','Saved questions','/saved')}{item('card-outline','Membership & payments','/payment')}{item('settings-outline','Settings','/settings')}
     <Pressable onPress={()=>setMode(mode==='dark'?'light':'dark')} style={{flexDirection:'row',alignItems:'center',gap:13,paddingVertical:16}}><Ionicons name={mode==='dark'?'sunny-outline':'moon-outline'} size={21} color={c.blue}/><Text style={{fontSize:15,fontWeight:'600',color:c.text}}>{mode==='dark'?'Light mode':'Dark mode'}</Text></Pressable>
     <Pressable onPress={()=>go('/auth')} style={{flexDirection:'row',alignItems:'center',gap:13,paddingVertical:16,borderTopWidth:1,borderTopColor:c.border}}><Ionicons name={userEmail?'log-out-outline':'log-in-outline'} size={21} color={c.red}/><Text style={{fontSize:15,fontWeight:'700',color:c.red}}>{userEmail?'Account & sign out':'Login / Sign up'}</Text></Pressable>
     <Text style={{fontSize:12,color:c.muted,paddingVertical:18}}>Prepare Smarter. Perform Better. · Made in Assam</Text>
    </ScrollView>
   </View>
   <Pressable style={{flex:1}} onPress={()=>setOpen(false)}/>
  </View>
 </Modal>
 </>
}