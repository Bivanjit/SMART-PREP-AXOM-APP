import React from 'react';
import Svg,{Defs,LinearGradient,Stop,Rect,Path,Polygon,Line} from 'react-native-svg';
export default function BrandLogo({size=48}:{size?:number}){
 return <Svg width={size} height={size} viewBox="0 0 100 100">
  <Rect x="0" y="0" width="100" height="100" rx="20" fill="#06163B"/>
  <Path d="M20 39 C20 29 29 25 43 21 L73 11 L89 21 L70 31 C79 35 76 44 64 49 L28 61 C17 64 11 55 20 39Z" fill="#FFFFFF"/>
  <Path d="M28 59 C41 54 58 48 70 44 C83 40 91 47 86 61 L81 74 C78 83 67 86 55 89 L18 99 C12 101 10 97 12 91 L17 73 C19 66 22 62 28 59Z" fill="url(#ribbon)"/>
  <Defs><LinearGradient id="ribbon" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#7DD3FC"/><Stop offset=".48" stopColor="#0EA5E9"/><Stop offset="1" stopColor="#075BFF"/></LinearGradient></Defs>
  <Polygon points="51,12 75,2 96,13 73,24" fill="#FFFFFF"/>
  <Path d="M73 24 L73 37" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round"/>
  <Path d="M69 37 L77 37 L79 45 L67 45Z" fill="#FFFFFF"/>
  <Path d="M51 12 L75 2 L96 13 L73 24Z" fill="#FFFFFF"/>
 </Svg>;
}
