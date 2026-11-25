import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import type {SupabaseClient} from '@supabase/supabase-js';

function uuid():string{
 return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
  const r=Math.floor(Math.random()*16);
  return (c==='x'?r:(r&0x3|0x8)).toString(16);
 });
}

export async function ensurePaidDeviceBinding(client:SupabaseClient,userId:string):Promise<boolean>{
 const deviceKey='smartprep:paid-device:'+userId;
 const sessionKey='smartprep:paid-session:'+userId;
 let deviceId=await AsyncStorage.getItem(deviceKey);
 let sessionId=await AsyncStorage.getItem(sessionKey);
 if(!deviceId){deviceId='smartprep-'+uuid()+'-'+uuid();await AsyncStorage.setItem(deviceKey,deviceId);}
 if(!sessionId){sessionId=uuid();await AsyncStorage.setItem(sessionKey,sessionId);}
 const {data,error}=await client.rpc('claim_paid_device',{
  p_user_id:userId,
  p_device_id:deviceId,
  p_platform:Platform.OS,
  p_session_id:sessionId
 });
 if(error)throw error;
 if(data!==true)return false;
 const {data:refreshed,error:refreshError}=await client.auth.refreshSession();
 if(refreshError)throw refreshError;
 return Boolean(refreshed.session);
}
