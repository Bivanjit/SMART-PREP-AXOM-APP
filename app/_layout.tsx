import React,{createContext,useContext,useEffect,useState} from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useColorScheme} from 'react-native';
import {supabase} from '../lib/supabase';
type Mode='light'|'dark';
const colors={light:{bg:'#F8F6FF',card:'#FFFFFF',text:'#241B35',muted:'#786F89',border:'#E8E1F2',blue:'#8060C8',soft:'#F0EAFE',green:'#21866B',red:'#C44E65'},dark:{bg:'#09080D',card:'#17141E',text:'#F7F3FF',muted:'#B3A9C1',border:'#30283B',blue:'#B49AF2',soft:'#282036',green:'#62D6B0',red:'#FF8FA3'}};
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
 return <Context.Provider value={{mode,setMode,c,bookmarks,toggleBookmark,attempts,saveAttempt,userEmail,authLoading}}><StatusBar style={mode==='dark'?'light':'dark'}/><Stack screenOptions={{headerStyle:{backgroundColor:c.bg},headerTintColor:c.text,contentStyle:{backgroundColor:c.bg},animation:'fade_from_bottom'}}><Stack.Screen name="(tabs)" options={{headerShown:false}}/><Stack.Screen name="practice/[subject]" options={{title:'Chapter practice'}}/><Stack.Screen name="lecture-player" options={{title:"Video lecture"}}/><Stack.Screen name="payment" options={{title:'Membership & payment'}}/><Stack.Screen name="auth" options={{title:'Your account'}}/><Stack.Screen name="quiz" options={{title:'Practice session'}}/><Stack.Screen name="results" options={{title:'Session review'}}/><Stack.Screen name="saved" options={{title:'Saved questions'}}/><Stack.Screen name="+not-found" options={{title:'Page not found'}}/></Stack></Context.Provider>
}