import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,ActivityIndicator} from 'react-native';
import {Stack,useLocalSearchParams} from 'expo-router';
import {WebView} from 'react-native-webview';
import {usePreventScreenCapture} from 'expo-screen-capture';
import {useTheme} from './_layout';
import {claimPaidDevice} from '../lib/device';

function PaidCaptureGuard(){usePreventScreenCapture('smartprep-paid-lecture');return null;}

export default function LecturePlayer(){
 const {c}=useTheme();const params=useLocalSearchParams<{url?:string;title?:string;paid?:string}>();const raw=String(params.url||'');const title=String(params.title||'Lecture');const isPaid=String(params.paid||'')==='1';
 const [deviceAllowed,setDeviceAllowed]=useState(!isPaid);const [checking,setChecking]=useState(isPaid);const [accessError,setAccessError]=useState('');
 const source=useMemo(()=>{try{const u=new URL(raw);let id='';if(u.hostname.includes('youtu.be'))id=u.pathname.replace('/','');else if(u.hostname.includes('youtube.com'))id=u.searchParams.get('v')||u.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1]||'';if(id)return 'https://www.youtube.com/embed/'+id+'?playsinline=1&rel=0';return raw}catch{return raw}},[raw]);
 useEffect(()=>{let alive=true;if(isPaid){setChecking(true);void claimPaidDevice().then(()=>{if(alive)setDeviceAllowed(true)}).catch(e=>{if(alive){setDeviceAllowed(false);setAccessError(e instanceof Error?e.message:'Unable to verify paid access.')}}).finally(()=>{if(alive)setChecking(false)})}return()=>{alive=false}},[isPaid]);
 return <View style={{flex:1,backgroundColor:c.bg}}><Stack.Screen options={{title,headerShown:true}}/>{isPaid&&deviceAllowed?<PaidCaptureGuard/>:null}{checking?<View style={{flex:1,alignItems:'center',justifyContent:'center',padding:24}}><ActivityIndicator color={c.blue}/><Text style={{color:c.muted,marginTop:10}}>Verifying your paid device…</Text></View>:!deviceAllowed?<View style={{flex:1,alignItems:'center',justifyContent:'center',padding:24}}><Text style={{color:c.text,fontSize:17,fontWeight:'800',textAlign:'center'}}>Paid access is unavailable</Text><Text style={{color:c.muted,marginTop:10,textAlign:'center'}}>{accessError}</Text></View>:source?<WebView source={{uri:source}} style={{flex:1,backgroundColor:c.bg}} javaScriptEnabled domStorageEnabled allowsFullscreenVideo allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} startInLoadingState renderLoading={()=><View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:c.bg}}><ActivityIndicator color={c.blue}/><Text style={{color:c.muted,marginTop:10}}>Loading lecture…</Text></View>} onError={()=>{}}/>:<View style={{padding:22}}><Text style={{color:c.text}}>Lecture link is missing.</Text></View>}</View>
}