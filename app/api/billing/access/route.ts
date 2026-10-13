import {env} from 'cloudflare:workers';
import {isResearchAdmin} from '../../../../lib/research';
import {capabilities,requireAccess} from '../../../../lib/billing';
import {owner,apiError,ApiError} from '../../../../lib/storage';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const user=await owner(),required=new URL(request.url).searchParams.get('require');if(required&&required!=='dossier'&&required!=='pass')throw new ApiError(400,'Unknown access type.');const a=required?await requireAccess(user.userId,required as 'dossier'|'pass'):await capabilities(user.userId);return Response.json({...a,...(isResearchAdmin(user)?{setup:{missing:['LEMON_API_KEY','LEMON_WEBHOOK_SECRET','LEMON_STORE_ID','LEMON_DOSSIER_VARIANT_ID','LEMON_PASS_VARIANT_ID'].filter(key=>!(env as unknown as Record<string,string>)[key]),webhook:new URL('/api/billing/webhook',request.url).href}}:{})},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return apiError(e);}}
