import React,{useEffect,useMemo,useRef,useState} from 'react';
import {View,ActivityIndicator} from 'react-native';
import {WebView} from 'react-native-webview';
import {useTheme} from '../app/_layout';

const superscript:Record<string,string>={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-'};
const subscript:Record<string,string>={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'-'};
function legacyPlainText(input:string){
 let s=input;
 s=s.replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)/g,m=>'^{'+[...m].map(x=>superscript[x]).join('')+'}');
 s=s.replace(/([₀₁₂₃₄₅₆₇₈₉₊₋]+)/g,m=>'_{'+[...m].map(x=>subscript[x]).join('')+'}');
 s=s.replace(/\[([^\[\]]+)\]\s*\/\s*\[([^\[\]]+)\]/g,(_m,n,d)=>'\\dfrac{'+n.trim()+'}{'+d.trim()+'}');
 s=s.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g,(_m,n,d)=>'\\dfrac{'+n.trim()+'}{'+d.trim()+'}');
 s=s.replace(/√\s*\(([^()]+)\)/g,(_m,v)=>'\\sqrt{'+v+'}');
 s=s.replace(/√\s*([A-Za-z0-9]+)/g,(_m,v)=>'\\sqrt{'+v+'}');
 s=s.replace(/([A-Za-z0-9)\]])\s*\^\s*(?:\{([^{}]+)\}|([A-Za-z]|-?\d+))/g,(_m,b,g,e)=>b+'^{'+(g||e)+'}');
 s=s.replace(/\b([A-Za-z0-9]+)\s*\/\s*([A-Za-z0-9]+)\b/g,(_m,n,d)=>'\\dfrac{'+n+'}{'+d+'}');
 s=s.replace(/<=/g,'\\leq ').replace(/>=/g,'\\geq ').replace(/!=/g,'\\neq ');
 return s;
}
// Question-bank records often contain bare TeX (for example CH_{2}O or M^{-1})
// rather than delimiter-wrapped TeX. Wrap only unmistakable formula tokens;
// ordinary prose is left untouched.
function wrapBareMath(input:string){
 let s=input.replace(/\\(?:sqrt|frac|dfrac)\{(?:[^{}]|\{[^{}]*\})*\}/g,m=>'\\('+m+'\\)');
 return s.replace(/[A-Za-z0-9]+(?:[_^]\{[^{}]+\}[A-Za-z0-9]*)+(?:\s+[A-Za-z0-9]+(?:[_^]\{[^{}]+\}[A-Za-z0-9]*)+)*/g,m=>'\\('+m+'\\)');
}
function convertOutsideMath(input:string){
 const parts=input.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$(?:\\\\.|[^$])*\$)/g);
 return parts.map(part=>/^(?:\\\[|\\\(|\$\$|\$)/.test(part)?part:wrapBareMath(legacyPlainText(part))).join('');
}
function escapeHtml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
export default function MathText({text,size=16,color}:{text:string;size?:number;color?:string}){
 const {c}=useTheme();const [height,setHeight]=useState(36),[ready,setReady]=useState(false);
 const renderKey=String(text)+'|'+size+'|'+(color||'')+'|'+c.text;
 const activeKey=useRef(renderKey);activeKey.current=renderKey;
 useEffect(()=>{setHeight(36);setReady(false)},[renderKey]);
 const html=useMemo(()=>{
  const content=escapeHtml(convertOutsideMath(text||'')).replace(/\n/g,'<br>');
  const safeColor=(color||c.text).replace(/[^#(),.%\w\s-]/g,'');
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>html,body{margin:0;padding:0;background:transparent;color:'+safeColor+';font-family:system-ui,-apple-system,Roboto,sans-serif;font-size:'+size+'px;line-height:1.55;overflow:hidden}#content{display:block;padding:2px 0;overflow-wrap:anywhere;word-break:normal}mjx-container{max-width:100%;}mjx-container[display="true"]{display:block;overflow-x:auto;overflow-y:hidden;margin:.25em 0!important;text-align:center!important}</style><script>window.MathJax={tex:{inlineMath:[["$","$"],["\\\\(","\\\\)"]],displayMath:[["$$","$$"],["\\\\[","\\\\]"]],processEscapes:true,packages:{"[+]":["ams"]}},options:{skipHtmlTags:["script","noscript","style","textarea","pre","code"]},startup:{typeset:false}};</script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script></head><body><div id="content">'+content+'</div><script>(function(){const el=document.getElementById("content");let last=0,frame=0,tries=0;const send=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(!el||!window.ReactNativeWebView)return;const h=Math.ceil(Math.max(el.scrollHeight,el.getBoundingClientRect().height)+8);if(h>0&&Math.abs(h-last)>1){last=h;window.ReactNativeWebView.postMessage(String(h));}});};const typeset=()=>{if(!window.MathJax||!window.MathJax.typesetPromise){if(++tries<40){setTimeout(typeset,100);return;}send();window.ReactNativeWebView&&window.ReactNativeWebView.postMessage("READY");return;}window.MathJax.typesetPromise([el]).then(()=>{send();setTimeout(send,120);setTimeout(send,350);window.ReactNativeWebView&&window.ReactNativeWebView.postMessage("READY");}).catch(()=>{send();window.ReactNativeWebView&&window.ReactNativeWebView.postMessage("READY");});};window.addEventListener("load",typeset);typeset();if(window.ResizeObserver)new ResizeObserver(send).observe(el);})();</script></body></html>';
 },[text,size,color,c.text]);
 return <View style={{height:Math.max(30,Math.min(height,1000)),width:'100%',overflow:'hidden'}}>
  <WebView key={renderKey} originWhitelist={['*']} source={{html}} javaScriptEnabled domStorageEnabled scrollEnabled={false} showsVerticalScrollIndicator={false} backgroundColor="transparent" style={{backgroundColor:'transparent'}} onMessage={e=>{if(activeKey.current!==renderKey)return;const raw=e.nativeEvent.data;if(raw==='READY'){setReady(true);return;}const n=Number(raw);if(Number.isFinite(n)&&n>=20)setHeight(Math.max(30,Math.min(n,1000)));setReady(true)}} onError={()=>setReady(true)}/>
  {!ready?<View pointerEvents="none" style={{position:'absolute',right:3,top:3}}><ActivityIndicator size="small" color={c.muted}/></View>:null}
 </View>;
}
