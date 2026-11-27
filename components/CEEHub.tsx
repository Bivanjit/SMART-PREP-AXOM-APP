import React from 'react';
import {ScrollView,View,Text,Pressable} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {useTheme} from '../app/_layout';
import {CEE_INTELLIGENCE_TOOLS,CEE_WORKSPACE_TOOLS,CeeTool} from '../lib/cee-tools';
type Section='intelligence'|'workspace';
export default function CEEHub({section}:{section:Section}){
 const {c}=useTheme();const intelligence=section==='intelligence';const tools=intelligence?CEE_INTELLIGENCE_TOOLS:CEE_WORKSPACE_TOOLS;
 const title=intelligence?'CEE Intelligence':'CEE Workspace';
 const subtitle=intelligence?'Understand the paper, explore historical patterns and plan your admission options with the SmartPrep intelligence suite.':'Your preparation command centre for daily practice, chapter research, counselling and personal CEE planning.';
 const openTool=(tool:CeeTool)=>{void Haptics.selectionAsync();router.push({pathname:'/cee-tool',params:{path:tool.path,title:tool.title}} as never)};
 return <ScrollView style={{flex:1,backgroundColor:c.bg}} contentContainerStyle={{padding:16,paddingBottom:36,gap:15}}>
  <View style={{gap:7,paddingBottom:3}}>
   <Text style={{color:c.green,fontSize:10,fontWeight:'900',letterSpacing:1.5}}>SMARTPREP AXOM · ASSAM CEE 2027</Text>
   <Text style={{color:c.text,fontSize:25,lineHeight:31,fontWeight:'900',letterSpacing:-.5}}>{title}</Text>
   <Text style={{color:c.textSecondary,fontSize:12,lineHeight:19}}>{subtitle}</Text>
  </View>
  <View style={{flexDirection:'row',alignItems:'center',gap:8,padding:12,borderRadius:14,backgroundColor:c.surfaceElevated}}>
   <Ionicons name="cloud-done-outline" size={19} color={c.green}/>
   <Text style={{flex:1,color:c.textSecondary,fontSize:10,lineHeight:16}}>Native app tools · Shared SmartPrep Supabase data · App-matched theme</Text>
  </View>
  {tools.map((tool,index)=><Pressable key={tool.path+tool.title} onPress={()=>openTool(tool)} accessibilityRole="button" style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:88,padding:14,borderRadius:17,backgroundColor:c.card,borderWidth:1,borderColor:c.border,opacity:pressed?.88:1,transform:[{scale:pressed?.99:1}],shadowColor:'#0F172A',shadowOpacity:.045,shadowRadius:8,shadowOffset:{width:0,height:3},elevation:1})}>
   <View style={{width:43,height:43,borderRadius:14,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name={tool.icon} size={21} color={intelligence?c.blue:c.green}/></View>
   <View style={{flex:1,gap:4}}>
    <Text style={{color:c.blue,fontSize:8,fontWeight:'900',letterSpacing:1}}>{String(index+1).padStart(2,'0')} · {tool.tag}</Text>
    <Text style={{color:c.text,fontSize:13,fontWeight:'900'}}>{tool.title}</Text>
    <Text style={{color:c.textSecondary,fontSize:10,lineHeight:15}}>{tool.description}</Text>
   </View>
   <Ionicons name="chevron-forward" size={18} color={c.textMuted}/>
  </Pressable>)}
 </ScrollView>;
}
