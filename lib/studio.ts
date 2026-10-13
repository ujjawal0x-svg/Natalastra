import {z} from 'zod';
import {birthSchema} from './profile';
import {calculate,placement,degree} from './astro';
import {archetypes} from './interpretation';
export const situations={boundaries:{title:'Saying no without losing connection',sun:'What would I choose if I did not have to prove myself?',moon:'What would make this boundary feel safe enough to express?',rising:'What am I trying to look like to the other person?',practice:'Try: “I care about this, and I cannot commit today. Here is what I can offer.”'},visibility:{title:'Sharing something I created',sun:'What do I want this work to express?',moon:'What support would help me tolerate an uncertain response?',rising:'Am I polishing the presentation to avoid being seen?',practice:'Choose one trusted person and share a small, unfinished version.'},connection:{title:'Asking for closeness or space',sun:'What do I actually want to ask for?',moon:'What need is underneath my reaction?',rising:'Does my outward response communicate that need?',practice:'Try: “I have noticed __. I feel __. Would you be open to __?”'}} as const;
export const qualities=['Explorer','Builder','Caregiver','Challenger','Creator','Connector'] as const;
const short=z.string().trim().min(1).max(2000);
export const studioSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('cast'),birth:birthSchema,situation:z.enum(['boundaries','visibility','connection']),voices:z.array(z.enum(['sun','moon','rising'])).min(1).max(3),response:short}),
 z.object({kind:z.literal('letter'),title:z.string().trim().min(1).max(100),body:z.string().trim().min(1).max(6000),revealAt:z.string().datetime()}),
 z.object({kind:z.literal('lens'),birth:birthSchema,observation:short}),
 z.object({kind:z.literal('archetype'),qualities:z.array(z.enum(qualities)).min(1).max(3),example:short,intention:z.string().trim().min(1).max(500)})
]);
export type StudioKind=z.infer<typeof studioSchema>['kind'];
export type StudioRecord={id:string;kind:StudioKind;created_at:string;data:any;locked?:boolean};
export function chartContext(birth:z.infer<typeof birthSchema>){const chart=calculate(birth.date,birth.time,birth.location||birth.city,birth.unknown,birth.fold);const words=archetypes(chart);return {name:birth.name,utc:chart.utc,basis:[`Sun · ${placement(chart.planets[0].lon)} ${degree(chart.planets[0].lon)}`,`Moon · ${placement(chart.planets[1].lon)} ${degree(chart.planets[1].lon)}`,chart.unknown?'Rising unavailable: birth time unknown':`Rising · ${placement(chart.asc)} ${degree(chart.asc)}`],...words};}
export function displayRecord(row:any,now=Date.now(),exportAll=false):StudioRecord{const data=JSON.parse(row.payload);const locked=row.kind==='letter'&&Date.parse(data.revealAt)>now;return {id:row.id,kind:row.kind,created_at:row.created_at,locked,data:locked&&!exportAll?{title:data.title,revealAt:data.revealAt}:data};}
