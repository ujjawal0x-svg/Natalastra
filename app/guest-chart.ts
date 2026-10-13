import {birthSchema,type BirthData} from '../lib/profile';
const deviceKey='natalastra:guest-chart:v2',tabKey='natalastra:guest-chart:v1';
const tabLifetime=12*60*60*1000;
function remove(storage:'localStorage'|'sessionStorage',key:string){try{window[storage].removeItem(key);}catch{}}
/** Only an explicit Save action may create a persistent device copy. */
export function forgetGuestTab(){remove('sessionStorage',tabKey);}
export function forgetGuestChart(){remove('localStorage',deviceKey);forgetGuestTab();}
export function guestChartMode(now=Date.now()):'device'|'tab'|null{
 return readStored('localStorage',deviceKey,now)?'device':readStored('sessionStorage',tabKey,now)?'tab':null;
}
function readStored(storage:'localStorage'|'sessionStorage',key:string,now:number):BirthData|null{
 try{const raw=window[storage].getItem(key);if(!raw)return null;const value=JSON.parse(raw);
 if(storage==='localStorage'){if(value.version!==2)throw Error();}
 else if(value.version!==1||!Number.isFinite(value.expiresAt)||value.expiresAt<=now||value.expiresAt>now+tabLifetime)throw Error();
 return birthSchema.parse(value.birth);
 }catch{remove(storage,key);return null;}
}
export function readGuestChart(now=Date.now()):BirthData|null{return readStored('localStorage',deviceKey,now)||readStored('sessionStorage',tabKey,now);}
function write(storage:'localStorage'|'sessionStorage',key:string,value:string){try{window[storage].setItem(key,value);if(window[storage].getItem(key)!==value)throw Error();}catch{throw Error('This browser cannot save your chart. Choose “Continue without saving” or enable browser storage.');}}
export function saveGuestChart(birth:BirthData){write('localStorage',deviceKey,JSON.stringify({version:2,birth:birthSchema.parse(birth)}));remove('sessionStorage',tabKey);}
/** Existing tab consent stays limited to a tab; it is never silently upgraded. */
export function updateGuestChart(birth:BirthData){const mode=guestChartMode();if(!mode)return false;
 if(mode==='device')saveGuestChart(birth);else write('sessionStorage',tabKey,JSON.stringify({version:1,expiresAt:Date.now()+tabLifetime,birth:birthSchema.parse(birth)}));return true;
}
