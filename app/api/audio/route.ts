import {reserveNeural,releaseNeural} from '../../../lib/service-quota';
import {z} from 'zod';
import {owner,mutationGuard,limitedJson,apiError,ApiError} from '../../../lib/storage';
import {neuralAudio} from '../../../lib/neural-audio';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{mutationGuard(request);const user=await owner();const input=z.object({text:z.string().trim().min(1).max(2500),narrator:z.enum(['Christopher','Aria','Sonia','Swara','Madhur'])}).safeParse(await limitedJson(request));if(!input.success)throw new ApiError(400,'Choose a narrator and a reading of up to 2500 characters.');const reservation=await reserveNeural(user.userId);let audio;try{audio=await neuralAudio(input.data.text,input.data.narrator);}catch(e){await releaseNeural(reservation).catch(()=>{});console.error('Neural narration unavailable',e);throw new ApiError(503,'Neural narration is unavailable right now. Retry, or use your device voice.');}return new Response(audio as unknown as BodyInit,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'private, no-store','Content-Disposition':'inline; filename="natalastra-reading.mp3"'}});}catch(e){return apiError(e);}}
