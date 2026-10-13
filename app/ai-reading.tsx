'use client';
import {useEffect,useRef,useState} from 'react';
import {Sparkles} from 'lucide-react';
import {apiFetch} from './browser-session';
import type {BirthData} from '../lib/profile';
import type {Lang} from '../lib/insights';
import type {ReadingFocus} from '../lib/guided-reading';
import type {AiReading} from '../lib/groq-reading';
export function AIReading({birth,focus,system,lang}:{birth:BirthData;focus:ReadingFocus;system:string;lang:Lang}){
 const hi=lang==='hi',t=(en:string,hn:string)=>hi?hn:en;
 const id=JSON.stringify([birth.date,birth.time,birth.location||birth.city,birth.unknown,birth.fold,focus,system,lang]);
 const [available,setAvailable]=useState<boolean|null>(null),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<{id:string;reading:AiReading}|null>(null);
 const controller=useRef<AbortController|null>(null),current=useRef(id);current.current=id;
 useEffect(()=>{let cancelled=false;apiFetch('/api/ai/reading',{cache:'no-store'}).then(r=>r.json() as Promise<{available?:boolean}>).then(d=>{if(!cancelled)setAvailable(d.available===true);}).catch(()=>{if(!cancelled)setAvailable(false);});return()=>{cancelled=true;};},[]);
 useEffect(()=>{controller.current?.abort();setBusy(false);setError('');setResult(null);setConsent(false);return()=>controller.current?.abort();},[id]);
 async function generate(){if(busy||!consent)return;const requestId=id,abort=new AbortController();controller.current=abort;setBusy(true);setError('');try{
  const response=await apiFetch('/api/ai/reading',{method:'POST',signal:abort.signal,headers:{'Content-Type':'application/json','X-Natalastra-Request':'1'},body:JSON.stringify({consent:true,birth:{...birth,name:'Chart',...(birth.location?{location:{...birth.location,name:'Birth place'}}:{})},focus,system,lang})});
  const data=await response.json() as {error?:string;reading?:AiReading};if(!response.ok||!data.reading)throw new Error(data.error||'AI reading is unavailable.');if(!abort.signal.aborted&&current.current===requestId)setResult({id:requestId,reading:data.reading});
 }catch(e){if(!abort.signal.aborted&&current.current===requestId)setError(e instanceof Error?e.message:'AI reading is unavailable.');}finally{if(controller.current===abort&&current.current===requestId)setBusy(false);}}
 const reading=result?.id===id?result.reading:null;
 return <details className="guided-ai"><summary><Sparkles size={15}/>{t('Explore an AI reading','AI रीडिंग देखें')}<span>{t('Optional','वैकल्पिक')}</span></summary>
 <p>{t('Groq receives the calculated placements and aspects for this focus. Your name, email, birth date, city and journal are not sent to Groq. AI text may be inaccurate; compare it with your chart and your experience.','Groq को इस विषय के गणना किए placements और aspects भेजे जाते हैं। नाम, ईमेल, जन्म तारीख, शहर और जर्नल Groq को नहीं भेजे जाते। AI गलत हो सकता है; अपने चार्ट और अनुभव से मिलान करें।')}</p>
 {available===false?<p role="status">{t('AI is not configured on this server yet. Your original reading above is available.','इस सर्वर पर AI अभी configured नहीं है। ऊपर की मूल रीडिंग उपलब्ध है।')}</p>:<><label><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/>{t('I agree to send these chart placements to Groq for this reading.','इस रीडिंग के लिए अपने chart placements Groq को भेजने की सहमति देता/देती हूँ।')}</label><button type="button" disabled={available===null||busy||!consent||!!reading} onClick={generate}>{busy?t('Writing your reading…','रीडिंग तैयार हो रही है…'):reading?t('Reading ready','रीडिंग तैयार है'):t('Create AI reading','AI रीडिंग बनाएँ')}</button></>}
 {error&&<p role="alert">{error} {t('The original reading remains above.','मूल रीडिंग ऊपर उपलब्ध है।')}</p>}
 {reading&&<article aria-live="polite"><span className="eyebrow">{t('AI ASSISTED · GROQ','AI की मदद से · GROQ')}</span><h3>{reading.title}</h3><p>{reading.body}</p><strong>{reading.question}</strong><details><summary>{t('Optional experiment','वैकल्पिक प्रयोग')}</summary><p>{reading.experiment}</p></details><small>{t('Uses the chart evidence shown in “Why this reading?” above. No AI reading is saved to your archive.','ऊपर “यह रीडिंग क्यों?” में दिखे chart evidence पर आधारित। AI रीडिंग archive में सेव नहीं होती।')}</small></article>}
 </details>;
}
