import React from 'react';
import {View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
type Icon=keyof typeof Ionicons.glyphMap;
const icons:Icon[]=['ribbon','bulb','create','cash','atom','shield-checkmark','earth','medal','time','star','book','trophy','diamond','school','rocket','checkmark-circle','flag','compass','flash','heart','eye','telescope','podium','star-half','ribbon-outline'];
const tones=[['#E7F3FF','#2875B8'],['#F0EAFE','#7654C7'],['#E5F7F2','#16856B'],['#FFF3DF','#C17A19'],['#FCEAF3','#B64D83']];
export function AchievementBadge({index=0,unlocked=false,size=58}:{index?:number;unlocked?:boolean;size?:number}){
 const icon=icons[index%icons.length];const [bg,fg]=tones[index%tones.length];
 return <View style={{width:size,height:size,borderRadius:size*.29,backgroundColor:unlocked?bg:'#EEF1F5',borderWidth:1,borderColor:unlocked?fg+'35':'#D8DEE8',alignItems:'center',justifyContent:'center',opacity:unlocked?1:.62}}>
  <View style={{width:size*.72,height:size*.72,borderRadius:size*.36,borderWidth:1.5,borderColor:unlocked?fg+'75':'#AAB3C1',alignItems:'center',justifyContent:'center'}}>
   <Ionicons name={icon} size={size*.43} color={unlocked?fg:'#8993A3'}/>
  </View>
 </View>;
}