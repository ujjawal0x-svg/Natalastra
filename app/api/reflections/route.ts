import {track} from '../../../lib/research';
import {z} from 'zod';
import {birthSchema} from '../../../lib/profile';
import {calculate} from '../../../lib/astro';
import {dailyInsight} from '../../../lib/insights';
import {database,owner,mutationGuard,limitedJson,apiError,ApiError} from '../../../lib/storage';
export const dynamic='force-dynamic';
const json=(data:unknown)=>Response.json(data,{headers:{'Cache-Control':'private, no-store'}});
const display=(r:any)=>({id:r.id,profileKey:r.profile_key,day:r.day,createdAt:r.created_at,...JSON.parse(r.payload)});
export async function GET(){try{const user=await owner(),db=database();const rows=await db.prepare('SELECT * FROM natal_reflections WHERE user_id = ? ORDER BY created_at DESC').bind(user.userId).all();return json({records:rows.results.map(display)});}catch(e){return apiError(e);}}
export async function POST(request:Request){try{mutationGuard(request);const user=await owner(),db=database(),body=await limitedJson(request);if(!body||typeof body!=='object')throw new ApiError(400,'Check your request.');
if(body.action==='create'){
 const parsed=z.object({birth:birthSchema,day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(d=>d>='1900-01-01'&&d<='2100-12-31'),lang:z.enum(['en','hi']),observation:z.string().trim().max(2000),note:z.string().trim().max(2000),rating:z.enum(['useful','generic','does-not-fit']),completed:z.boolean()}).safeParse(body);
 if(!parsed.success)throw new ApiError(400,'Choose your feedback and check your reflection.');
 const v=parsed.data;let reading;try{const chart=calculate(v.birth.date,v.birth.time,v.birth.location||v.birth.city,v.birth.unknown,v.birth.fold);reading=dailyInsight(chart,calculate(v.day,'12:00',v.birth.location||v.birth.city),v.lang);}catch{throw new ApiError(400,'Check the chart and reflection date.');}
 const count=await db.prepare('SELECT count(*) AS total FROM natal_reflections WHERE user_id = ?').bind(user.userId).first<{total:number}>();if((count?.total||0)>=1000)throw new ApiError(400,'Export and remove older reflections before adding more.');
 const b=v.birth;const profileKey=JSON.stringify([b.date,b.time,b.unknown,b.fold,b.location||b.city]);
 const payload=JSON.stringify({observation:v.observation,note:v.note,rating:v.rating,completed:v.completed,reading,lang:v.lang});const id=crypto.randomUUID(),createdAt=new Date().toISOString();
 await db.prepare('INSERT INTO natal_reflections (id,user_id,profile_key,day,payload,created_at) VALUES (?,?,?,?,?,?)').bind(id,user.userId,profileKey,v.day,payload,createdAt).run();await track(user.userId,'reflection_saved').catch(()=>{});return json({record:display({id,profile_key:profileKey,day:v.day,payload,created_at:createdAt})});
}
const id=z.string().uuid().safeParse(body.id);if(!id.success)throw new ApiError(400,'Choose a valid reflection.');const row:any=await db.prepare('SELECT * FROM natal_reflections WHERE id = ? AND user_id = ?').bind(id.data,user.userId).first();if(!row)throw new ApiError(404,'Reflection not found in your account.');
if(body.action==='delete'){await db.prepare('DELETE FROM natal_reflections WHERE id = ? AND user_id = ?').bind(id.data,user.userId).run();return json({ok:true});}
if(body.action==='review'){const review=z.object({outcome:z.enum(['helped','not-yet','not-helpful']),note:z.string().trim().max(2000)}).safeParse(body);if(!review.success)throw new ApiError(400,'Choose an outcome.');const data=JSON.parse(row.payload);data.review={...review.data,updatedAt:new Date().toISOString()};const payload=JSON.stringify(data);await db.prepare('UPDATE natal_reflections SET payload = ? WHERE id = ? AND user_id = ?').bind(payload,id.data,user.userId).run();await track(user.userId,'followup_saved').catch(()=>{});return json({record:display({...row,payload})});}
throw new ApiError(400,'Unknown reflection action.');}catch(e){return apiError(e);}}
