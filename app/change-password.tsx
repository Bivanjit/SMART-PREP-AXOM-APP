import React,{useEffect,useState} from 'react';
import {Alert,ScrollView,TextInput,View,Text} from 'react-native';
import {router} from 'expo-router';
import {supabase} from '../lib/supabase';
import {useTheme} from './_layout';
import {Heading,Copy,Panel,Button} from '../components/ui';

export default function ChangePassword(){
 const {c,userId}=useTheme();
 const [email,setEmail]=useState('');
 const [currentPassword,setCurrentPassword]=useState('');
 const [password,setPassword]=useState('');
 const [confirm,setConfirm]=useState('');
 const [busy,setBusy]=useState(false);
 const [checking,setChecking]=useState(true);
 const [authenticated,setAuthenticated]=useState(false);
 useEffect(()=>{
  let alive=true;
  void(async()=>{
   try{
    if(!supabase){if(alive)setAuthenticated(false);return;}
    const [{data:{session}},{data:{user}}]=await Promise.all([supabase.auth.getSession(),supabase.auth.getUser()]);
    if(alive){setAuthenticated(!!session&&!!user&&(!!userId&&user.id===userId));setEmail(user?.email||'');}
   }catch{if(alive)setAuthenticated(false);}
   finally{if(alive)setChecking(false);}
  })();
  return()=>{alive=false};
 },[userId]);
 const field={borderWidth:1,borderColor:c.border,color:c.text,backgroundColor:c.bg,borderRadius:13,padding:14,fontSize:15};
 async function save(){
  if(!supabase)return;
  const {data:{session}}=await supabase.auth.getSession();
  const {data:{user}}=await supabase.auth.getUser();
  if(!session||!user||!authenticated||user.id!==userId){Alert.alert('Sign in required','Sign in to the account whose password you want to change.');router.replace('/auth');return;}
  if(!currentPassword){Alert.alert('Current password required','Confirm your identity with your current password. If you cannot remember it, use Forgot password on the sign-in screen.');return;}
  if(password.length<8){Alert.alert('Password too short','Use at least 8 characters.');return;}
  if(password!==confirm){Alert.alert('Passwords do not match','Enter the same password twice.');return;}
  if(password===currentPassword){Alert.alert('Choose a new password','Your new password must be different from your current password.');return;}
  setBusy(true);
  try{
   const {data:verified,error:verifyError}=await supabase.auth.signInWithPassword({email:user.email||email,password:currentPassword});
   if(verifyError||!verified.user||verified.user.id!==user.id)throw new Error('Your current password could not be verified. Use Forgot password if you no longer know it.');
   const {error}=await supabase.auth.updateUser({password});
   if(error)throw error;
   setCurrentPassword('');setPassword('');setConfirm('');
   Alert.alert('Password changed','Your password has been updated after identity verification.');
   router.back();
  }catch(e){Alert.alert('Could not change password',e instanceof Error?e.message:'Please try again.');}
  finally{setBusy(false);}
 }
 return <ScrollView style={{flex:1,backgroundColor:c.bg}} contentContainerStyle={{padding:22,flexGrow:1,justifyContent:'center'}}>
  <Panel>
   <Heading>Change password</Heading>
   {checking?<Copy>Checking your account…</Copy>:!authenticated?<View style={{gap:12}}><Copy>You must be signed in to change an account password. This screen cannot change a password without an authenticated session. Use the secure password-reset flow if you are locked out.</Copy><Button title="Go to sign in" onPress={()=>router.replace('/auth')}/></View>:<>
    <Copy>Confirm your current password first, then choose a new password with at least 8 characters.</Copy>
    <Text style={{fontSize:12,color:c.muted}}>{email}</Text>
    <TextInput style={field} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" placeholder="Current password" placeholderTextColor={c.muted}/>
    <TextInput style={field} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="New password" placeholderTextColor={c.muted}/>
    <TextInput style={field} value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" placeholder="Confirm new password" placeholderTextColor={c.muted}/>
    <Button title={busy?'Verifying & saving…':'Verify and change password'} onPress={()=>void save()}/>
    <Button title="Cancel" onPress={()=>router.back()}/>
   </>}
  </Panel>
 </ScrollView>;
}
