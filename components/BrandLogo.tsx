import React from 'react';
import Svg,{Defs,LinearGradient,Stop,Rect,Path,Polygon} from 'react-native-svg';

export default function BrandLogo({size=48}:{size?:number}){
 return <Svg width={size} height={size} viewBox="0 0 100 100">
  <Rect width="100" height="100" rx="20" fill="#07184B"/>
  <Defs>
   <LinearGradient id="brandRibbon" x1="0" y1="0" x2="1" y2="1">
    <Stop offset="0" stopColor="#7DD3FC"/>
    <Stop offset=".46" stopColor="#12A7F5"/>
    <Stop offset="1" stopColor="#075BFF"/>
   </LinearGradient>
  </Defs>
  <Path d="M15 45 C17 32 29 26 45 22 L72 15 C85 12 91 20 86 33 C82 44 75 49 61 53 L27 64 C17 67 12 57 15 45Z" fill="#FFFFFF"/>
  <Path d="M27 62 C40 57 56 51 70 47 C84 43 92 51 87 66 L81 81 C77 90 68 92 55 96 L13 100 C8 101 6 97 8 91 L14 73 C16 67 20 64 27 62Z" fill="url(#brandRibbon)"/>
  <Path d="M52 10 L75 1 L97 13 L74 25Z" fill="#FFFFFF"/>
  <Path d="M74 24 L74 39" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round"/>
  <Path d="M69 38 L79 38 L81 48 L67 48Z" fill="#FFFFFF"/>
 </Svg>;
}
