import React,{useEffect,useMemo,useRef,useState} from 'react';
import {View,ActivityIndicator} from 'react-native';
import {WebView} from 'react-native-webview';
import {useTheme} from '../app/_layout';

/** Convert legacy plain-text notation only. Existing LaTeX regions are kept byte-for-byte. */
function legacyPlainText(input:string){
 let s=input;
 // Legacy bracketed fractions: [numerator]/[denominator]
 s=s.replace(/\[([^\[\]]+)\]\s*\/\s*\[([^\[\]]+)\]/g,(_m,n,d)=>'\\(\\dfrac{'+n.trim()+'}{'+d.trim()+'}\\)');
 // Legacy grouped fractions: (numerator)/(denominator)
 s=s.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g,(_m,n,d)=>'\\(\\dfrac{'+n.trim()+'}{'+d.trim()+'}\\)');
 // Roots written as √(expression)
 s=s.replace(/√\s*\(([^()]+)\)/g,(_m,v)=>'\\(\\sqrt{'+v+'}\\)');
 // Plain-text powers, including alphabetic exponents such as G^x and h^z.
 s=s.replace(/([A-Za-z0-9)\]])\s*\^\s*(?:\{([^{}]+)\}|([A-Za-z]|-?\d+))/g,(_m,b,g,e)=>'\\('+b+'^{'+(g||e)+'}\\)');
 s=s.replace(/\s*<=\s*/g,' ≤ ').replace(/\s*>=\s*/g,' ≥ ');
 return s;
}
function convertOutsideMath(input:string){
 // Split around all supported math delimiters so already-valid TeX is never rewritten.
 const parts=input.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$(?:\\\\.|[^$])*\$)/g);
 return parts.map((part,i)=>/^(?:\\\[|\\\(|\$\$|\$)/.test(part)?part:legacyPlainText(part)).join('');
}
function escapeHtml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
export default function MathText({text,size=16,color}:{text:string;size?:number;color?:string}){
 const {c}=useTheme();
 const [height,setHeight]=useState(42),[ready,setReady]=useState(false);
 const renderKey=String(text)+'|'+size+'|'+(color||'');
 const activeKey=useRef(renderKey);activeKey.current=renderKey;
 useEffect(()=>{setHeight(42);setReady(false);},[renderKey]);
 const html=useMemo(()=>{
  const content=escapeHtml(convertOutsideMath(text||'')).replace(/\n/g,'<br>');
  const safeColor=(color||c.text).replace(/[^#(),.%\w\s-]/g,'');
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>html,body{margin:0;padding:0;background:transparent;color:'+safeColor+';font-family:system-ui,-apple-system,Roboto,sans-serif;font-size:'+size+'px;line-height:1.5;overflow:hidden}#content{padding:1px 0;overflow-wrap:anywhere;word-break:normal}mjx-container{max-width:100%;}mjx-container[display="true"]{margin:.15em 0!important;text-align:center!important}</style><script>window.MathJax={tex:{inlineMath:[["$","$"],["\\\\(","\\\\)"]],displayMath:[["$$","$$"],["\\\\[","\\\\]"]],processEscapes:true},options:{skipHtmlTags:["script","noscript","style","textarea","pre","code"]},startup:{typeset:true}};</script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script></head><body><div id="content">'+content+'</div><script>(function(){const el=document.getElementById("content");let last=0;const send=()=>{if(!el||!window.ReactNativeWebView)return;const h=Math.ceil(Math.max(el.scrollHeight,el.getBoundingClientRect().height)+4);if(h!==last){last=h;window.ReactNativeWebView.postMessage(String(h));}};if(window.ResizeObserver)new ResizeObserver(send).observe(el);else new MutationObserver(send).observe(el,{subtree:true,childList:true,characterData:true});window.addEventListener("load",send);setTimeout(send,100);setTimeout(send,350);setTimeout(send,900);})();</script></body></html>';
 },[text,size,color,c.text]);
 return <View style={{height:Math.max(32,Math.min(height,900)),width:'100%'}}>
  <WebView key={renderKey} originWhitelist={['*']} source={{html}} javaScriptEnabled domStorageEnabled scrollEnabled={false} showsVerticalScrollIndicator={false} backgroundColor="transparent" style={{backgroundColor:'transparent'}} onMessage={e=>{if(activeKey.current!==renderKey)return;const n=Number(e.nativeEvent.data);if(Number.isFinite(n)&&n>0)setHeight(Math.max(32,Math.min(n,900)));setReady(true)}} onError={()=>setReady(true)} />
  {!ready?<View pointerEvents="none" style={{position:'absolute',right:3,top:3}}><ActivityIndicator size="small" color={c.muted}/></View>:null}
 </View>;
}
