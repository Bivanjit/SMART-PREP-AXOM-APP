import React,{createContext,useContext,useEffect,useState} from 'react';
import {Stack,router,usePathname} from 'expo-router';
import {ActivityIndicator,View,Text,Image} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import {registerDevicePushToken} from '../lib/push-notifications';
import {supabase} from '../lib/supabase';
void SplashScreen.preventAutoHideAsync().catch(()=>{});
type Mode='light'|'dark';
type Language='en'|'as';
const colors={light:{bg:'#F6F8FA',card:'#FFFFFF',text:'#172033',muted:'#596579',border:'#E2E8F0',blue:'#1E3A8A',soft:'#EAF0FA',green:'#14532D',red:'#DC4545',amber:'#D97706',review:'#6D28D9',unvisited:'#94A3B8'},dark:{bg:'#11141A',card:'#1B222C',text:'#F1F5F9',muted:'#A3AFBF',border:'#2E3948',blue:'#8FA8FF',soft:'#242C38',green:'#4ADE80',red:'#F87171',amber:'#FBBF24',review:'#A78BFA',unvisited:'#64748B'}};
type Attempt={id:string;title:string;score:number;max:number;correct:number;wrong:number;skipped:number;date:string};
type Theme={mode:Mode;setMode:(m:Mode)=>void;language:Language;setLanguage:(l:Language)=>void;c:typeof colors.light;bookmarks:string[];toggleBookmark:(id:string)=>void;attempts:Attempt[];saveAttempt:(a:Attempt)=>void;userEmail:string|null¶»§q«^