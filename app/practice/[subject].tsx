import React,{useEffect,useMemo,useState} from 'react';
import {ScrollView,ActivityIndicator,TextInput,Pressable,View,Text} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {subjects,syllabus,Subject} from '../../lib/content';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {Heading,Copy,Panel,Button} from '../../components/ui';
type Grade='Class 11'|'Class 12';
export default function Chapters(){
 const {subject}=useLocalSearchParams<{subject:string}>();const s=(subject in subjects?subject:'Physics') as Subject;
 const {c}=useTheme();const [grade,setGrade]=useState<Grade>('Class 11');const [search,setSearch]=useState('');const [published,setPublished]=useState<Record<string,string>>({});const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;void(async()=>{if(!supabase){setLoading(false);return;}try{const {data:sub}=await supabase.from('subjects').select('id').eq('slug',s.toLowerCase()).maybeSingle();if(!sub)return;const {data}=await supabase.from('chapters').select('id,name').eq('subject_id',sub.id).eq('is_active',true);if(active){const map:Record<string,string>={};(data||[]).forEach(ch=>{map[String(ch.name).trim().toLowerCase()]=ch.id});setPublished(map)}}finally{if(active)setLoading(false)}})();return()=>{active=false}},[s]);
 const chapters=useMemo(()=>syllabus[s][grade].filter(x=>x.toLowerCase().includes(search.trim().toLowerCase())),[s,grade,search]);
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:18,gap:14,paddingBottom:40}}>
  <Copy>SMARTPREP AXOM · CHAPTER-WISE PRACTICE</Copy><Heading>{s}</Heading><Copy>Choose your class to explore the complete PCM chapter syllabus.</Copy>
  <View style={{flexDirection:'row',gap:8}}>{(['Class 11','Class 12'] as Grade[]).map(g=><Pressable key={g} onPress={()=>setGrade(g)} style={{flex:1,padding:13,borderRadius:13,alignItems:'center',backgroundColor:grade===g?c.blue:c.card,borderWidth:1,borderColor:grade===g?c.blue:c.border}}><Text style={{fontWeight:'900',color:grade===g?'#FFFFFF':c.text}}>{g}</Text></Pressable>)}</View>
  <TextInput value={search} onChangeText={setSearch} placeholder="Search chapters…" placeholderTextColor={c.muted} style={{borderWidth:1,borderColor:c.border,borderRadius:13,padding:13,color:c.text,backgroundColor:c.card}}/>
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:14,fontWeight:'900',color:c.text}}>{grade} · {s}</Text><Text style={{fontSize:11,color:c.muted}}>{chapters.length} chapters</Text></View>
  {loading?<ActivityIndicator color={c.blue}/>:chapters.map((name,i)=>{const id=published[name.toLowerCase()];return <Pressable key={name} onPress={()=>id?router.push({pathname:'/quiz',params:{subject:s,chapter:name,chapterId:id}}):undefined} style={({pressed})=>({backgroundColor:c.card,borderWidth:1,borderColor:c.border,borderRadius:15,padding:14,flexDirection:'row',alignItems:'center',gap:12,opacity:pressed?.7:1})}><View style={{width:34,height:34,borderRadius:11,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Text style={{fontWeight:'900',fontSize:12,color:c.blue}}>{i+1}</Text></View><View style={{flex:1,gap:4}}><Text style={{fontSize:13,fontWeight:'800',color:c.text}}>{name}</Text><Text style={{fontSize:10,color:id?c.green:c.muted}}>{id?'Practice available':'Chapter syllabus'}</Text></View><Ionicons name={id?'chevron-forward':'lock-closed-outline'} size={17} color={c.muted}/></Pressable>})}
  {!loading&&chapters.length===0?<Panel><Copy>No chapters match your search.</Copy></Panel>:null}
  <Panel><Heading>Keep building your concepts</Heading><Copy>Practice questions unlock for a chapter as soon as its question set is available. Your syllabus remains visible across both classes.</Copy><Button title="Back to subjects" onPress={()=>router.back()}/></Panel>
 </ScrollView>
}