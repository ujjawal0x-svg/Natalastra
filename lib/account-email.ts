import {env,waitUntil} from 'cloudflare:workers';
import {createHash} from 'node:crypto';
import {database} from './storage';
import type {AccountUser} from './account-auth';
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
type Mail={id:string;user_id:string;session_key:string;kind:'welcome'|'welcome-back';payload:string;status:string};
export function entryMessage(user:AccountUser,origin:string,kind:Mail['kind']){
 const name=user.fullName||'there',url=new URL('/dashboard',origin).href;
 const title=kind==='welcome'?'Welcome to Natalastra.':'Welcome back to Natalastra.';
 const intro=kind==='welcome'?'Your account is ready. Begin with your birth details, then explore your chart and your own reflections.':'You have signed in successfully. Your saved chart and private reflections are ready when you are.';
 return {to:[user.email],subject:title,text:`Hi ${name},\n\n${title}\n${intro}\n\nOpen your universe: ${url}\n\nYour sky. Your agency.\nNatalastra\n\nThis is an account message, not a marketing subscription.`,html:`<!doctype html><html><body style="margin:0;background:#faf9f6;color:#0f172a;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td style="padding:32px 16px"><table role="presentation" style="max-width:560px;margin:auto;width:100%;background:white;border:1px solid #e5e2dc"><tr><td style="padding:32px"><p style="letter-spacing:3px;font-size:12px">NATALASTRA · YOUR SKY. YOUR AGENCY.</p><h1 style="font-size:30px">${title}</h1><p>Hi ${escape(name)},</p><p style="line-height:1.7">${intro}</p><p style="margin:28px 0"><a href="${escape(url)}" style="display:inline-block;padding:14px 22px;background:#0f172a;color:white;text-decoration:none">Open your universe</a></p><p style="line-height:1.7">A map, not a destiny.<br>Your next step remains yours.</p><p style="font-size:12px;color:#64748b">This is an account message, not a marketing subscription. No birth details or journal content are included.</p></td></tr></table></td></tr></table></body></html>`};
}
export async function queueEntryEmail(user:AccountUser,origin:string){
 const db=database(),now=new Date().toISOString(),session=user.sessionId||now.slice(0,10),welcomeId='welcome-'+hash(user.userId);
 await db.prepare('INSERT INTO natal_account_emails (id,user_id,session_key,kind,payload,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(welcomeId,user.userId,session,'welcome',JSON.stringify(entryMessage(user,origin,'welcome')),now).run();
 const welcome=await db.prepare('SELECT id,user_id,session_key,kind,payload,status FROM natal_account_emails WHERE id = ? AND user_id = ?').bind(welcomeId,user.userId).first<Mail>();
 if(!welcome)throw Error('Email queue unavailable');
 let id=welcomeId;
 if(welcome.status==='accepted'&&welcome.session_key!==session){id='login-'+hash(user.userId+':'+session);await db.prepare('INSERT INTO natal_account_emails (id,user_id,session_key,kind,payload,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,user.userId,session,'welcome-back',JSON.stringify(entryMessage(user,origin,'welcome-back')),now).run();}
 await sendEntryEmail(id,user.userId);
}
export async function sendEntryEmail(id:string,userId:string){
 const from=env.NATALASTRA_MAIL_FROM,key=env.RESEND_API_KEY;if(!from||!key)return;
 if(/[\r\n]/.test(from)||!from.includes('@'))throw Error('Invalid mail sender');
 const db=database(),now=new Date().toISOString(),lease=new Date(Date.now()-60000).toISOString(),windowStart=new Date(Date.now()-23*3600000).toISOString();
 const claim=await db.prepare("UPDATE natal_account_emails SET status = 'sending', attempts = attempts + 1, claimed_at = ?, first_attempt_at = COALESCE(first_attempt_at,?), last_error = NULL WHERE id = ? AND user_id = ? AND attempts < 3 AND (first_attempt_at IS NULL OR first_attempt_at > ?) AND (status IN ('pending','failed') OR (status = 'sending' AND claimed_at < ?)) RETURNING id").bind(now,now,id,userId,windowStart,lease).first<{id:string}>();
 if(!claim)return;
 const row=await db.prepare('SELECT id,user_id,session_key,kind,payload,status FROM natal_account_emails WHERE id = ? AND user_id = ?').bind(id,userId).first<Mail>();if(!row)throw Error('Email queue unavailable');
 try{
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({...JSON.parse(row.payload),from}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('provider-'+r.status);const result=await r.json() as {id?:string};if(!result.id)throw Error('provider-invalid-response');
  await db.prepare("UPDATE natal_account_emails SET status = 'accepted', accepted_at = ?, provider_id = ?, last_error = NULL WHERE id = ? AND user_id = ?").bind(new Date().toISOString(),result.id,id,userId).run();
 }catch(e){const reason=e instanceof Error&&/^provider-\d+$/.test(e.message)?e.message:'send-unconfirmed';await db.prepare("UPDATE natal_account_emails SET status = 'failed', last_error = ? WHERE id = ? AND user_id = ?").bind(reason,id,userId).run();}
}
export function scheduleEntryEmail(user:AccountUser,origin:string){waitUntil(queueEntryEmail(user,origin).catch(()=>{console.error('Natalastra account email queue could not complete.');}));}
