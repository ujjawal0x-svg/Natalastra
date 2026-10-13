import {mod,degree,placement} from './astro';
import type {Chart,Lang} from './insights';
export const QUINCUNX_ORB=2;
const outer=new Set(['Uranus','Neptune','Pluto']);
const themes:Record<string,[string,string]>={Sun:['direction and expression','दिशा और अभिव्यक्ति'],Moon:['care and emotional restoration','देखभाल और भावनात्मक आराम'],Mercury:['attention and communication','ध्यान और संवाद'],Venus:['values and connection','पसंद और जुड़ाव'],Mars:['initiative and boundaries','पहल और सीमाएँ'],Jupiter:['meaning and possibility','अर्थ और संभावनाएँ'],Saturn:['commitment and limits','प्रतिबद्धता और सीमाएँ'],Uranus:['independence and experimentation','स्वतंत्रता और नए प्रयोग'],Neptune:['imagination and discernment','कल्पना और विवेक'],Pluto:['power and change','शक्ति और बदलाव'],Chiron:['vulnerability and care','संवेदनशीलता और देखभाल'],'True Node':['a direction to explore','खोज की एक दिशा']};
export type Quincunx={id:string;a:string;b:string;distance:number;orb:number;sameElement:boolean;sameModality:boolean;generational:boolean};
export function findQuincunxes(points:{name:string;lon:number}[],unknown=false):Quincunx[]{
 const usable=points.filter(p=>themes[p.name]&&Number.isFinite(p.lon)&&(!unknown||p.name!=='Moon'));
 const result:Quincunx[]=[];
 for(let i=0;i<usable.length;i++)for(let j=i+1;j<usable.length;j++){
  const p=usable[i],q=usable[j];if(p.name===q.name)continue;
  const delta=Math.abs(mod(p.lon)-mod(q.lon)),distance=Math.min(delta,360-delta),orb=Math.abs(distance-150);
  if(orb>QUINCUNX_ORB+1e-9)continue;
  const ps=Math.floor(mod(p.lon)/30),qs=Math.floor(mod(q.lon)/30);
  result.push({id:[p.name,q.name].sort().join('|'),a:p.name,b:q.name,distance,orb,sameElement:ps%4===qs%4,sameModality:ps%3===qs%3,generational:outer.has(p.name)&&outer.has(q.name)});
 }
 return result.sort((a,b)=>a.orb-b.orb||a.id.localeCompare(b.id));
}
export function quincunxReading(chart:Chart,hit:Quincunx,lang:Lang='en'){
 const hi=lang==='hi',pair=[hit.a,hit.b].map(name=>chart.planets.find(p=>p.name===name)!);
 const sections=pair.map(p=>({planet:p.name,glyph:p.glyph,placement:placement(p.lon),body:themes[p.name][hi?1:0],basis:`${p.name} · ${placement(p.lon)} ${degree(p.lon)}`,house:null,houseTopic:null}));
 const geometry=`${hit.a} quincunx ${hit.b} · separation ${hit.distance.toFixed(3)}° · orb ${hit.orb.toFixed(3)}° · cap ${QUINCUNX_ORB}°`;
 return {title:hi?'दो विषय, जगह बनाने का एक तरीका।':'Two themes, room to adjust.',intro:hi?'इन दोनों विषयों को अपने अनुभव से जाँचें।':'Check how these two themes fit your experience.',sections,bridge:hi?`${sections[0].body} और ${sections[1].body} को साथ रखने का प्रतीकात्मक नज़रिया। यह आंतरिक संघर्ष साबित नहीं करता।`:`A symbolic lens for making room for ${sections[0].body} alongside ${sections[1].body}. This does not establish an internal conflict.`,aspectNotes:[{basis:geometry,body:hit.generational?'Both are slow outer planets; this geometry is shared by many people and needs individual lived context.':'The quincunx is interpreted as an adjustment lens; it does not measure a psychological blindspot.'}],question:hi?'इन दो ज़रूरतों को जगह देने के लिए क्या छोटा बदलाव मदद करेगा?':'What small adjustment would make room for both needs?',action:hi?'मन हो तो हर विषय के लिए एक छोटी ज़रूरत लिखें।':'If useful, name one small need for each theme.',basis:[...sections.map(s=>s.basis),geometry],uncertainty:chart.unknown?(hi?'जन्म समय अज्ञात: स्थानीय दोपहर का संदर्भ है; Moon, Rising और houses शामिल नहीं हैं।':'Birth time unknown: local-noon reference; Moon, rising and houses are omitted.'):null,method:hi?'150° से 2° तक चुना गया natal aspect। यह Natalastra का orb नियम है, psychological measurement नहीं।':'Natal separation within 2° of 150°. This is Natalastra’s orb policy, not a psychological measurement.'};
}
