import type {BirthData} from '../lib/profile';
import {apiFetch} from './browser-session';
import {saveGuestChart} from './guest-chart';
/** Open exactly the record just saved; avoid restoring a different latest profile. */
export function savedChartUrl(id?:string){
 if(id&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw Error('Your saved chart could not be identified. Please retry.');
 return id?'/chart?profile='+encodeURIComponent(id):'/chart';
}
export async function persistChart(birth:BirthData,options:{guest:boolean;newChart:boolean;profileId?:string}){
 if(options.guest){saveGuestChart(birth);return savedChartUrl();}
 const r=await apiFetch('/api/vault',{method:'POST',headers:{'Content-Type':'application/json','X-Natalastra-Request':'1'},body:JSON.stringify({action:'save-profile',id:options.newChart?undefined:options.profileId,birth})});
 const result=await r.json() as {id?:string;error?:string};
 if(!r.ok||!result.id)throw Error(result.error||'Could not save your changes. Please retry.');
 return savedChartUrl(result.id);
}
