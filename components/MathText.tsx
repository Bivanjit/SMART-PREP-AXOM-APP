import React,{useEffect,useMemo,useState} from 'react';
import {View,ActivityIndicator} from 'react-native';
import {WebView} from 'react-native-webview';
import {useTheme} from '../app/_layout';

function findClose(s:string,start:number,open='[',close=']'){let depth=0;for(let i=start;i<s.length;i++){if(s[i]===open)depth++;else if(s[i]===close){depth--;if(depth===0)return i;}}return -1;}
function legacyToTex(input:string){
 let s=input||'';
 // Convert bracketed numerator/denominator pairs into proper stacked fractions.
 let out='',i=0;
 while(i<s.length){
  if(s[i]==='['){const ne=findClose(s,i);if(ne>=0){let slash=ne+1;while(/\s/.test(s[slash]||''))slash++;let ds=slash+1;while(/\s/.test(s[ds]||''))ds++;if(s[slash]==='/'&&s[ds]==='['){const de=findClose(s,ds);if(de>=0){out+='\\\\(\\\\dfrac{'+s.slice(i+1,ne).trim()+'}{'+s.slice(ds+1,de).trim()+'}\\\\)';i=de+1;continue;}}}}
  out+=s[i++];
 }
 s=out;
 // TeX powers support numeric and alphabetic exponents: x^2, G^x, c^y, h^z.
 s=s.replace(/([A-Za-z0-9)\\]])\\s*\\^\\s*(?:\\{([^{}]+)\\}|([A-Za-z]|-?\\d+))/g,(_m,base,group,single)=>'\\\\('+base+'^{'+(group||single)+'}\\\\)');
 // Render roots in the common legacy form √(expression).
 s=s.replace(/√\\s*\\(([^()]+)\\)/g,(_m,body)=>'\\\\(\\\\sqrt{'+body+'}\\\\)');
 // Render simple legacy x/y fractions as stacked fractions when both sides are grouped.
 s=s.replace(/\\(([^()]+)\\)\\s*\\/\\s*\\(([^()]+)\\)/g,(_m,n,d)=>'\\\\(\\\\dfrac{'+n+'}{'+d+'}\\\\)');
 // Normalize comparison operators and common chemical charge notation.
 s=s.replace(/\\s*<=\\s*/g,' ≤ ').replace(/\\s*>=\\s*/g,' ≥ ');
 s=s.replace(/\\b([A-Z][a-z]?\\d*)([+-])\\b/g,'$1^{\\\\text{$2}}');
 return s;
}
function escapeHtml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;');}
export default function MathText({text,size=16,color}:{text:string;size?:number;color?:string}){
 const {c}=useTheme();const [height,setHeight]=useState(42);const [ready,setReady]=useState(false);
 useEffect(()=>{setHeight(42);setReady(false);},[text,size,color]);
 const html=useMemo(()=>{
  const content=escapeHtml(legacyToTex(text||'')).replace(/\n/g,'<br>');
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>html,body{margin:0;padding:0;background:transparent;color:'+(color||c.text)+';font-family:system-ui,-apple-system,Roboto,sans-serif;font-size:'+size+'px;line-height:1.45;overflow:hidden}#content{padding:1px 0;overflow-wrap:anywhere}mjx-container[display="true"]{margin:.12em 0!important;text-align:center!important}</style><script>window.MathJax={tex:{inlineMath:[["$","$"],["\\\\(","\\\\)"]],displayMath:[["$$","$$"],["\\\\[","\\\\]"]],processEscapes:true},options:{skipHtmlTags:["script","noscript","style","textarea","pre","code"]},startup:{pageReady:()=>MathJax.startup.defaultPageReady().then(()=>{const send=()=>window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(String(Math.ceil(document.getElementById("content").getBoundingClientRect().height+2)));send();setTimeout(send,120);setTimeout(send,350)})}};</script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script></head><body><div id="content">'+content+'</div><script>new MutationObserver(()=>{const e=document.getElementById("content");if(window.ReactNativeWebView&&e)window.ReactNativeWebView.postMessage(String(Math.ceil(e.getBoundingClientRect().height+2)))}).observe(document.getElementById("content"),{subtree:true,childList:true,attributes:true,characterData:true});</script></body></html>';
 },[text,size,color,c.text]);
 return <View style={{height:Math.max(32,Math.min(height,900)),width:'100%'}}><WebView key={String(text)+'|'+size+'|'+(color||'')} originWhitelist={['*']} source={{html}} javaScriptEnabled domStorageEnabled scrollEnabled={false} showsVerticalScrollIndicator={false} backgroundColor="transparent" style={{backgroundColor:'transparent'}} onMessage={e=>{const n=Number(e.nativeEvent.data);if(Number.isFinite(n)&&n>0)setHeight(Math.max(32,Math.min(n+2,900)));setReady(true)}} onError={()=>setReady(true)}/>{!ready?<View pointerEvents="none" style={{position:'absolute',right:3,top:3}}><ActivityIndicator size="small" color={c.muted}/></View>:null}</View>;
}
