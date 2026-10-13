'use client';
import {useState} from 'react';
import {BookOpen,Sparkles,Compass} from 'lucide-react';
import {GuidedReading} from './guided-reading';
import {AIReading} from './ai-reading';
import {QuincunxExplorer} from './quincunx-explorer';
import type {ReadingFocus} from '../lib/guided-reading';
import type {BirthData} from '../lib/profile';
import type {Chart,Lang} from '../lib/insights';
export function InsightsHub({birth,chart,system,lang,onChart}:{birth:BirthData;chart:Chart;system:string;lang:Lang;onChart:(planet:string)=>void}){
 const [tab,setTab]=useState<'reading'|'patterns'|'blindspots'>('reading');
 const [focus,setFocus]=useState<ReadingFocus>('self');
 const hi=lang==='hi',t=(en:string,hn:string)=>hi?hn:en;
 const tabs=[{id:'reading' as const,label:t('Personal Reading','व्यक्तिगत रीडिंग'),Icon:BookOpen},{id:'patterns' as const,label:'Pattern Mirror',Icon:Sparkles},{id:'blindspots' as const,label:t('Blindspots','Blindspots'),Icon:Compass}];
 return <div className="insights-hub"><nav className="insights-hub-tabs" aria-label={t('Insights sections','Insights के सेक्शन')}>{tabs.map(({id,label,Icon})=><button type="button" key={id} aria-pressed={tab===id} aria-controls="insights-hub-content" onClick={()=>setTab(id)}><Icon size={16}/>{label}</button>)}</nav><div id="insights-hub-content">
 {tab==='reading'&&<GuidedReading chart={chart} birth={birth} system={system} lang={lang} onSelect={onChart}/>}
 {tab==='patterns'&&<section className="guided-reading insights-pattern-card"><div className="guided-focus" role="group" aria-label={t('Reflection focus','विचार का विषय')}>{(['self','connection','work'] as const).map((id,i)=><button type="button" key={id} aria-pressed={focus===id} onClick={()=>setFocus(id)}>{hi?['खुद को समझना','जुड़ाव','काम और दिशा'][i]:['Understand myself','Connection','Work & direction'][i]}</button>)}</div><AIReading birth={birth} focus={focus} system={system} lang={lang} expanded/></section>}
 {tab==='blindspots'&&<QuincunxExplorer birth={birth} chart={chart} system={system} lang={lang} onSelect={onChart}/>}
 </div><p className="insights-hub-footnote">{t('Uses your active chart. Change birth details to explore another chart.','आपका active chart इस्तेमाल होता है। दूसरा chart देखने के लिए जन्म विवरण बदलें।')}</p></div>;
}
