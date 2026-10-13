import {siteInfo} from '../../../lib/site-info';
export const dynamic='force-dynamic';
export async function GET(){return Response.json(siteInfo(),{headers:{'Cache-Control':'no-store'}});}
