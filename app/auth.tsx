import React,{useEffect,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert,KeyboardAvoidingView,Platform,ScrollView,Text,TextInput,View,Pressable,ActivityIndicator,Image} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {supabase} from '../lib/supabase';
import {unregisterDevicePushToken} from '../lib/push-notifications';
import {useTheme} from './_layout';

type Mode='signin'|'signup'|'verify-signup'|'otp-signin'|'reset';
const validEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const friendly=(e:unknown)=>e instanceof Error?e.message:'Something went wrong. Please try again.';
export default function AuthScreen(){
 const {c,userEmail,userId}=useTheme();const insets=useSafeAreaInsets();
 const [email,setEmail]=useState(''),[name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [mode,setMode]=useState<Mode>('signin'),[busy,setBusy]=useState(false),[otp,setOtp]=useState(''),[showPassword,setShowPassword]=useState(false),[resendIn,setResendIn]=useState(0);
 useEffect(()=>{if(resendIn<=0)return;const timer=setTimeout(()=>setResendIn(v=>Math.max(0,v-1)),1000);return()=>clearTimeout(timer)},[resendIn]);
 const goHome=()=>router.replace('/(tabs)');
 const field={minHeight:52,borderWidth:1,borderColor:c.border,borderRadius:12,paddingHorizontal:15,paddingVertical:12,color:c.text,backgroundColor:c.card,fontSize:14};
 async function syncProfile(user:{id:string;email?:string;user_metadata?:Record<string,unknown>}){
  if(!supabase)return;const displayName=name.trim()||String(user.user_metadata?.display_name||'');
  const patch:any={id:user.id,email:user.email||email.trim().toLowerCase(),updated_at:new Date().toISOString()};if(displayName)patch.display_name=displayName;
  const {error}=await supabase.from('profiles').upsert(patch,{onConflict:'id'});if(error)throw error;
 }
 async function signup(){
  if(!supabase){Alert.alert('Unavailable','App backend is not configured.');return;}
  const e=email.trim().toLowerCase();if(!name.trim())return Alert.alert('Name required','Enter your name.');
  if(!validEmail(e))return Alert.alert('Invalid email','Enter a valid email address.');
  if(password.length<8)return Alert.alert('Password too short','Use at least 8 characters.');
  if(password!==confirm)return Alert.alert('Passwords do not match','Re-enter your password.');
  setBusy(true);try{const {data,error}=await supabase.auth.signUp({email:e,password,options:{data:{display_name:name.trim()}}});if(error)throw error;
   if(data.user&&data.session){await syncProfile(data.user as any);Alert.alert('Account created','Your account is ready.');goHome();}
   else if(data.user){setOtp('');setMode('verify-signup');setResendIn(60);Alert.alert('Verify your email','Enter the 6-digit confirmation code sent to your email.');}
   else throw new Error('Supabase did not return an account.');
  }catch(e){Alert.alert('Could not create account',friendly(e))}finally{setBusy(false)}
 }
 async function verifySignup(){if(!supabase)return;if(otp.length!==6)return Alert.alert('Enter code','Enter all 6 digits.');setBusy(true);try{const {data,error}=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:otp,type:'signup'});if(error)throw error;if(!data.user)throw new Error('No account returned.');await syncProfile(data.user as any);setPassword('');setConfirm('');Alert.alert('Email verified','Welcome to SmartPrep Axom!');goHome();}catch(e){Alert.alert('Verification failed',friendly(e))}finally{setBusy(false)}}
 async function signin(){if(!supabase)return;const e=email.trim().toLowerCase();if(!validEmail(e)||!password)return Alert.alert('Missing details','Enter a valid email and password.');setBusy(true);try{const {data,error}=await supabase.auth.signInWithPassword({email:e,password});if(error)throw error;if(data.user)await syncProfile(data.user as any);goHome();}catch(e){Alert.alert('Sign in failed',friendly(e))}finally{setBusy(false)}}
 async function sendOtp(){if(!supabase||!validEmail(email))return Alert.alert('Enter email','Enter a valid email address.');setBusy(true);try{const {error}=await supabase.auth.signInWithOtp({email:email.trim().toLowerCase(),options:{shouldCreateUser:false}});if(error)throw error;setOtp('');setMode('otp-signin');setResendIn(60);Alert.alert('Code sent','Enter the sign-in code sent to your email.');}catch(e){Alert.alert('Could not send code',friendly(e))}finally{setBusy(false)}}
 async function resendSignupCode(){if(!supabase||!validEmail(email))return Alert.alert('Enter email','Enter a valid email address.');setBusy(true);try{const {error}=await supabase.auth.resend({type:'signup',email:email.trim().toLowerCase()});if(error)throw error;setResendIn(60);Alert.alert('Code resent','A new verification code has been sent to your email.');}catch(e){Alert.alert('Could not resend code',friendly(e))}finally{setBusy(false)}}
 async function verifyOtp(){if(!supabase||otp.length!==6)return Alert.alert('Enter code','Enter the complete 6-digit code.');setBusy(true);try{const {data,error}=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:otp,type:'email'});if(error)throw error;if(data.user)await syncProfile(data.user as any);goHome();}catch(e){Alert.alert('Sign in failed',friendly(e))}finally{setBusy(false)}}
 async function reset(){if(!supabase||!validEmail(email))return Alert.alert('Enter email','Enter your account email first.');setBusy(true);try{const {error}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:'smartprepaxom://reset-password'});if(error)throw error;Alert.alert('Reset email sent','Open the link on this device to set a new password.');setMode('signin');}catch(e){Alert.alert('Could not send reset email',friendly(e))}finally{setBusy(false)}}
 const title=mode==='signup'?'Create an account':mode==='verify-signup'?'Verify your email':mode==='otp-signin'?'Continue with OTP':mode==='reset'?'Forgot password?':'Sign In';
 const primary=async()=>{if(mode==='signin')return signin();if(mode==='signup')return signup();if(mode==='verify-signup')return verifySignup();if(mode==='otp-signin')return verifyOtp();return reset()};
 const primaryLabel=mode==='signin'?'Sign In':mode==='signup'?'Create Account':mode==='verify-signup'?'Verify & Continue':mode==='otp-signin'?'Verify & Sign In':'Send Reset Link';
 return <KeyboardAvoidingView style={{flex:1,backgroundColor:c.bg}} behavior={Platform.OS==='ios'?'padding':'height'}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow:1,justifyContent:'center',paddingHorizontal:24,paddingTop:Math.max(18,insets.top+12),paddingBottom:Math.max(24,insets.bottom+24),gap:22}}>
   <View style={{alignItems:'center',gap:7}}>
    <Image source={require('../assets/icon.png')} resizeMode="contain" style={{width:68,height:68}}/>
    <Text style={{fontSize:25,fontWeight:'900',letterSpacing:-.8,color:c.text}}>SmartPrep Axom</Text>
    <Text style={{fontSize:12,color:c.muted}}>Prepare Smarter. Perform Better.</Text>
   </View>
   {userEmail?<View style={{gap:15}}><Text style={{fontSize:23,fontWeight:'900',color:c.text}}>You're signed in</Text><Text style={{fontSize:14,color:c.muted}}>{userEmail}</Text><Pressable onPress={goHome} style={{backgroundColor:c.blue,borderRadius:12,padding:16,alignItems:'center'}}><Text style={{color:'#FFFFFF',fontWeight:'800'}}>Continue to SmartPrep</Text></Pressable><Pressable onPress={()=>void (async()=>{await unregisterDevicePushToken(userId);await supabase?.auth.signOut()})()}><Text style={{color:c.blue,textAlign:'center',fontWeight:'700'}}>Sign out</Text></Pressable></View>:<View style={{gap:17}}>
    <View style={{gap:5}}><Text style={{fontSize:23,fontWeight:'900',color:c.text}}>{title}</Text><Text style={{fontSize:13,color:c.muted,lineHeight:19}}>{mode==='signup'?'Create your student account to begin your Assam CEE 2027 preparation.':mode==='verify-signup'?'Enter the 6-digit verification code sent to '+email+'.':mode==='otp-signin'?'Enter the sign-in code sent to '+email+'.':mode==='reset'?'We will send a secure password reset link to your email.':'Welcome back to SmartPrep Axom.'}</Text></View>
    {mode!=='verify-signup'&&mode!=='otp-signin'?<TextInput style={field} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="Email address" placeholderTextColor={c.muted}/>:null}
    {mode==='signup'?<TextInput style={field} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={c.muted}/>:null}
    {mode==='signin'||mode==='signup'?<View style={{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:c.border,borderRadius:12,backgroundColor:c.card}}><TextInput style={[field,{flex:1,borderWidth:0,backgroundColor:'transparent'}]} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholder="Password" placeholderTextColor={c.muted}/><Pressable onPress={()=>setShowPassword(v=>!v)} style={{padding:14}}><Ionicons name={showPassword?'eye-off-outline':'eye-outline'} size={20} color={c.muted}/></Pressable></View>:null}
    {mode==='signup'?<TextInput style={field} value={confirm} onChangeText={setConfirm} secureTextEntry={!showPassword} placeholder="Confirm password" placeholderTextColor={c.muted}/>:null}
    {mode==='verify-signup'||mode==='otp-signin'?<TextInput style={[field,{letterSpacing:9,textAlign:'center',fontSize:22,fontWeight:'800'}]} value={otp} onChangeText={v=>setOtp(v.replace(/[^0-9]/g,'').slice(0,6))} keyboardType="number-pad" maxLength={6} placeholder="• • • • • •" placeholderTextColor={c.muted}/>:null}
    {mode==='signin'?<Pressable onPress={()=>setMode('reset')}><Text style={{color:c.blue,fontSize:12,fontWeight:'800',textAlign:'right'}}>Forgot password?</Text></Pressable>:null}
    <Pressable disabled={busy} onPress={()=>void primary()} style={{minHeight:50,backgroundColor:c.blue,borderRadius:12,alignItems:'center',justifyContent:'center',opacity:busy?.65:1}}>{busy?<ActivityIndicator color="#FFFFFF"/>:<Text style={{color:'#FFFFFF',fontSize:14,fontWeight:'900'}}>{primaryLabel}</Text>}</Pressable>
    {mode==='signin'?<><View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{height:1,flex:1,backgroundColor:c.border}}/><Text style={{fontSize:11,color:c.muted,fontWeight:'700'}}>OR</Text><View style={{height:1,flex:1,backgroundColor:c.border}}/></View><Pressable onPress={()=>void sendOtp()} style={{borderWidth:1,borderColor:c.border,borderRadius:12,minHeight:50,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8}}><Ionicons name="mail-outline" size={17} color={c.text}/><Text style={{color:c.text,fontSize:13,fontWeight:'800'}}>Continue with OTP</Text></Pressable></>:null}
    {mode==='verify-signup'||mode==='otp-signin'?<Pressable disabled={busy||resendIn>0} onPress={()=>void (mode==='verify-signup'?resendSignupCode():sendOtp())}><Text style={{color:resendIn>0?c.muted:c.blue,textAlign:'center',fontWeight:'800'}}>{resendIn>0?'Resend available in '+resendIn+'s':'Resend code'}</Text></Pressable>:null}
    <Pressable onPress={()=>{setMode(mode==='signup'?'signin':'signup');setOtp('')}}><Text style={{textAlign:'center',fontSize:12,color:c.muted}}>{mode==='signup'?'Already have an account? ':'New to SmartPrep Axom? '}<Text style={{color:c.blue,fontWeight:'900'}}>{mode==='signup'?'Sign in':'Create an account'}</Text></Text></Pressable>
    {mode==='reset'?<Pressable onPress={()=>setMode('signin')}><Text style={{color:c.blue,textAlign:'center',fontWeight:'800'}}>Back to sign in</Text></Pressable>:null}
   </View>}
   <Text style={{fontSize:11,color:c.muted,textAlign:'center',lineHeight:17}}>Assam CEE 2027 · Physics · Chemistry · Mathematics</Text>
  </ScrollView>
 </KeyboardAvoidingView>;
}
