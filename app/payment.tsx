import React,{useEffect,useState} from 'react';
import {Alert,Image,ScrollView,TextInput,View,Text,ActivityIndicator,Pressable} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {imageAssetToBytes} from '../lib/imageUpload';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../lib/supabase';
import {useTheme} from './_layout';
import {Heading,Copy,Panel,Button} from '../components/ui';
export default function Payment(){
 const params=useLocalSearchParams<{product?:string}>();const {c,userEmail}=useTheme();const [settings,setSettings]=useState<any>(null);const [plans,setPlans]=useState<Record<string,any>>({});const [loading,setLoading]=useState(true);const [product,setProduct]=useState<'chapter_practice'|'cee_complete'>(params.product==='chapter_practice'?'chapter_practice':'cee_complete');const [utr,setUtr]=useState('');const [txn,setTxn]=useState('');const [payerName,setPayerName]=useState('');const [proof,setProof]=useState<ImagePicker.ImagePickerAsset|null>(null);const [busy,setBusy]=useState(false);
 useEffect(()=>{let live=true;void(async()=>{try{if(!supabase)return;const {data,error}=await supabase.from('payment_settings').select('*').eq('id',true).maybeSingle();if(error)throw error;if(live)setSettings(data||null)}catch(e){if(live)Alert.alert('Payment settings unavailable',e instanceof Error?e.message:'Please try again later.')}finally{if(live)setLoading(false)}})();return()=>{live=false}},[]);
 const field={borderWidth:1,borderColor:c.border,color:c.text,backgroundColor:c.bg,borderRadius:12,padding:14,fontSize:15};
 async function chooseProof(){const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,quality:.85,base64:true});if(!result.canceled&&result.assets[0])setProof(result.assets[0]);}
 async function submit(){
  if(!supabase){Alert.alert('Unavailable','Payment service is not configured.');return;}
  const {data:{user}}=await supabase.auth.getUser();if(!user){Alert.alert('Sign in required','Sign in before submitting payment.');router.push('/auth');return;}
  if(!utr.trim()||!txn.trim()||!payerName.trim()||!proof){Alert.alert('Missing details','Enter the payer bank-account name, UTR, transaction ID and select a screenshot/photo of your payment.');return;}
  if(!/^\d{8,24}$/.test(utr.trim())){Alert.alert('Check UTR','Enter the bank/UPI reference using 8–24 digits.');return;}
  if(proof.fileSize&&proof.fileSize>8*1024*1024){Alert.alert('Image too large','Choose an image smaller than 8 MB.');return;}const mime=proof.mimeType||'image/jpeg';if(!['image/jpeg','image/png','image/webp'].includes(mime)){Alert.alert('Unsupported image','Choose a JPG, PNG or WebP image.');return;}
  setBusy(true);
  try{
   const ext=(proof.fileName?.split('.').pop()||proof.mimeType?.split('/').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
   const path=user.id+'/'+Date.now()+'-payment-proof.'+ext;
   const bytes=imageAssetToBytes(proof);
   const {error:uploadError}=await supabase.storage.from('payment-proofs').upload(path,bytes,{contentType:mime,upsert:false});
   if(uploadError)throw uploadError;
   const amount=Number(plans[product]?.price_inr??(product==='cee_complete'?999:149));
   const {error}=await supabase.from('payment_submissions').insert({user_id:user.id,product_code:product,amount_inr:amount,payment_reference:txn.trim(),transaction_id:txn.trim(),utr_number:utr.trim(),payer_name:payerName.trim(),proof_path:path,proof_expires_at:new Date(Date.now()+12*60*60*1000).toISOString(),status:'pending'});
   if(error){await supabase.storage.from('payment-proofs').remove([path]);throw error;}
   Alert.alert('Submitted for review','Your proof was securely uploaded. Membership activates only after admin approval.');
   router.back();
  }catch(e){Alert.alert('Submission failed',e instanceof Error?e.message:'Please check your connection and try again.')}
  finally{setBusy(false)}
 }
 const qrPath=product==='cee_complete'?(settings?.cee_qr_path||settings?.qr_path):(settings?.chapter_qr_path||settings?.qr_path);const qr=qrPath&&supabase?supabase.storage.from('payment-qr').getPublicUrl(qrPath).data.publicUrl:null;
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={{padding:18,paddingTop:18,gap:15,paddingBottom:40}}><View style={{backgroundColor:'#14261D',borderRadius:21,padding:19,gap:9}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Ionicons name="ribbon-outline" size={18} color="#FBBF24"/><Text style={{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:'#D9E8DD'}}>SMARTPREP AXOM MEMBERSHIP</Text></View><Text style={{fontSize:23,fontWeight:'900',letterSpacing:-.5,color:'#FFFFFF'}}>Make every study session count.</Text><Text style={{fontSize:12,lineHeight:19,color:'#D9E8DD'}}>Choose the learning access that matches your preparation. Membership activates only after secure admin verification.</Text></View><Heading>Choose your learning plan</Heading><Copy>Manual payment verification. Your membership starts only after admin approval.</Copy>
 <View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Button title={product==='cee_complete'?'✓ Complete · ₹999':'Complete · ₹999'} onPress={()=>setProduct('cee_complete')}/></View><View style={{flex:1}}><Button title={product==='chapter_practice'?'✓ Practice · ₹149':'Practice · ₹149'} onPress={()=>setProduct('chapter_practice')}/></View></View>
 <Panel><Heading>{plans[product]?.title||(product==='cee_complete'?'CEE 2027 Complete':'Chapter Practice')}</Heading><Heading>₹{Number(plans[product]?.price_inr??(product==='cee_complete'?999:149)).toLocaleString('en-IN')}</Heading>{plans[product]?.compare_at_price_inr?<Copy>₹{Number(plans[product].compare_at_price_inr).toLocaleString('en-IN')} · {Math.round((1-Number(plans[product].price_inr)/Number(plans[product].compare_at_price_inr))*100)}% OFF · {plans[product].duration_days} days</Copy>:null}{loading?<ActivityIndicator color={c.blue}/>:qr?<Image source={{uri:qr}} style={{width:250,height:250,alignSelf:'center',resizeMode:'contain',backgroundColor:'white',borderRadius:12}}/>:<Copy>Payment QR is not configured for this plan yet. Contact support before paying.</Copy>}{settings?.upi_id?<Copy>UPI ID: {settings.upi_id}</Copy>:null}{settings?.payee_name?<Copy>Payee: {settings.payee_name}</Copy>:null}</Panel>
 <Panel><Heading>Submit payment proof</Heading><Copy>Choose the payment screenshot directly from your gallery. The proof image is retained for 12 hours; payment details remain in your history. Never share your UPI PIN or OTP.</Copy><TextInput style={field} value={payerName} onChangeText={setPayerName} placeholder="Payer name (name on bank account)" placeholderTextColor={c.muted}/><TextInput style={field} value={utr} onChangeText={setUtr} keyboardType="number-pad" placeholder="UTR / bank reference number" placeholderTextColor={c.muted}/><TextInput style={field} value={txn} onChangeText={setTxn} placeholder="Transaction ID" placeholderTextColor={c.muted}/><Pressable onPress={()=>void chooseProof()} style={{borderWidth:1.5,borderStyle:'dashed',borderColor:c.blue,borderRadius:14,padding:16,alignItems:'center',gap:9,backgroundColor:c.soft}}><Ionicons name="cloud-upload-outline" size={28} color={c.blue}/><Text style={{fontWeight:'800',color:c.blue}}>{proof?'Change payment screenshot':'Choose image from gallery'}</Text><Text style={{fontSize:11,color:c.muted}}>JPG, PNG or WebP · maximum 8 MB</Text></Pressable>{proof?<View style={{gap:8}}><Image source={{uri:proof.uri}} style={{width:'100%',height:190,borderRadius:12,resizeMode:'contain',backgroundColor:c.bg}}/><Pressable onPress={()=>setProof(null)}><Text style={{color:c.red,fontWeight:'800',textAlign:'center'}}>Remove selected image</Text></Pressable></View>:null}<Button title={busy?'Uploading & submitting…':'Submit for manual verification'} onPress={()=>void submit()}/></Panel>
 <Panel><Copy>Signed in as</Copy><Text style={{color:c.blue,fontWeight:'700'}}>{userEmail||'Not signed in'}</Text><Button title="Back" onPress={()=>router.back()}/></Panel></ScrollView>
}
