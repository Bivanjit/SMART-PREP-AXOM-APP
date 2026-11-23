import React,{useEffect,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert,KeyboardAvoidingView,Platform,ScrollView,Text,TextInput,View,Pressable,ActivityIndicator,Image} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {supabase} from '../lib/supabase';
import {useTheme} from './_layout';
import {unregisterDevicePushToken} from '../lib/push-notifications';

type Mode='signin'|'signup'|'verify-signup'|'otp-signin'|'reset';
const validEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const friendly=(e:unknown)=>e instanceof Error?e.message:'Something went wrong. Please try again.';
export default function AuthScreen(){
 const {c,userEmail,userId}=useTheme();const insets=useSafeAreaInsets();
 const [email,setEmail]=useState(''),[name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [mode,setMode]=useState<Mode>('signin'),[busy,setBusy]=useState(false),[otp,setOtp]=useState(''),[showPassword,setShowPassword]=useState(false),[resendIn,setResendIn]=useState(0);
 useEffect(()=>{if(resendIn<=0)return;const timer=setTimeout(()=>setResendIn(v=>Math.max(0,v-1)),1000);return()=>clearTimeout(timer)},[resendIn]);
 const goHome=()=>router.replace('/(tabs)');
 const field={minHeight:52,borderWidth:1,borderColor:c.border,borderRadius:12,paddingHoriz¶»§q«^