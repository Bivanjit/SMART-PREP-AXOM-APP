import React from 'react';
import {View} from 'react-native';
import {SvgXml} from 'react-native-svg';

export type LeagueName='Bronze'|'Silver'|'Gold'|'Crystal'|'Champion'|'Master'|'Titan'|'Legend';
const palette:Record<LeagueName,{a:string;b:string;c:string;symbol:string}> = {
 Bronze:{a:'#F59A52',b:'#8A3F19',c:'#FFE0A8',symbol:'<path d="M50 30 L56 43 L70 44 L60 53 L63 67 L50 60 L37 67 L40 53 L30 44 L44 43 Z" fill="#FFE0A8"/>'},
 Silver:{a:'#F3F7FF',b:'#64748B',c:'#DCE8FF',symbol:'<path d="M50 30 L56 43 L70 44 L60 53 L63 67 L50 60 L37 67 L40 53 L30 44 L44 43 Z" fill="#F8FBFF"/>'},
 Gold:{a:'#FFE46B',b:'#B76B08',c:'#FFF2AD',symbol:'<path d="M50 30 L56 43 L70 44 L60 53 L63 67 L50 60 L37 67 L40 53 L30 44 L44 43 Z" fill="#FFF2AD"/>'},
 Crystal:{a:'#71E6FF',b:'#0754B8',c:'#D5FBFF',symbol:'<path d="M50 29 L67 50 L50 72 L33 50 Z" fill="#D5FBFF" stroke="#39C9F4" stroke-width="2"/>'},
 Champion:{a:'#66F2C6',b:'#087B5B',c:'#D2FFE9',symbol:'<path d="M36 39 H64 V58 Q50 73 36 58 Z M31 42 H24 V51 Q27 60 38 59 M69 42 H76 V51 Q73 60 62 59 M46 61 H54 V70 H46 Z M39 72 H61 V76 H39 Z" fill="#D2FFE9" stroke="#B9F96D" stroke-width="2"/>'},
 Master:{a:'#D6A1FF',b:'#5624B6',c:'#F0D8FF',symbol:'<path d="M28 39 L38 49 L50 29 L62 49 L72 39 L68 62 H32 Z M30 67 H70 V73 H30 Z" fill="#F0D8FF"/>'},
 Titan:{a:'#FF9AD8',b:'#9D155F',c:'#FFE1F4',symbol:'<path d="M50 28 L69 43 L65 67 L50 78 L35 67 L31 43 Z M43 45 L50 39 L57 45 L57 58 L50 64 L43 58 Z" fill="#FFE1F4" stroke="#FFB6E4" stroke-width="2"/>'},
 Legend:{a:'#FFD35A',b:'#A91D14',c:'#FFF0A8',symbol:'<path d="M50 25 L56 38 L72 38 L61 49 L65 64 L50 56 L35 64 L39 49 L28 38 L44 38 Z" fill="#FFD35A"/><path d="M42 48 Q48 38 60 43 Q54 46 54 53 Q48 60 40 56 Q46 55 42 48 Z" fill="#A91D14"/>'}
};
export function LeagueBadge({league,size=52}:{league:string;size?:number}){
 const key=(palette[league as LeagueName]?league:'Bronze') as LeagueName;
 const p=palette[key];
 const xml='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+p.a+'"/><stop offset="1" stop-color="'+p.b+'"/></linearGradient><linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+p.c+'"/><stop offset="1" stop-color="'+p.b+'"/></linearGradient></defs><path d="M50 5 L91 21 L86 63 L50 94 L14 63 L9 21 Z" fill="url(#g)" stroke="'+p.c+'" stroke-width="3"/><path d="M50 15 L80 27 L77 59 L50 82 L23 59 L20 27 Z" fill="url(#r)" stroke="'+p.b+'" stroke-width="3"/><path d="M50 20 L50 81" stroke="'+p.c+'" stroke-opacity=".28" stroke-width="2"/>'+p.symbol+'<path d="M7 39 L1 62 L15 57 M93 39 L99 62 L85 57" fill="none" stroke="'+p.a+'" stroke-width="5" stroke-linecap="round"/></svg>';
 return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}><SvgXml xml={xml} width={size} height={size}/></View>;
}
