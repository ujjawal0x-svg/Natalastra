import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {birthSchema} from '../../../../lib/profile';
import {calculate} from '../../../../lib/astro';
import {guidedReading} from '../../../../lib/guided-reading';
import {generateGroqReading,generatePatternMirror,GroqReadingError} from '../../../../lib/groq-reading';
import {owner,mutationGuard,limitedJson,apiError,ApiError} from '../../../../lib/storage';
export const dynamic='force-dynamic';
const inputSchema=z.object({consent:z.literal(true),birth:birthSchema,focus:z.enum(['self','connection','work']),lang:z.enum(['en','hi']),system:z.enum(['Whole Sign','Equal','Placidus','Koch']),mode:z.enum(['reading','mirror']).default('reading'),moment:z.enum(['yes','quiet','explain','start']).optional()}).strict().refine(d=>d.mode!=='mirror'||!!d.moment);
const windows=new Map<string,{at:number;count:number}>();let minute=0,total=0,active=0;
function local(request:Request){return ['localhost','127.0.0.1','[::1]'].includes(new URL(request.url).hostname);}
function enabled(request:Request){return !!env.GROQ_API_KEY&&(local(request)||env.NATALASTRA_AI_ENABLED==='true');}
function reserve(id:string){const now=Date.now(),slot=Math.floor(now/60000);if(slot!==minute){minute=slot;total=0;}for(const [key,v] of windows)if(now-v.at>=3600000)windows.delete(key);const entry=windows.get(id);if(total>=20||active>=3||(entry&&entry.count>=5)||(!entry&&windows.size>=512))throw new ApiError(429,'AI allowance reached. Your original reading is still available; try later.');windows.set(id,{at:entry?.at??now,count:(entry?.count??0)+1});total++;active++;}
export async function GET(request:Request){return Response.json({available:enabled(request),requiresSignIn:!local(request),provider:'Groq'},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){let reserved=false;try{
  mutationGuard(request);
  if(!enabled(request))throw new ApiError(503,'AI reading is not configured yet. Your original reading is still available.');
  const userId=local(request)?'local-test':(await owner()).userId;
  const input=inputSchema.safeParse(await limitedJson(request));if(!input.success)throw new ApiError(400,'Confirm AI sharing consent and check your chart settings.');
  const {birth,focus,lang,system,mode,moment}=input.data;let reading;
  try{const chart=calculate(birth.date,birth.time,birth.location||birth.city,birth.unknown,birth.fold);reading=guidedReading(chart,focus,system,lang);}catch{throw new ApiError(400,'Could not calculate this chart with the chosen house system.');}
  reserve(userId);reserved=true;
  const result=mode==='mirror'?await generatePatternMirror(env.GROQ_API_KEY!,reading,focus,lang,moment!):await generateGroqReading(env.GROQ_API_KEY!,reading,focus,lang);
  return Response.json({...(mode==='mirror'?{mirror:result}:{reading:result}),basis:reading.basis,uncertainty:reading.uncertainty,provider:'Groq',model:'openai/gpt-oss-20b'},{headers:{'Cache-Control':'private, no-store'}});
}catch(e){return apiError(e instanceof GroqReadingError?new ApiError(e.status,e.message):e);}finally{if(reserved)active--;}}
