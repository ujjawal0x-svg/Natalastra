import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID,createHash} from 'node:crypto';
if(process.stdin.isTTY)process.stdin.setRawMode(true);console.log('Ready for hidden Supabase test configuration.');
const config=await new Promise(resolve=>{let s='';const read=b=>{s+=b;if(s.includes('\n')){process.stdin.off('data',read);if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();resolve(JSON.parse(s.split('\n')[0]));}};process.stdin.on('data',read);process.stdin.resume();});
const users=[],label=randomUUID(),email='auth-'+label+'@example.test',password=randomUUID()+'Aa!',legacy='auth-test-legacy:'+label,ip='auth-test:'+label;
const headers={apikey:config.secret,'Content-Type':'application/json'};
async function admin(path,body,method='POST'){const r=await fetch(config.url+'/auth/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Admin test fixture failed ('+r.status+')');return r.status===204?null:await r.json();}
const require=createRequire(fs.realpathSync('node_modules/wrangler/package.json')),{Miniflare}=require('miniflare');
const modules=fs.readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:0).map(p=>({type:'ESModule',path:process.cwd()+'/dist/server/'+p}));
let mf;
const platform={'oai-authenticated-user-id':legacy,'oai-authenticated-user-email':email};
const base={Origin:'https://local.test','X-Natalastra-Request':'1','Content-Type':'application/json','cf-connecting-ip':ip};
const jar=new Map();
async function req(path,body,extra={},update=true){const r=await mf.dispatchFetch('https://local.test'+path,{method:body===undefined?'GET':'POST',headers:{...base,Cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),...extra},body:body===undefined?undefined:JSON.stringify(body),redirect:'manual'});if(update)for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],index=pair.indexOf('=');if(c.includes('Max-Age=0;'))jar.delete(pair.slice(0,index));else jar.set(pair.slice(0,index),pair.slice(index+1));}return {status:r.status,data:await r.json()};}
try{
 const fixture=await admin('admin/users',{email,password,email_confirm:true,user_metadata:{full_name:'Auth integration verification'}});const user=fixture.id||fixture.user?.id;assert.ok(user);users.push(user);
 const second=await admin('admin/users',{email:'other-'+label+'@example.test',password,email_confirm:true});const other=second.id||second.user?.id;users.push(other);
 mf=new Miniflare({modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{NATALASTRA_AUTH:'hybrid',NATALASTRA_DATABASE:'supabase',SUPABASE_URL:config.url,SUPABASE_SECRET_KEY:config.secret,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:config.publishable},serviceBindings:{ASSETS:async()=>new Response('Not found',{status:404})},outboundService:async request=>{assert.equal(new URL(request.url).hostname,new URL(config.url).hostname);const r=await fetch(request.url,{method:request.method,headers:request.headers,body:['GET','HEAD'].includes(request.method)?undefined:await request.arrayBuffer(),signal:AbortSignal.timeout(25000)});const text=await r.text();return new Response([204,205,304].includes(r.status)?null:text,{status:r.status,headers:{'Content-Type':'application/json'}});}});
 let r=await req('/api/auth/login',{email,password,returnTo:'/journal'});assert.equal(r.status,200,r.data.error);assert.equal(r.data.redirect,'/journal');assert.equal(r.data.user.source,'supabase');
 const oldAccess=jar.get('__Host-na-access');assert.ok(oldAccess);console.log('PASS: confirmed Supabase account login.');
 r=await req('/api/auth/session',undefined,platform);assert.equal(r.status,200,r.data.error);assert.equal(r.data.canLink,true);
 r=await req('/api/auth/link',{},platform);assert.equal(r.status,200,r.data.error);r=await req('/api/auth/session');assert.equal(r.data.user.linked,true);
 r=await req('/api/vault',{action:'save-entry',title:'Auth integration verification',body:'Private isolated test note',mood:'calm'});assert.equal(r.status,200,r.data.error);
 r=await req('/api/vault?export=1');assert.equal(r.status,200,r.data.error);assert.equal(r.data.entries.length,1);
 const saved=r.data.entries[0].id;console.log('PASS: verified identity link and private save/read.');
 jar.delete('__Host-na-access');r=await req('/api/auth/refresh',{});assert.equal(r.status,200,r.data.error);assert.ok(jar.get('__Host-na-access'));console.log('PASS: refresh-token exchange.');
 r=await req('/api/auth/logout',{});assert.equal(r.status,200,r.data.error);assert.equal((await req('/api/auth/session',undefined,platform)).data.user,null);
 assert.equal((await req('/api/vault',undefined,platform)).status,401);
 assert.equal((await req('/api/vault',undefined,{...platform,Cookie:'__Host-na-access='+oldAccess},false)).status,401);
 r=await req('/api/auth/login',{email:'other-'+label+'@example.test',password});assert.equal(r.status,200,r.data.error);
 r=await req('/api/vault?export=1');assert.equal(r.status,200,r.data.error);assert.equal(r.data.entries.length,0);
 assert.equal((await req('/api/vault',{action:'delete-entry',id:saved})).status,404);
 r=await req('/api/auth/link',{},platform);assert.equal(r.status,403);
 for(const path of ['/rest/v1/natal_account_links?select=*','/rest/v1/natal_auth_attempts?select=*']){const denied=await fetch(config.url+path,{headers:{apikey:config.publishable}});assert.ok(denied.status>=400);}
 for(const [path,body] of [['natalastra_account_context',{session_id:'00000000-0000-4000-8000-000000000000',account_id:user}],['natalastra_link_account',{account_id:user,legacy_id:legacy}],['natalastra_auth_attempt',{identity_hash:createHash('sha256').update(ip).digest('base64url'),attempt_action:'login'}]]){const denied=await fetch(config.url+'/rest/v1/rpc/'+path,{method:'POST',headers:{apikey:config.publishable,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.ok(denied.status>=400);}
 await req('/api/auth/logout',{});
 console.log('PASS: real Supabase email login, live session checks, verified legacy link, private archive write/read, refresh, revocation of old JWT, second-account isolation, and browser denial of identity tables/RPCs. No email sent.');
}finally{
 if(mf)await mf.dispose();
 for(const table of ['natal_journal','natal_service_usage'])for(const user of [legacy,...users.map(u=>'sb:'+u)]){const u=new URL('/rest/v1/'+table,config.url);u.searchParams.set('user_id','eq.'+user);const r=await fetch(u,{method:'DELETE',headers});if(!r.ok)throw Error('Auth test data cleanup failed');}
 const u=new URL('/rest/v1/natal_auth_attempts',config.url);u.searchParams.set('id','eq.'+createHash('sha256').update(ip).digest('base64url')+':login');await fetch(u,{method:'DELETE',headers});
 for(const user of users)await admin('admin/users/'+user,undefined,'DELETE');
 console.log('Isolated auth users and records removed.');
}
