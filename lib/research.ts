import {env} from 'cloudflare:workers';
import {database} from './storage';
export const eventNames=['visit','reflection_open','reflection_saved','followup_saved','chart_open','synastry_open','dossier_open','checkout_started'] as const;
export function isResearchAdmin(user:{email:string}){return !!env.RESEARCH_ADMIN_EMAIL&&user.email.toLowerCase()===env.RESEARCH_ADMIN_EMAIL.trim().toLowerCase();}
export async function track(userId:string,event:typeof eventNames[number]){const db=database();const consent=await db.prepare('SELECT enabled FROM natal_research_consent WHERE user_id = ?').bind(userId).first<{enabled:number}>();if(consent?.enabled!==1)return;const day=new Date().toISOString().slice(0,10);await db.prepare('INSERT OR IGNORE INTO natal_research_events (id,user_id,event,day) VALUES (?,?,?,?)').bind(`${userId}:${day}:${event}`,userId,event,day).run();}
