import {SiderealTime,Rotation_EQD_ECT} from 'astronomy-engine';
export const houseSystems=['Whole Sign','Equal','Placidus','Koch'] as const;
export type HouseSystem=typeof houseSystems[number];
type Geometry={asc:number;utc:string;unknown:boolean;city:{lat:number;lon:number}};
const wrap=(x:number)=>((x%360)+360)%360,rad=Math.PI/180;
const cache=new WeakMap<object,Map<string,number[]>>();
export function houseSystemAvailable(chart:Geometry,system:string){return houseSystems.includes(system as HouseSystem)&&(!['Placidus','Koch'].includes(system)||Math.abs(chart.city.lat)<66.5);}
export function houseCusps(chart:Geometry,system:string):number[]{
 if(!houseSystems.includes(system as HouseSystem))throw new Error('Choose a supported house system.');
 if(chart.unknown)return [];
 if(!houseSystemAvailable(chart,system))throw new Error(system+' houses are unavailable near or beyond the polar circles. Choose Whole Sign or Equal.');
 const saved=cache.get(chart)?.get(system);if(saved)return saved;
 let cusps:number[];
 if(system==='Whole Sign'||system==='Equal'){const origin=system==='Whole Sign'?Math.floor(chart.asc/30)*30:chart.asc;cusps=Array.from({length:12},(_,i)=>wrap(origin+i*30));}
 else{
  const date=new Date(chart.utc),rotation=Rotation_EQD_ECT(date).rot;
  const eps=Math.atan2(rotation[2][1],rotation[2][2]);
  const theta=wrap(SiderealTime(date)*15+chart.city.lon),phi=chart.city.lat*rad;
  const mc=wrap(Math.atan2(Math.sin(theta*rad),Math.cos(theta*rad)*Math.cos(eps))/rad);
  const ascAt=(armc:number)=>wrap(Math.atan2(-Math.cos(armc*rad),Math.sin(armc*rad)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps))/rad+180);
  const semiArc=(lambda:number)=>Math.acos(-Math.tan(phi)*Math.tan(Math.asin(Math.sin(eps)*Math.sin(lambda*rad))))/rad;
  let h11:number,h12:number,h2:number,h3:number;
  if(system==='Koch'){
   const day=semiArc(mc);
   h11=ascAt(theta-2*day/3);h12=ascAt(theta-day/3);h2=ascAt(theta+day/3);h3=ascAt(theta+2*day/3);
  }else{
   const solve=(constant:number,fraction:number)=>{let low=0,high=180;for(let i=0;i<48;i++){const offset=(low+high)/2,lambda=mc+offset;let alpha=wrap(Math.atan2(Math.sin(lambda*rad)*Math.cos(eps),Math.cos(lambda*rad))/rad-theta);if(alpha>359.9999999)alpha=0;const delta=alpha-constant-fraction*semiArc(lambda);if(delta>0)high=offset;else low=offset;}return wrap(mc+(low+high)/2);};
   h11=solve(0,1/3);h12=solve(0,2/3);h2=solve(60,2/3);h3=solve(120,1/3);
  }
  cusps=[chart.asc,h2,h3,wrap(mc+180),wrap(h11+180),wrap(h12+180),wrap(chart.asc+180),wrap(h2+180),wrap(h3+180),mc,h11,h12];
  if(cusps.some(x=>!Number.isFinite(x)))throw new Error(system+' house cusps could not converge for this location. Choose Whole Sign or Equal.');
 }
 const bySystem=cache.get(chart)||new Map();bySystem.set(system,cusps);cache.set(chart,bySystem);return cusps;
}
export function calculatedHouse(lon:number,chart:Geometry,system:string){const cusps=houseCusps(chart,system);if(!cusps.length)throw new Error('House placement needs a known birth time.');for(let i=0;i<12;i++){const width=wrap(cusps[(i+1)%12]-cusps[i]);if(wrap(lon-cusps[i])<width-1e-9||wrap(lon-cusps[i])<1e-9)return i+1;}throw new Error('Could not assign the selected house.');}
