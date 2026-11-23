import React from 'react';
import {View,Text,Pressable,ViewStyle,TextStyle} from 'react-native';
import * as Haptics from 'expo-haptics';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '../app/_layout';

export function Heading({children,style}:{children:React.ReactNode;style?:TextStyle}){
 const {c}=useTheme();
 return <Text style={[{color:c.text,fontSize:21,fontWeight:'800',letterSpacing:-.45},style]}>{children}</Text>;
}
export function Copy({children,style}:{children:React.ReactNode;style?:TextStyle}){
 const {c}=useTheme();
 return <Text style={[{color:c.muted,fontSize:13,lineHeight:20},style]}>{children}</Text>;
}
export function Panel({children,style}:{children:React.ReactNode;style?:ViewStyle}){
 const {c}=useTheme();
 return <View style={[{backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:17,padding:15,gap:10},style]}>{children}</View>;
}
export function Button({title,onPress,variant='primary',icon}:{title:string;onPress:()=>void;variant?:'primary'|'secondary'|'quiet';icon?:keyof typeof Ionicons.glyphMap}){
 const {c}=useTheme();
 const primary=variant==='primary';
 const quiet=variant==='quiet';
 return <Pressable accessibilityRole="button" onPress={()=>{void Haptics.selectionAsync();onPress()}} style={({pressed})=>({backgroundColor:primary?c.blue:quiet?'transparent':c.card,borderWidth:primary||quiet?0:1,borderColor:c.border,borderRadius:12,paddingVertical:13,paddingHorizontal:16,minHeight:48,opacity:pressed?.78:1,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8})}>
  {icon?<Ionicons name={icon} size={17} color={primary?'#FFFFFF':c.blue}/>:null}
  <Text style={{color:primary?'#FFFFFF':c.text,fontWeight:'800',fontSize:13}}>{title}</Text>
 </Pressable>;
}
