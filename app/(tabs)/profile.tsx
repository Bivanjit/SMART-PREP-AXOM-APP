import React,{useCallback,useEffect,useState} from 'react';
import {ScrollView,View,Pressable,Text,Linking,ActivityIndicator,Alert,TextInput,Image} from 'react-native';
import {router} from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {imageAssetToBytes} from '../../lib/imageUpload';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../lib/supabase';
import {unregisterDevicePushToken} from '../../lib/push-notifications';
import {useTheme} from '../_layout';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
function Row({icon,title,subtitle,onPress}:{icon:keyof typeof Ionicons.glyphMap;title:string;subtitle?:string;onPress:()=>void}){
 const {c}=useTheme();return <Pressable onPress={onPress} style={({pressed})=>({minHeight:54,flexDirection:'row',alignItems:'center',gap:12,paddingVertical:11,borderBottomWidth:1,borderBottomColor:c.border,opacity:pressed?.7:1})}><View style={{width:34,height:34,borderRadius:11,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name={icon} size={18} color={c.blue}/></View><View style={{flex:1,gap:2}}><Text style={{color:c.text,fontWeight:'700',fontSize:13}}>{title}</Text>{subtitle?<Text style={{color:c.muted,fontSize:11}}>{subtitle}</Text>:null}</View><Ionicons name="chevron-forward" size={16} color={c.muted}/></Pressable>
}
function Stat({value,label}:{value:string;label:string}){const {c}=useTheme();return <View style={{flex:1,alignItems:'center',paddin¶»§q«^