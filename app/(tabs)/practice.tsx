import React from 'react';
import {ScrollView,Pressable,View,Text} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {subjects,Subject} from '../../lib/content';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel} from '../../components/ui';
import {tr} from '../../lib/i18n';

const meta:Record<string,{icon:keyof typeof Ionicons.glyphMap;bg:string;iconColor:string;tag:string}>={
 Physics:{icon:'atom-outline',bg:'#DBEAFE',iconColor:'#1D4ED8',tag:'Concepts, laws and numericals'},
 Chemistry:{icon:'flask-outline',bg:'#DCFCE7',iconColor:'#166534',tag:'Reactions and core concepts'},
 Mathematics:{icon:'calculator-outline',bg:'#FEF3C7',iconColor:'#92400E',tag:'Problem solving and accuracy'}
};
export default function Practice(){
 const {c,language}=useTheme();
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:18,paddingTop:16,gap:17,paddingBottom:40}}>
  <View style={{gap:5}}><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:c.green}}>STUDY WORKSPACE</Text><Heading>{tr(language,'Practice')}</Heading><Copy>Build confidence one chapter and one question at a time.</Copy></View>
  <Panel style={{backgroundColor:c.card,gap:7}}>
   <Text style={{fontSize:16,fontWeight:'900',color:c.text}}>Choose your practice path</Text>
   <Copy>Start with a subject, then select a chapter to open the available question sets.</Copy>
   <View style={{flexDirection:'row',alignItems:'center',gap:8,marginTop:3}}><Ionicons name="shield-checkmark-outline" size={17} color={c.green}/><Text style={{fontSize:11,color:c.muted}}>Your answers and results are checked through the existing practice flow.</Text></View>
  </Panel>
  <View style={{gap:4}}><Heading>Subjects</Heading><Copy>Three focused paths for Assam CEE.</Copy></View>
  {(Object.keys(subjects) as Subject[]).map(s=>{
   const m=meta[s];
   return <Pressable key={s} onPress={()=>router.push({pathname:'/practice/[subject]',params:{subject:s}})} accessibilityRole="button" style={({pressed})=>({backgroundColor:c.card,borderRadius:17,borderWidth:1,borderColor:c.border,padding:16,opacity:pressed?.8:1,gap:12})}>
    <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
     <View style={{width:49,height:49,borderRadius:15,backgroundColor:m.bg,alignItems:'center',justifyContent:'center'}}><Ionicons name={m.icon} size={24} color={m.iconColor}/></View>
     <View style={{flex:1,gap:3}}><Text style={{fontSize:16,fontWeight:'900',color:c.text}}>{s}</Text><Text style={{fontSize:12,color:c.muted}}>{m.tag}</Text></View>
     <Ionicons name="chevron-forward" size={20} color={c.muted}/>
    </View>
    <View style={{height:1,backgroundColor:c.border}}/>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:11,color:c.muted}}>{subjects[s].length} chapters in catalogue</Text><Text style={{fontSize:11,color:c.blue,fontWeight:'900'}}>VIEW CHAPTERS</Text></View>
   </Pressable>
  })}
  <Panel><View style={{flexDirection:'row',alignItems:'center',gap:9}}><Ionicons name="bookmark-outline" size={19} color={c.blue}/><Text style={{fontWeight:'900',color:c.text}}>Revision tools</Text></View><Copy>Saved questions and your mistake notebook remain available from the More menu for focused revision.</Copy><View style={{flexDirection:'row',gap:9}}><Pressable onPress={()=>router.push('/saved')} style={{flex:1,padding:12,borderRadius:11,backgroundColor:c.soft,alignItems:'center'}}><Text style={{fontSize:12,fontWeight:'800',color:c.blue}}>Saved questions</Text></Pressable><Pressable onPress={()=>router.push('/mistakes')} style={{flex:1,padding:12,borderRadius:11,backgroundColor:c.soft,alignItems:'center'}}><Text style={{fontSize:12,fontWeight:'800',color:c.blue}}>Mistake notebook</Text></Pressable></View></Panel>
 </ScrollView>;
}
