import {Body,GeoVector,Ecliptic} from 'astronomy-engine';
import {calculate,mod} from './astro';
import {chironLongitude} from './chiron';
import type {BirthData} from './profile';
export const transitBodies=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Chiron'] as const;
export const slowTransitBodies=['Jupiter','Saturn','Uranus','Neptune','Pluto','Chiron'] as const;
export type TransitBody=typeof transitBodies[number];
export type TransitEvent={body:string;natal:string;aspect:string;angle:number;exactUtc:string;entryUtc:string|null;exitUtc:string|null;retrograde:boolean;pass:number;passes:number;orbDegrees:number};
const day=86400000,step=day/4,signed=(x:number)=>mod(x+180)-180;
export function bodyLongitude(body:TransitBody,date:Date){return body==='Chiron'?chironLongitude(date):Ecliptic(GeoVector(body as Body,date,true)).elon;}
export function buildTransitTimeline(birth:BirthData,startIso:string,bodies:readonly TransitBody[]=slowTransitBodies){
 const start=Date.parse(startIso);if(!Number.isFinite(start)||startIso.slice(0,10)!==new Date(start).toISOString().slice(0,10))throw new Error('Choose a valid transit start date.');
 if(new Date(start).getUTCFullYear()<1900||new Date(start).getUTCFullYear()>2099)throw new Error('Transit start dates support 1900–2099.');
 if(!bodies.length||bodies.length>11||bodies.some(b=>!transitBodies.includes(b)))throw new Error('Choose supported transit bodies.');
 const endDate=new Date(start);endDate.setUTCFullYear(endDate.getUTCFullYear()+1);const end=endDate.getTime();
 const chart=calculate(birth.date,birth.time,birth.location||birth.city,birth.unknown,birth.fold);
 const natal=chart.planets.filter(p=>['Sun','Mercury','Venus','Mars','Chiron'].includes(p.name)||(!chart.unknown&&p.name==='Moon'));
 if(!chart.unknown)natal.push({name:'Rising',glyph:'↑',lon:chart.asc});
 const events:TransitEvent[]=[];
 const root=(a:number,b:number,fn:(t:number)=>number)=>{let va=fn(a);for(let i=0;i<32&&b-a>60000;i++){const mid=(a+b)/2,v=fn(mid);if(va*v<=0)b=mid;else{a=mid;va=v;}}return (a+b)/2;};
 for(const body of [...new Set(bodies)]){
  const cache=new Map<number,number>();const lon=(t:number)=>{const key=Math.round(t),v=cache.get(key);if(v!==undefined)return v;const result=bodyLongitude(body,new Date(key));cache.set(key,result);return result;};
  const velocity=(t:number)=>signed(lon(t+day*.02)-lon(t-day*.02));
  const times:number[]=[];for(let t=start;t<=end+step;t+=step)times.push(Math.min(t,end));
  // Split intervals at stations, so close retrograde repeat crossings are not lost.
  const stations:number[]=[];for(let i=0;i<times.length-1;i++)if(velocity(times[i])*velocity(times[i+1])<0)stations.push(root(times[i],times[i+1],velocity));
  const knots=[...new Set([...times,...stations])].sort((a,b)=>a-b);
  for(const target of natal)for(const [angle,aspect] of [[0,'Conjunction'],[60,'Sextile'],[90,'Square'],[120,'Trine'],[180,'Opposition']] as const)for(const direction of angle===0||angle===180?[1]:[1,-1]){
   const goal=mod(target.lon+direction*angle),diff=(t:number)=>signed(lon(t)-goal);let previousExact=-Infinity;
   for(let i=0;i<knots.length-1;i++){
    const a=knots[i],b=knots[i+1],va=diff(a),vb=diff(b);
    if(va*vb>0||Math.abs(va-vb)>180)continue;
    const exact=root(a,b,diff);if(exact<start||exact>=end||exact-previousExact<120000)continue;previousExact=exact;
    const edge=(direction:number)=>{let inside=exact;for(let j=1;j<=360;j++){const outside=exact+direction*j*step;if(new Date(outside).getUTCFullYear()<1900||new Date(outside).getUTCFullYear()>2101)return null;if(Math.abs(diff(outside))>1)return new Date(root(Math.min(inside,outside),Math.max(inside,outside),t=>Math.abs(diff(t))-1)).toISOString();inside=outside;}return null;};
    events.push({body,natal:target.name,aspect,angle,exactUtc:new Date(exact).toISOString(),entryUtc:edge(-1),exitUtc:edge(1),retrograde:velocity(exact)<0,pass:1,passes:1,orbDegrees:Math.abs(diff(exact))});
   }
  }
 }
 events.sort((a,b)=>a.exactUtc.localeCompare(b.exactUtc));const groups=new Map<string,TransitEvent[]>();for(const e of events){const key=e.body+'/'+e.natal+'/'+e.aspect;const group=groups.get(key)||[];group.push(e);groups.set(key,group);}for(const group of groups.values())group.forEach((e,i)=>{e.pass=i+1;e.passes=group.length;});
 return {startUtc:new Date(start).toISOString(),endUtc:endDate.toISOString(),bodies:[...bodies],natalTargets:natal.map(p=>p.name),orb:1,resolutionSeconds:60,events,method:'6-hour scanning, station splitting and bracketed root refinement to one-minute numerical resolution. Positions have ephemeris/model uncertainty; this is not one-minute absolute accuracy.',coverage:'Major aspect contacts to natal Sun, Moon (known time only), Mercury, Venus, Mars, Chiron and Rising (known time only). Ingresses, eclipses and node transits are not included. Null window edges mean no 1-degree boundary was found within 90 days.'};
}
export type TransitTimeline=ReturnType<typeof buildTransitTimeline>;
