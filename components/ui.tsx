import React from 'react';
import {View,Text,Pressable,ViewStyle,TextStyle,ActivityIndicator} from 'react-native';
import * as Haptics from 'expo-haptics';
import {Ionicons} from '@expo/vector-icons';
import Svg,{Circle} from 'react-native-svg';
import {useTheme} from '../app/_layout';
import {designMetrics} from '../lib/theme';

export function Heading({children,style}:{children:React.ReactNode;style?:TextStyle}){
 const {c}=useTheme();
 return <Text style={[{color:c.text,fontSize:21,fontWeight:'800',letterSpacing:-.45},style]}>{children}</Text>;
}
export function Copy({children,style}:{children:React.ReactNode;style?:TextStyle}){
 const {c}=useTheme();
 return <Text style={[{color:c.textSecondary,fontSize:13,lineHeight:20},style]}>{children}</Text>;
}
export function Panel({children,style}:{children:React.ReactNode;style?:ViewStyle}){
 const {c}=useTheme();
 return <View style={[{backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:designMetrics.radius.medium,padding:15,gap:10},style]}>{children}</View>;
}
type ButtonVariant='primary'|'secondary'|'quiet'|'disabled';
export function Button({title,onPress,variant='primary',icon,disabled=false,loading=false}:{title:string;onPress:()=>void;variant?:ButtonVariant;icon?:keyof typeof Ionicons.glyphMap;disabled?:boolean;loading?:boolean}){
 const {c}=useTheme();
 const unavailable=disabled||variant==='disabled'||loading;
 const primary=variant==='primary';
 const secondary=variant==='secondary';
 const quiet=variant==='quiet';
 const bg=unavailable?c.surfaceElevated:primary?c.amber:secondary?'transparent':'transparent';
 const fg=unavailable?c.textMuted:primary?'#FFFFFF':secondary?c.green:c.text;
 return <Pressable accessibilityRole="button" accessibilityState={{disabled:unavailable}} disabled={unavailable} onPress={()=>{void Haptics.selectionAsync();onPress()}} style={({pressed})=>({backgroundColor:bg,borderWidth:secondary?1:0,borderColor:secondary?c.green:'transparent',borderRadius:12,paddingVertical:13,paddingHorizontal:16,minHeight:48,opacity:pressed?.78:1,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8})}>
  {loading?<ActivityIndicator size="small" color={fg}/>:icon?<Ionicons name={icon} size={17} color={fg}/>:null}
  <Text style={{color:fg,fontWeight:'800',fontSize:13}}>{title}</Text>
 </Pressable>;
}
export function SubjectBadge({subject}:{subject:'Physics'|'Chemistry'|'Mathematics'}){
 const {c}=useTheme();
 const style=subject==='Physics'?{bg:c.physicsBg,fg:c.physicsFg}:subject==='Chemistry'?{bg:c.chemistryBg,fg:c.chemistryFg}:{bg:c.mathematicsBg,fg:c.mathematicsFg};
 const icon=subject==='Physics'?'atom-outline':subject==='Chemistry'?'flask-outline':'calculator-outline';
 return <View style={{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10,paddingVertical:6,borderRadius:9,backgroundColor:style.bg}}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={style.fg}/><Text style={{fontSize:11,fontWeight:'800',color:style.fg}}>{subject}</Text></View>;
}
export type QuestionStatus='answered'|'not_answered'|'review'|'not_visited';
export function StatusBadge({status,count,compact=false}:{status:QuestionStatus;count?:number;compact?:boolean}){
 const {c}=useTheme();
 const map={answered:{label:'Answered',icon:'checkmark-circle',color:c.success},not_answered:{label:'Not Answered',icon:'square-outline',color:c.error},review:{label:'Marked for Review',icon:'bookmark',color:c.review},not_visited:{label:'Not Visited',icon:'remove-circle-outline',color:c.unvisited}} as const;
 const m=map[status];
 return <View style={{flexDirection:'row',alignItems:'center',gap:7}}><Ionicons name={m.icon} size={compact?14:16} color={m.color}/><Text style={{fontSize:compact?10:12,fontWeight:'700',color:c.textSecondary}}>{m.label}{typeof count==='number'?' ('+count+')':''}</Text></View>;
}
export function SegmentedTabs<T extends string>({options,value,onChange}:{options:{label:string;value:T}[];value:T;onChange:(value:T)=>void}){
 const {c}=useTheme();
 return <View style={{flexDirection:'row',padding:4,borderRadius:13,backgroundColor:c.surfaceElevated,gap:3}}>{options.map(option=><Pressable key={option.value} accessibilityRole="tab" accessibilityState={{selected:value===option.value}} onPress={()=>onChange(option.value)} style={{flex:1,minHeight:40,alignItems:'center',justifyContent:'center',paddingHorizontal:5,borderRadius:10,backgroundColor:value===option.value?c.green:'transparent'}}><Text numberOfLines={1} style={{fontSize:11,fontWeight:'800',color:value===option.value?'#FFFFFF':c.textSecondary}}>{option.label}</Text></Pressable>)}</View>;
}
export function EmptyState({icon='file-tray-outline',title,description,action}:{icon?:keyof typeof Ionicons.glyphMap;title:string;description:string;action?:React.ReactNode}){
 const {c}=useTheme();
 return <View style={{alignItems:'center',justifyContent:'center',padding:24,gap:10,borderRadius:16,backgroundColor:c.surfaceElevated}}><View style={{width:52,height:52,borderRadius:17,backgroundColor:c.card,alignItems:'center',justifyContent:'center'}}><Ionicons name={icon} size={25} color={c.textMuted}/></View><Text style={{fontSize:15,fontWeight:'900',color:c.text,textAlign:'center'}}>{title}</Text><Text style={{fontSize:12,lineHeight:18,color:c.textSecondary,textAlign:'center'}}>{description}</Text>{action}</View>;
}
export function ProgressBar({value,height=8}:{value:number;height?:number}){
 const {c}=useTheme();const safe=Math.max(0,Math.min(100,value));
 return <View accessibilityRole="progressbar" accessibilityValue={{min:0,max:100,now:safe}} style={{height,backgroundColor:c.surfaceElevated,borderRadius:99,overflow:'hidden'}}><View style={{height:'100%',width:(safe+'%') as `${number}%`,backgroundColor:c.green,borderRadius:99}}/></View>;
}
export function ProgressRing({value,size=76,stroke=7}:{value:number;size?:number;stroke?:number}){
 const {c}=useTheme();const safe=Math.max(0,Math.min(100,value));const radius=(size-stroke)/2;const circumference=2*Math.PI*radius;
 return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}><Svg width={size} height={size} style={{position:'absolute'}}><Circle cx={size/2} cy={size/2} r={radius} stroke={c.surfaceElevated} strokeWidth={stroke} fill="none"/><Circle cx={size/2} cy={size/2} r={radius} stroke={c.green} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference*(1-safe/100)} fill="none" rotation="-90" origin={`${size/2}, ${size/2}`}/></Svg><Text style={{fontSize:size*.22,fontWeight:'900',color:c.text}}>{Math.round(safe)}%</Text></View>;
}
export function CardRow({icon,title,description,onPress,accent}:{icon:keyof typeof Ionicons.glyphMap;title:string;description:string;onPress:()=>void;accent?:string}){
 const {c}=useTheme();
 return <Pressable onPress={onPress} accessibilityRole="button" style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:12,padding:14,borderRadius:14,borderWidth:1,borderColor:c.border,backgroundColor:c.card,opacity:pressed?.75:1})}><View style={{width:42,height:42,borderRadius:13,backgroundColor:c.surfaceElevated,alignItems:'center',justifyContent:'center'}}><Ionicons name={icon} size={21} color={accent||c.green}/></View><View style={{flex:1,gap:3}}><Text style={{fontSize:13,fontWeight:'900',color:c.text}}>{title}</Text><Text style={{fontSize:11,color:c.textSecondary}}>{description}</Text></View><Ionicons name="chevron-forward" size={17} color={c.textMuted}/></Pressable>;
}
