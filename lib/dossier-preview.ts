import {env} from 'cloudflare:workers';
/** A time-limited preview for the already configured owner; never a purchase grant. */
export function dossierPreview(user:{email:string},now=Date.now()){
 const until=Date.parse(env.NATALASTRA_DOSSIER_PREVIEW_UNTIL||''),owner=(env.RESEARCH_ADMIN_EMAIL||'').trim().toLowerCase();
 return Number.isFinite(until)&&until>now&&!!owner&&user.email.toLowerCase()===owner?new Date(until).toISOString():null;
}
