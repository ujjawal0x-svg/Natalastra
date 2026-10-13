import {env} from 'cloudflare:workers';
/** Only intentionally public business fields may leave the server. */
export function siteInfo(){
 const email=(env.NATALASTRA_SUPPORT_EMAIL||'').trim();
 return {operator:(env.NATALASTRA_OPERATOR_NAME||'').trim().slice(0,160),address:(env.NATALASTRA_BUSINESS_ADDRESS||'').trim().slice(0,400),supportEmail:/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)&&email.length<=254?email:null};
}
