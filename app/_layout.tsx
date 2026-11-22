import React,{createContext,useContext,useEffect,useState} from 'react';
import {Stack,router} from 'expo-router';
import {ActivityIndicator,View} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useColorScheme} from 'react-native';
import {supabase} from '../lib/supabase';
type Mode='light'|'dark';
const colors={light:{bg:'#F8FAFC',card:'#FFFFFF',text:'#0F172A',muted:'#64748B',border:'#CBD5E1',blue:'#4F46E5',soft:'#EEF2FF',green:'#059669',red:'#DC2626',amber:'#F59E0B'},dark:{bg:'#0F172A',card:'#1E293B',text:'#F8FAFC',muted:'#CBD5E1',border:'#475569',blue:'#818CF8',soft:'#29364B',green:'#34D399',red:'#FDA4AF',amber:'#FBBF24'}};
type Attempt={id:string;title:string;score:number;max:number;correct:number;wrong:number;skipped:number;date:string};
type Theme={mode:Mode;setMode:(m:Mode)=>void;c:typeof colors.light;bookmarks:string[];toggleBookmark:(id:string)=>void;attempts:Attempt[];saveAttempt:(a:Attempt)=>void;userEmail:string|null;authLoading:boolean};
const Context=createContext<Theme|null>(null);
export function useTheme(){const v=useContext(Context);if(!v)throw Error('Missing app provider');return v}
export default function Layout(){
 const sys=useColorScheme();const [mode,change]=useState<Mode>(sys==='dark'?'dark':'light');const [bookmarks,setBookmarks]=useState<string[]>([]);const [attempts,setAttempts]=useState<Attempt[]>([]);const [userEmail,setUserEmail]=useState<string|null>(null);const [authLoading,setAuthLoading]=useState(true);
 useEffect(()=>{let alive=true;let unsubscribe:(()=>void)|undefined;void(async()=>{try{const v=await AsyncStorage.multiGet(['smartprep.mode','smartprep.bookmarks','smartprep.attempts']);if(!alive)return;if(v[0][1]==='dark'||v[0][1]==='light')change(v[0][1]);if(v[1][1])setBookmarks(JSON.parse(v[1][1]!));if(v[2][1])setAttempts(JSON.parse(v[2][1]!));}catch{}if(supabase){const {data:{session}}=await supabase.auth.getSession();if(alive)setUserEmail(session?.user.email??null);const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{if(alive){setUserEmail(s?.user.email??null);setAuthLoading(false)}});unsubscribe=()=>subscription.unsubscribe()}if(alive)setAuthLoading(false)})();return()=>{alive=false;unsubscribe?.()}},[]);
 const setMode=(m:Mode)=>{change(m);void AsyncStorage.setItem('smartprep.mode',m)};
 const toggleBookmark=(id:string)=>setBookmarks(old=>{const next=old.includes(id)?old.filter(x=>x!==id):[...old,id];void AsyncStorage.setItem('smartprep.bookmarks',JSON.stringify(next));return next});
 const saveAttempt=(a:Attempt)=>setAttempts(old=>{const next=[a,...old].slice(0,100);void AsyncStorage.setItem('smartprep.attempts',JSON.stringify(next));return next});
 const c=colors[mode];
 if(authLoading)return <View style={{flex:1,backgroundColor:c.bg,alignItems:'center',justifyContent:'center'}}><ActivityIndicator size="large" color={c.blue}/></View>;
 if(!userEmail)return <Context.Provider value={{mode,setMode,c,bookmarks,toggleBookmark,attempts,saveAttempt,userEmail,authLoading}}><StatusBar style={mode==='dark'?'light':'dark'}/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:c.bg}}}><Stack.Screen name="auth" options={{headerShown:false}}/></Stack></Context.Provider>;
 return <Context.Provider value={{mode,setMode,c,bookmarks,toggleBookmark,attempts,saveAttempt,userEmail,authLoading}}><StatusBar style={mode==='dark'?'light':'dark'}/><Stack screenOptions={{headerStyle:{backgroundColor:c.bg},headerTintColor:c.text,contentStyle:{backgroundColor:c.bg},animation:'slide_from_right'}}><Stack.Screen name="(tabs)" options={{headerShown:false}}/><Stack.Screen name="settings" options={{title:'Settings',presentation:'card',animation:'slide_from_right'}}/><Stack.Screen name="practice/[subject]" options={{title:'Chapter practice'}}/><Stack.Screen name="lecture-player" options={{title:"Video lecture"}}/><Stack.Screen name="payment" options={{title:'Membership & payment'}}/><Stack.Screen name="auth" options={{title:'Your account'}}/><Stack.Screen name="quiz" options={{title:'Practice session'}}/><Stack.Screen name="results" options={{title:'Session review'}}/><Stack.Screen name="saved" options={{title:'Saved questions'}}/><Stack.Screen name="+not-found" options={{title:'Page not found'}}/></Stack></Context.Provider>
}