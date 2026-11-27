import React from 'react';
import {ActivityIndicator,View} from 'react-native';
import {WebView} from 'react-native-webview';
import {useTheme} from '../app/_layout';

const WEBSITE_ORIGIN='https://smartprep-axom.pages.dev';

export default function CEEWebsiteView({path}:{path:string}){
 const {c}=useTheme();
 const cleanPath=path.startsWith('/')?path:`/${path}`;
 return <View style={{flex:1,backgroundColor:c.bg}}>
  <WebView
   source={{uri:`${WEBSITE_ORIGIN}${cleanPath}`}}
   style={{flex:1,backgroundColor:c.bg}}
   javaScriptEnabled
   domStorageEnabled
   sharedCookiesEnabled
   thirdPartyCookiesEnabled
   setSupportMultipleWindows={false}
   originWhitelist={['https://*']}
   startInLoadingState
   renderLoading={()=><View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:c.bg}}><ActivityIndicator size="large" color={c.blue}/></View>}
  />
 </View>;
}
