import React,{useEffect,useState} from 'react';
import {Alert,KeyboardAvoidingView,Platform,ScrollView,Text,TextInput,View,Pressable,ActivityIndicator} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {Heading,Copy,Panel,Button} from '../components/ui';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Image} from 'react-native';
import {supabase} from '../lib/supabase';
import {useTheme} from './_layout';

type Mode='signin'|'signup'|'verify-signup'|'otp-signin'|'reset';
const validEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const friendly=(e:unknown)=>e instanceof Error?e.message:'Something went wrong. Please try again.';
export default function AuthScreen(){
 const {c,userEmail}=useTheme();
 const insets=useSafeAreaInsets();
 const [email,setEmail]=useState('');
 const [name,setName]=useState('');
 const [password,setPassword]=useState('');
 const [confirm,setConfirm]=useState('');
 const [mode,setMode]=useState<Mode>('signin');
 const [busy,setBusy]=useState(false);
 const [otp,setOtp]=useState('');
 const [showPassword,setShowPassword]=useState(false);
 const [resendIn,setResendIn]=useState(0);
 const [pendingSignup,setPendingSignup]=useState(false);
 useEffect(()=>{if(resendIn<=0)return;const timer=setTimeout(()=>setResendIn(v=>Math.max(0,v-1)),1000);return()=>clearTimeout(timer)},[resendIn]);
 const field={borderWidth:1,borderColor:c.border,color:c.text,backgroundColor:c.card,borderRadius:13,padding:14,fontSize:14,minHeight:50};
 const goHome=()=>router.replace('/(tabs)');
 async function syncProfile(user:{id:string;email?:string;user_metadata?:Record<string,unknown>}){
   if(!supabase)return;
   const displayName=name.trim()||String(user.user_metadata?.display_name||'');
   const profilePatch:any={id:user.id,email:user.email||email.trim().toLowerCase(),updated_at:new Date().toISOString()};
   if(displayName)profilePatch.display_name=displayName;
   const {error}=await supabase.from('profiles').upsert(profilePatch,{onConflict:'id'});
   if(error)throw error;
 }
 async function signup(){
   if(!supabase){Alert.alert('Unavailable','App backend is not configured.');return;}
   const e=email.trim().toLowerCase();
   if(!name.trim()){Alert.alert('Name required','Enter your name to create your student profile.');return;}
   if(!validEmail(e)){Alert.alert('Invalid email','Enter a valid email address.');return;}
   if(password.length<8){Alert.alert('Password too short','Use at least 8 characters.');return;}
   if(password!==confirm){Alert.alert('Passwords do not match','Re-enter the same password in both fields.');return;}
   setBusy(true);
   try{
     const {data,error}=await supabase.auth.signUp({email:e,password,options:{data:{display_name:name.trim()}}});
     if(error)throw error;
     if(data.user&&data.session){
       await syncProfile(data.user as any);
       setPendingSignup(false);
       Alert.alert('Account created','Your SmartPrep Axom account is ready.');
       goHome();
     }else if(data.user){
       setPendingSignup(true);
       setOtp('');
       setMode('verify-signup');
       setResendIn(60);
       Alert.alert('Verify your email','We sent a 6-digit confirmation code. Enter it below; your password is already saved for this signup.');
     }else{
       throw new Error('Supabase did not return an account. Please try again.');
     }
   }catch(e){Alert.alert('Could not create account',friendly(e))}
   finally{setBusy(false)}
 }
 async function verifySignup(){
   if(!supabase)return;
   if(otp.length!==6){Alert.alert('Enter verification code','Enter all 6 digits from the email.');return;}
   setBusy(true);
   try{
     const {data,error}=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:otp,type:'signup'});
     if(error)throw error;
     if(!data.user)throw new Error('Verification succeeded but no account was returned. Sign in with your email and password.');
     await syncProfile(data.user as any);
     setPendingSignup(false);
     setPassword('');setConfirm('');
     Alert.alert('Email verified','Your account is ready. Welcome to SmartPrep Axom!');
     goHome();
   }catch(e){Alert.alert('Verification failed',friendly(e))}
   finally{setBusy(false)}
 }
 async function resendSignup(){
   if(!supabase||resendIn>0||busy)return;
   setBusy(true);
   try{const {error}=await supabase.auth.resend({type:'signup',email:email.trim().toLowerCase()});if(error)throw error;setResendIn(60);Alert.alert('Code sent','A new verification code has been sent.');}
   catch(e){Alert.alert('Could not resend code',friendly(e))}
   finally{setBusy(false)}
 }
 async function signin(){
   if(!supabase)return;
   const e=email.trim().toLowerCase();
   if(!validEmail(e)||!password){Alert.alert('Missing details','Enter a valid email and password.');return;}
   setBusy(true);
   try{const {data,error}=await supabase.auth.signInWithPassword({email:e,password});if(error)throw error;if(data.user)await syncProfile(data.user as any);goHome();}
   catch(e){Alert.alert('Sign in failed',friendly(e))}
   finally{setBusy(false)}
 }
 async function sendOtpSignin(){
   if(!supabase||!validEmail(email)){Alert.alert('Enter email','Enter a valid email address first.');return;}
   setBusy(true);
   try{const {error}=await supabase.auth.signInWithOtp({email:email.trim().toLowerCase(),options:{shouldCreateUser:false}});if(error)throw error;setOtp('');setMode('otp-signin');setResendIn(60);Alert.alert('Code sent','Enter the sign-in code sent to your email.');}
   catch(e){Alert.alert('Could not send code',friendly(e))}
   finally{setBusy(false)}
 }
 async function verifySigninOtp(){
   if(!supabase||otp.length!==6){Alert.alert('Enter code','Enter the complete 6-digit code.');return;}
   setBusy(true);
   try{const {data,error}=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:otp,type:'email'});if(error)throw error;if(data.user)await syncProfile(data.user as any);goHome();}
   catch(e){Alert.alert('Sign in failed',friendly(e))}
   finally{setBusy(false)}
 }
 async function resendSigninOtp(){
   if(!supabase||resendIn>0||busy)return;
   setBusy(true);
   try{const {error}=await supabase.auth.signInWithOtp({email:email.trim().toLowerCase(),options:{shouldCreateUser:false}});if(error)throw error;setResendIn(60);}
   catch(e){Alert.alert('Could not resend code',friendly(e))}
   finally{setBusy(false)}
 }
 async function resetPassword(){
   if(!supabase||!validEmail(email)){Alert.alert('Enter email','Enter your account email first.');return;}
   setBusy(true);
   try{const {error}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:'smartprepaxom://reset-password'});if(error)throw error;Alert.alert('Reset email sent','Open the link on this device to set a new password.');setMode('signin');}
   catch(e){Alert.alert('Could not send reset email',friendly(e))}
   finally{setBusy(false)}
 }
 const otpMode=mode==='verify-signup'||mode==='otp-signin';
 const title=mode==='signup'?'Create account':mode==='verify-signup'?'Verify your email':mode==='otp-signin'?'Email sign in':mode==='reset'?'Reset password':'Sign in';
 return <KeyboardAvoidingView style={{flex:1,backgroundColor:c.bg}} behavior={Platform.OS==='ios'?'padding':undefined}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:24,paddingTop:Math.max(24,insets.top+12),paddingBottom:Math.max(24,insets.bottom+20),gap:18,flexGrow:1,justifyContent:'center'}}>
   <View style={{alignItems:'center',gap:8,paddingVertical:12}}>
    <Image source={require('../assets/icon.png')} resizeMode="contain" style={{width:78,height:78}}/>
    <Text style={{fontSize:28,fontWeight:'900',letterSpacing:-.8,color:c.text}}>SmartPrep Axom</Text><Copy>Prepare Smarter. Perform Better.</Copy>
   </View>
   {userEmail?<Panel><Copy>YOU ARE SIGNED IN AS</Copy><Text style={{color:c.text,fontWeight:'800',fontSize:16}}>{userEmail}</Text><Button title="Continue to SmartPrep" onPress={goHome}/><Button title="Sign out" onPress={async()=>{await supabase?.auth.signOut()}}/></Panel>:<Panel>
    {mode==='signin'||mode==='signup'?<View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button title="Sign in" onPress={()=>setMode('signin')}/></View><View style={{flex:1}}><Button title="Create account" onPress={()=>setMode('signup')}/></View></View>:null}
    <Heading>{title}</Heading>
    <Copy>{mode==='verify-signup'?'A 6-digit confirmation code was sent to '+email+'. Your chosen password is retained; you do not need to create it again.':mode==='otp-signin'?'Enter the 6-digit sign-in code sent to '+email+'.':mode==='signup'?'Create your account to sync your learning across devices.':mode==='reset'?'We will send a secure password reset link to your email.':'Welcome back to SmartPrep Axom.'}</Copy>
    {mode!=='verify-signup'&&mode!=='otp-signin'?<TextInput style={field} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="Email address" placeholderTextColor={c.muted}/>:null}
    {mode==='signup'?<TextInput style={field} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={c.muted}/>:null}
    {mode==='signin'||mode==='signup'?<><View style={{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:c.border,backgroundColor:c.bg,borderRadius:14}}><TextInput style={[field,{flex:1,borderWidth:0,backgroundColor:'transparent'}]} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" placeholder="Password (min. 8 characters)" placeholderTextColor={c.muted}/><Pressable onPress={()=>setShowPassword(v=>!v)} style={{padding:14}}><Ionicons name={showPassword?'eye-off-outline':'eye-outline'} size={20} color={c.muted}/></Pressable></View>{mode==='signup'?<TextInput style={field} value={confirm} onChangeText={setConfirm} secureTextEntry={!showPassword} placeholder="Confirm password" placeholderTextColor={c.muted}/>:null}</>:null}
    {otpMode?<TextInput style={[field,{letterSpacing:10,textAlign:'center',fontSize:22,fontWeight:'800'}]} value={otp} onChangeText={v=>setOtp(v.replace(/[^0-9]/g,'').slice(0,6))} keyboardType="number-pad" maxLength={6} autoFocus placeholder="• • • • • •" placeholderTextColor={c.muted}/>:null}
    {mode==='signin'?<><Button title={busy?'Signing in…':'Sign in'} onPress={()=>void signin()}/><Pressable onPress={()=>setMode('reset')}><Text style={{color:c.blue,fontWeight:'800',textAlign:'center'}}>Forgot password?</Text></Pressable><Button title="Continue with email OTP" onPress={()=>void sendOtpSignin()}/></>:null}
    {mode==='signup'?<Button title={busy?'Creating account…':'Create account'} onPress={()=>void signup()}/>:null}
    {mode==='verify-signup'?<><Button title={busy?'Verifying…':'Verify email & create account'} onPress={()=>void verifySignup()}/><Pressable disabled={busy||resendIn>0} onPress={()=>void resendSignup()}><Text style={{color:resendIn>0?c.muted:c.blue,fontWeight:'800',textAlign:'center'}}> {resendIn>0?'Resend code in '+resendIn+'s':'Resend verification code'} </Text></Pressable><Pressable onPress={()=>{setMode('signup');setOtp('')}}><Text style={{color:c.blue,textAlign:'center',fontWeight:'700'}}>Back to account details</Text></Pressable></>:null}
    {mode==='otp-signin'?<><Button title={busy?'Verifying…':'Verify & sign in'} onPress={()=>void verifySigninOtp()}/><Pressable disabled={busy||resendIn>0} onPress={()=>void resendSigninOtp()}><Text style={{color:resendIn>0?c.muted:c.blue,textAlign:'center',fontWeight:'800'}}>{resendIn>0?'Resend code in '+resendIn+'s':'Resend sign-in code'}</Text></Pressable><Pressable onPress={()=>setMode('signin')}><Text style={{color:c.blue,textAlign:'center'}}>Back to password sign in</Text></Pressable></>:null}
    {mode==='reset'?<><Button title={busy?'Sending…':'Send password reset link'} onPress={()=>void resetPassword()}/><Pressable onPress={()=>setMode('signin')}><Text style={{color:c.blue,textAlign:'center',fontWeight:'700'}}>Back to sign in</Text></Pressable></>:null}
   </Panel>}
   <Copy>Keep your password and verification code private. Only the resend action is rate-limited; you can type your code immediately.</Copy>
  </ScrollView>
 </KeyboardAvoidingView>;
}
