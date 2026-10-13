import {calculate} from '../../../lib/astro';
import {houseSystems,houseCusps} from '../../../lib/house-systems';
import {dossierPreview} from '../../../lib/dossier-preview';
import {owner,mutationGuard,limitedJson,apiError,ApiError} from '../../../lib/storage';
import {requireAccess} from '../../../lib/billing';
import {birthSchema} from '../../../lib/profile';
import {buildDossierAnalysis,dossierFocuses} from '../../../lib/dossier-analysis';
export const dynamic='force-dynamic';
export async function GET(){try{const user=await owner();return Response.json({ownerPreviewUntil:dossierPreview(user)},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return apiError(e);}}
export async function POST(request:Request){try{
 mutationGuard(request);const user=await owner();if(!dossierPreview(user))await requireAccess(user.userId,'dossier');
 const body=await limitedJson(request),parsed=birthSchema.safeParse(body?.birth);
 if(!parsed.success)throw new ApiError(400,'Check your birth details.');
 if(!houseSystems.includes(body.system))throw new ApiError(400,'Choose Whole Sign, Equal, Placidus or Koch houses.');try{houseCusps(calculate(parsed.data.date,parsed.data.time,parsed.data.location||parsed.data.city,parsed.data.unknown,parsed.data.fold),body.system);}catch(e){throw new ApiError(400,e instanceof Error?e.message:'House system unavailable.');}
 if(!dossierFocuses.includes(body.focus))throw new ApiError(400,'Choose a report focus.');
 const issuedAt=new Date().toISOString(),report=buildDossierAnalysis(parsed.data,body.system,body.focus,issuedAt);
 return Response.json({birth:parsed.data,system:body.system,issuedAt,report},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return apiError(e);}}
