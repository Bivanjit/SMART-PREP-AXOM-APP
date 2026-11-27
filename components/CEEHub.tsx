import React from 'react';
import CEEWebsiteView from './CEEWebsiteView';

export default function CEEHub({section}:{section:'intelligence'|'workspace'}){
 return <CEEWebsiteView path={section==='intelligence'?'/analytics':'/cee-tools'}/>;
}
