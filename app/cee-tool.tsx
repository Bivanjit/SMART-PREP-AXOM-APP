import React,{useCallback,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,BackHandler,Linking,Pressable,Text,View} from 'react-native';
import {Stack,useFocusEffect,useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {WebView} from 'react-native-webview';
import {useTheme} from './_layout';
import {CEE_ALL_TOOLS,CEE_WEB_ORIGIN} from '../lib/cee-tools';
export default function CEEToolScreen(){
 const params=useLocalSearchParams<{path?:string;title?:string}>();
 const routePath=typeof params.path==='string'?params.path:'';
 const selected=CEE_ALL_TOOLS.find(item=>item.path===routePath)||CEE_ALL_TOOLS[0];
 const {c,mode}=useTheme();const webRef=useRef<WebView>(null);
 const [loading,setLoading]=useState(true),[loadError,setLoadError]=useState(false),[canGoBack,setCanGoBack]=useState(false),[reloadKey,setReloadKey]=useState(0);
 const uri=CEE_WEB_ORIGIN+selected.path;
 const injectedTheme=useMemo(()=>{
  const dark=mode==='dark';
  const theme=dark?'dark':'light';
  const themeColor=dark?'#0B1220':'#F6F8FA';
  const css=`
   :root{--navy:${dark?'#F8FAFC':'#172033'};--blue:${dark?'#93C5FD':'#1E3A8A'};--muted:${dark?'#94A3B8':'#475569'};--line:${dark?'#2A3A50':'#E2E8F0'};--pale:${dark?'#1B2A3D':'#F1F5F9'};color-scheme:${dark?'dark':'light'};}
   html,body,#root{min-width:0!important;min-height:100%!important;background:${c.bg}!important;color:${c.text}!important}body{margin:0!important}
   .header,.footer,.theme-toggle{display:none!important}
   .container,.nav-wrap{width:100%!important;max-width:none!important;margin-left:0!important;margin-right:0!important;padding-left:16px!important;padding-right:16px!important}
   .route-enter{padding:0!important}
   .cx-page,.cea-page,.outlook-page,.intelligence-page,.intelligence-v2-page,.seo-hub-page{max-width:none!important;padding:16px!important;background:transparent!important;color:${c.text}!important}
   .cx-head,.outlook-head{padding-top:6px!important}main{min-height:100vh}
  `;
  return `(function(){
   try{localStorage.setItem('smartprep-theme',${JSON.stringify(theme)});}catch(e){}
   var apply=function(){
    if(!document.head)return;
    document.documentElement.dataset.theme=${JSON.stringify(theme)};
    var old=document.getElementById('smartprep-native-theme');if(old)old.remove();
    var style=document.createElement('style');style.id='smartprep-native-theme';
    style.textContent=${JSON.stringify(css)};document.head.appendChild(style);
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',${JSON.stringify(themeColor)});
   };
   apply();document.addEventListener('DOMContentLoaded',apply,{once:true});
  })();true;`;
 },[c.bg,c.blue,c.border,c.text,mode]);
 useFocusEffect(useCallback(()=>{const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{if(canGoBack){webRef.current?.goBack();return true}return false});return()=>subscription.remove()},[canGoBack]));
 const handleNavigation=(request:{url:string})=>{const url=request.url;if(url==='about:blank'||url===CEE_WEB_ORIGIN||url.startsWith(CEE_WEB_ORIGIN+'/'))return true;void Linking.openURL(url).catch(()=>undefined);return false};
 return <View style={{flex:1,backgroundColor:c.bg}}>
  <Stack.Screen options={{title:selected.title}}/>
  <WebView key={reloadKey} ref={webRef} source={{uri}} style={{flex:1,backgroundColor:c.bg}} originWhitelist={['https://*','about:*']} javaScriptEnabled domStorageEnabled sharedCookiesEnabled thirdPartyCookiesEnabled setSupportMultipleWindows={false} startInLoadingState={false} injectedJavaScriptBeforeContentLoaded={injectedTheme} injectedJavaScript={injectedTheme}
   onLoadStart={()=>{setLoading(true);setLoadError(false)}} onLoadEnd={()=>setLoading(false)} onError={()=>{setLoading(false);setLoadError(true)}} onHttpError={event=>{if(event.nativeEvent.statusCode>=400){setLoading(false);setLoadError(true)}}}
   onNavigationStateChange={state=>setCanGoBack(state.canGoBack)} onShouldStartLoadWithRequest={handleNavigation} allowsBackForwardNavigationGestures pullToRefreshEnabled/>
  {loading&&<View pointerEvents="none" style={{position:'absolute',left:0,right:0,top:0,bottom:0,alignItems:'center',justifyContent:'center',backgroundColor:c.bg}}><ActivityIndicator size="large" color={c.green}/><Text style={{color:c.textSecondary,fontSize:12,fontWeight:'700',marginTop:12}}>Loading {selected.title}…</Text></View>}
  {loadError&&!loading&&<View style={{position:'absolute',left:20,right:20,top:24,padding:18,borderRadius:18,backgroundColor:c.card,borderWidth:1,borderColor:c.border,gap:10}}>
   <Ionicons name="cloud-offline-outline" size={26} color={c.red}/><Text style={{color:c.text,fontWeight:'900',fontSize:15}}>Couldn't load this CEE tool</Text>
   <Text style={{color:c.textSecondary,fontSize:12,lineHeight:18}}>Check your internet connection and try again. Your existing app data is not affected.</Text>
   <Pressable onPress={()=>{setLoadError(false);setLoading(true);setReloadKey(value=>value+1)}} style={{alignSelf:'flex-start',paddingHorizontal:16,paddingVertical:10,borderRadius:12,backgroundColor:c.green}}><Text style={{color:'#FFFFFF',fontWeight:'900',fontSize:12}}>Try again</Text></Pressable>
  </View>}
 </View>;
}
