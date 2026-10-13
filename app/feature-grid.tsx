'use client';
import {ArrowUpRight,Orbit,Sun,Compass,Heart,NotebookPen,FileText} from 'lucide-react';
import type {Lang} from '../lib/insights';
export function FeatureGrid({lang,onOpen,onReflect}:{lang:Lang;onOpen:(view:string)=>void;onReflect:()=>void}){
const hi=lang==='hi';
const cards=[
 {id:'reflection',icon:Sun,tone:'green',title:hi?'आज का अनुभव':'DAILY REFLECTION',body:hi?'अपने अनुभव से शुरुआत करें। एक रीडिंग, एक छोटा कदम और अपने लिए तीन मिनट।':'Start with what is happening in your life. Explore one reading, try a small action, and save what feels useful.',action:onReflect},
 {id:'chart',icon:Orbit,tone:'blue',title:hi?'जन्म चार्ट':'YOUR BIRTH CHART',body:hi?'अपने जन्म के आकाश को देखें। किसी ग्रह को चुनकर उसकी स्थिति और प्रतीकात्मक अर्थ समझें।':'Explore the sky at your birth. Select a planet to see its placement, chart basis, and symbolic interpretation.',action:()=>onOpen('chart')},
 {id:'psychology',icon:Compass,tone:'rose',title:hi?'आंतरिक दुनिया':'YOUR INNER WORLD',body:hi?'Sun, Moon और Rising के अलग नज़रिए समझें। जो मेल खाए उसे रखें; असहमत होना ठीक है।':'Meet the Sun, Moon, and Rising as different perspectives. Explore the tension between what you want and what you need.',action:()=>onOpen('psychology')},
 {id:'synastry',icon:Heart,tone:'pink',title:hi?'रिश्ते और बातचीत':'RELATIONSHIP PATTERNS',body:hi?'दो चार्ट के पहलू देखें और बेहतर बातचीत के सवाल खोजें। रिश्ता आपके अनुभव से समझें।':'Compare two charts and find questions for better conversations. Explore connection without a relationship verdict.',action:()=>onOpen('synastry')},
 {id:'journal',icon:NotebookPen,tone:'mint',title:hi?'निजी जर्नल':'PRIVATE JOURNAL',body:hi?'अपने शब्दों में लिखें, पुराने अनुभव पर लौटें और डेटा export या delete करें।':'Write the longer version of your story. Return to your saved entries, export your archive, or delete what you choose.',action:()=>onOpen('journal')},
 {id:'dossier',icon:FileText,tone:'violet',title:hi?'आपका डॉसियर':'YOUR NATAL DOSSIER',body:hi?'अपने चार्ट, प्रतीकात्मक रीडिंग और गणना किए गए transit contacts का दस पन्नों का PDF डाउनलोड करें।':'Keep a ten-page PDF of your chart, symbolic readings, reflection prompts, and selected exact transit contacts.',action:()=>onOpen('dossier')}
];
return <section className="reference-feature-grid" aria-label={hi?'Natalastra के फीचर्स':'Explore Natalastra features'}>{cards.map(({id,icon:Icon,tone,title,body,action})=><button type="button" className="reference-feature-card" key={id} onClick={action}><div className="reference-card-heading"><span className={'reference-icon '+tone}><Icon size={36} strokeWidth={1.8}/></span><h2>{title}</h2></div><p>{body}</p><span className="reference-card-open"><ArrowUpRight size={24}/><span className="sr-only">{hi?'खोलें':'Open'} {title}</span></span></button>)}</section>;
}
