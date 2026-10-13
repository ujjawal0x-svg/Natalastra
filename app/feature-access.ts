import {apiFetch} from './browser-session';
// Public local tools may open only when the server confirms this edition is free.
// Private records and paid entitlements still require authenticated access.
export async function checkPurchasedAccess(product:'dossier'|'pass'){
 const r=await apiFetch('/api/billing/access?require='+product,{cache:'no-store'});
 const d:any=await r.json();
 if(r.ok)return d;
 if(r.status===401){
  if(product==='dossier')throw Error('Sign in and purchase the dossier to download your report.');
  const catalog=await apiFetch('/api/billing/catalog',{cache:'no-store'});
  if(catalog.ok){const c:any=await catalog.json();if(c.complimentary===true)return {complimentary:true,guest:true};}
  throw Error('Sign in to check your purchased access. Open Access & Pricing for plans.');
 }
 throw Error(d.error||'Access could not be checked. Please try again.');
}
