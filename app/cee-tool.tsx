import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import CEEWebsiteView from '../components/CEEWebsiteView';

export default function CEEToolScreen(){
 const {path}=useLocalSearchParams<{path?:string}>();
 return <CEEWebsiteView path={typeof path==='string'?path:'/analytics'}/>;
}
