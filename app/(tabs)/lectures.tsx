import React,{useEffect,useState} from 'react';
import {ScrollView,View,Text,Pressable,ActivityIndicator,Alert} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {supabase} from '../../lib/supabase';
import {useTheme} from '../_layout';
import {claimPaidDevice} from '../../lib/device';
import {Heading,Copy,Panel,Button} from '../../components/ui';
type Lecture={id:string;subject:string;title:string;description:string|null;video_url:string;lecture_order:number;is_published:boolean};
const subjects=['Physics','Chemistry','Mathematics'];
export default function Lectures(){const {c,userEmail}=useTheme();const [subject,setSubject]=useState('Physics');const [rows,setRows]=useState<Lecture[]>([]);const [hasMembership,setHasMembership]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{let live=true;void(async()=>{if(!supabase){setError('Backend is not configured.');setLoading(false);return;}try{const {data:{user}}=await supabase.auth.getUser();let member=false;if(user){const {data:membership}=await supabase.from('memberships').select('id').eq('user_id',user.id).eq('product_code','cee_complete').eq('status','active').lte('starts_at',new Date().toISOString()).gt('expires_at',new Date().toISOString()).limit(1).maybeSingle();member=Boolean(membership);if(member){try{await claimPaidDevice()}catch(e){member=false;if(live)setError(e instanceof Error?e.message:'Could not verify this paid device.')}}}if(live)setHasMembership(member);const {data,error}=await supabase.from('lectures').select('id,subject,title,description,video_url,lecture_order,is_published').eq('is_published',true).order('lecture_order');if(error)throw error;if(live)setRows((data||[]) as Lecture[]);}catch(e){if(live)setError(e instanceof Error?e.message:'Unable to load lectures.')}finally{if(live)setLoading(false)}})();return()=>{live=false}},[userEmail]);}