import React,{useMemo,useState} from 'react';
import {View,ActivityIndicator} from 'react-native';
import {WebView} from 'react-native-webview';
import {useTheme} from '../app/_layout';

const SUPER:Record<string,string>={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','+':'⁺'};
const SUB:Record<string,string>={'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','+':'₊','-':'₋'};
function matchingParen(s:string,start:number){let depth=0;for(let i=start;i<s.length;i++){if(s[i]==='(')depth++;else if(s[i]===')'){depth--;if(depth===0)return i;}}return -1;}
function formatLegacyFractions(s:string){
 let out='',i=0;
 while(i<s.length){
  if(s[i]!=='('){out+=s[i++];continue;}
  const ne=matchingParen(s,i);if(ne<0){out+=s[i++];continue;}
  let slash=ne+1;while(/\s/.test(s[slash]||''))slash++;
  let ds=slash+1;while(/\s/.test(s[ds]||''))ds++;
  if(s[slash]!=='/'||s[ds]!=='('){out+=s.slice(i,ne+1);i=ne+1;continue;}
  const de=matchingParen(s,ds);if(de<0){out+=s.slice(i,ne+1);i=ne+1;continue;}
  const n=s.slice(i+1,ne).trim(),d=s.slice(ds+1,de).trim();
  out+='\\\\(\\\\dfrac{'+n+'}{'+d+'}\\\\)';i=de+1;
 }
 return out;
}
function normalizeLegacyMath(value:string){
 let s=value.replace(/\s*<=\s*/g,' ≤ ').replace(/\s*>=\s*/g,' ≥ ');
 s=formatLegacyFractions(s);
 s=s.replace(/([A-Za-z0-9)\]])\s*\^\s*(-?\d+)/g,(_m,base,exp)=>base+String(exp).split('').map((ch:string)=>SUPER[ch]||ch).join(''));
 s=s.replace(/\b(?:[A-Z][a-z]?\d*){2,}(?:\([A-Z][a-z]?\d*\)\d*)*\b/g,formula=>formula.replace(/(\d+)/g,d=>d.split('').map(ch=>SUB[ch]||ch).join('')));
 return s;
}
function escapeHtml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;');}
export default function MathText({text,size=16,color}:{text:string;size?:number;color?:string}){
 const {c}=useTheme();const [height,setHeight]=useState(42);const [ready,setReady]=useState(false);
 const html=useMemo(()=>{
  const content=escapeHtml(normalizeLegacyMath(text||'')).replace(/\n/g,'<br>');
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>html,body{margin:0;padding:0;background:transparent;color:'+ (color||c.text) +';font-family:system-ui,-apple-system,Roboto,sans-serif;font-size:'+size+'px;line-height:1.5;overflow:hidden}#content{padding:1px 0;overflow-wrap:anywhere}mjx-container[display="true"]{margin:.25em 0!important;text-align:center!important}</style><script>window.MathJax={tex:{inlineMath:[["$","$"],["\\\\(","\\\\)"]],displayMath:[["$$","$$"],["\\\\[","\\\\]"]],processEscapes:true},options:{skipHtmlTags:["script","noscript","style","textarea","pre","code"]},startup:{pageReady:()=>MathJax.startup.defaultPageReady().then(()=>setTimeout(()=>window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(String(Math.ceil(document.documentElement.scrollHeight))),100))}};</script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script></head><body><div id="content">'+content+'</div><script>new MutationObserver(()=>{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(String(Math.ceil(document.documentElement.scrollHeight)))}).observe(document.body,{subtree:true,childList:true,attributes:true});</script></body></html>';
 },[text,size,color,c.text]);
 return <View style={{height:Math.max(32,Math.min(height,1200)),width:'100%'}}><WebView originWhitelist={['*']} source={{html}} javaScriptEnabled domStorageEnabled scrollEnabled={false} showsVerticalScrollIndicator={false} backgroundColor="transparent" style={{backgroundColor:'transparent'}} onMessage={e=>{const n=Number(e.nativeEvent.data);if(Number.isFinite(n)&&n>0)setHeight(Math.max(32,Math.min(n+4,1200)));setReady(true)}} onError={()=>setReady(true)}/>{!ready?<View pointerEvents="none" style={{position:'absolute',right:3,top:3}}><ActivityIndicator size="small" color={c.muted}/></View>:null}</View>;
}
