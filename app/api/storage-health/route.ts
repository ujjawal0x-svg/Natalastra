import {env} from 'cloudflare:workers';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {database,storageName,apiError,ApiError} from '../../../lib/storage';
import {getChatGPTUser} from '../../chatgpt-auth';
import {isResearchAdmin} from '../../../lib/research';
export const dynamic='force-dynamic';

/** Read-only readiness check. Returns no user data, counts, credentials or database errors. */
export async function GET(request:Request){try{
 const user=await getChatGPTUser();
 if(!user||!isResearchAdmin(user)){
  const timestamp=request.headers.get('x-natalastra-health-time')||'',signature=request.headers.get('x-natalastra-health-signature')||'';
  if(!env.SUPABASE_SECRET_KEY||!/^\d{13}$/.test(timestamp)||Math.abs(Date.now()-Number(timestamp))>60000||!/^[a-f0-9]{64}$/.test(signature))throw new ApiError(401,'Authorized health check required.');
  const expected=createHmac('sha256',env.SUPABASE_SECRET_KEY).update('natalastra-storage-health:'+timestamp).digest(),actual=Buffer.from(signature,'hex');
  if(expected.length!==actual.length||!timingSafeEqual(expected,actual))throw new ApiError(401,'Authorized health check required.');
 }
 await database().prepare('SELECT COUNT(*) AS total FROM natal_product_feedback WHERE user_id = ?').bind('storage-health:no-user').first();
 return Response.json({ok:true,storage:storageName()},{headers:{'Cache-Control':'private, no-store'}});
}catch(e){return apiError(e);}}
