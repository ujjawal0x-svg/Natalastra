import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID,createHmac} from 'node:crypto';
import ts from 'typescript';

// Credentials enter through hidden stdin and are never written, echoed or logged.
if(process.stdin.isTTY)process.stdin.setRawMode(true);
console.log('Ready for Supabase test credentials on hidden stdin.');
const config=await new Promise(resolve=>{let input='';const read=chunk=>{input+=chunk;const end=input.indexOf('\n');if(end>=0){process.stdin.off('data',read);if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();resolve(JSON.parse(input.slice(0,end)));}};process.stdin.on('data',read);process.stdin.resume();});
const registry=JSON.parse(fs.readFileSync('lib/supabase-statements.json','utf8'));
const source=fs.readFileSync('lib/supabase-storage.ts','utf8').replace("import statements from './supabase-statements.json';",`const statements=${JSON.stringify(registry)};`);
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {SupabaseStorage,SupabaseStatement}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const db=new SupabaseStorage(config.url,config.secret),user='integration-test:'+randomUUID(),other='integration-test:'+randomUUID(),now=new Date().toISOString(),day=now.slice(0,10),headers={apikey:config.secret};
const require=createRequire(fs.realpathSync('node_modules/wrangler/package.json')),{Miniflare}=require('miniflare');
const modules=fs.readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:0).map(p=>({type:'ESModule',path:process.cwd()+'/dist/server/'+p}));
const webhookSecret='isolated-test-signature-secret';let intent;
const mf=new Miniflare({modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{NATALASTRA_DATABASE:'supabase',SUPABASE_URL:config.url,SUPABASE_SECRET_KEY:config.secret,RESEARCH_ADMIN_EMAIL:'owner@example.test',LEMON_API_KEY:'mock-key',LEMON_WEBHOOK_SECRET:webhookSecret,LEMON_STORE_ID:'1',LEMON_DOSSIER_VARIANT_ID:'11',LEMON_PASS_VARIANT_ID:'12',LEMON_TEST_MODE:'true',NATALASTRA_PAID_ENABLED:'true'},serviceBindings:{ASSETS:async()=>new Response('Not found',{status:404})},outboundService:async request=>{
 const url=new URL(request.url);if(url.hostname===new URL(config.url).hostname){const r=await fetch(url,{method:request.method,headers:request.headers,body:['GET','HEAD'].includes(request.method)?undefined:await request.arrayBuffer(),signal:AbortSignal.timeout(20000)});const body=await r.text();if(!r.ok){const b=JSON.parse(body);console.log('Supabase test transport error',r.status,b.code);}return new Response(body,{status:r.status,headers:{'Content-Type':'application/json'}});}
 if(url.hostname==='api.lemonsqueezy.com'){
  if(url.pathname==='/v1/prices')return Response.json({data:[{attributes:{variant_id:Number(url.searchParams.get('filter[variant_id]')),category:'one_time',scheme:'standard',unit_price:1400,created_at:now,renewal_interval_unit:null,trial_interval_unit:null}}]});
  if(url.pathname.startsWith('/v1/variants/'))return Response.json({data:{attributes:{test_mode:true,status:'published'}}});
  if(url.pathname==='/v1/stores/1')return Response.json({data:{attributes:{currency:'USD'}}});
  if(url.pathname==='/v1/checkouts'){const b=await request.json();intent=b.data.attributes.checkout_data.custom.natalastra_intent;return Response.json({data:{attributes:{url:'https://test-store.lemonsqueezy.com/checkout/custom/verified',test_mode:true,preview:{currency:'USD',subtotal:1400}}}});}
 }throw Error('Unexpected test endpoint');
}});
const auth={'oai-authenticated-user-id':user,'oai-authenticated-user-email':'owner@example.test',Origin:'https://local.test','X-Natalastra-Request':'1','Content-Type':'application/json'};
async function req(path,body,h=auth){const r=await mf.dispatchFetch('https://local.test'+path,{method:body?'POST':'GET',headers:h,body:body?JSON.stringify(body):undefined});const data=await r.json();return {status:r.status,data};}
try{
 const paymentsOnly=process.argv.includes('--payments');
 if(!paymentsOnly){
 // Real Postgres binding safety, transaction rollback, and concurrent quotas.
 const text="Integration verification: ' ? ); DROP TABLE natal_profiles; --",id=randomUUID();
 await db.prepare('INSERT INTO natal_product_feedback (id,user_id,feature,rating,comment,created_at) VALUES (?,?,?,?,?,?)').bind(id,user,'overall','useful',text,now).run();
 assert.equal((await db.prepare('SELECT id,feature,rating,comment,created_at FROM natal_product_feedback WHERE user_id = ? ORDER BY created_at DESC').bind(user).all()).results[0].comment,text);
 assert.equal((await db.prepare('SELECT id,feature,rating,comment,created_at FROM natal_product_feedback WHERE user_id = ? ORDER BY created_at DESC').bind(other).all()).results.length,0);
 await assert.rejects(()=>db.batch([db.prepare('INSERT INTO natal_product_feedback (id,user_id,feature,rating,comment,created_at) VALUES (?,?,?,?,?,?)').bind(randomUUID(),user,'overall','useful','Should roll back',now),new SupabaseStatement(db,'unknown',[])]));
 assert.equal((await db.prepare('SELECT COUNT(*) AS total FROM natal_product_feedback WHERE user_id = ?').bind(user).first()).total,1);
 const quota='quota:'+user,statement='INSERT INTO natal_service_usage (id,user_id,service,day,count) VALUES (?,?,?,?,1) ON CONFLICT(id) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count';
 const attempts=[];for(let i=0;i<5;i++)attempts.push(...await Promise.all(Array.from({length:5},()=>db.prepare(statement).bind(quota,user,'neural',day,20).first())));assert.equal(attempts.filter(Boolean).length,20);
 await db.prepare('UPDATE natal_service_usage SET count = MAX(0,count - 1) WHERE id = ?').bind(quota).run();
 assert.equal((await db.prepare('SELECT service,day,count FROM natal_service_usage WHERE user_id = ? ORDER BY day DESC').bind(user).all()).results[0].count,19);
 if(config.publishable){assert.ok((await fetch(new URL('/rest/v1/natal_product_feedback?select=id',config.url),{headers:{apikey:config.publishable}})).status>=400);assert.ok((await fetch(new URL('/rest/v1/rpc/natalastra_batch',config.url),{method:'POST',headers:{apikey:config.publishable,'Content-Type':'application/json'},body:JSON.stringify({commands:[{id:registry['SELECT COUNT(*) AS total FROM natal_product_feedback WHERE user_id = ?'].id,values:[user]}]})})).status>=400);}
 console.log('PASS: Postgres bindings, rollback, concurrent quota and browser denial.');
 // Actual compiled Worker routes, authorization, export and erase against Supabase.
 assert.equal((await req('/api/storage-health',undefined,{})).status,401);
 assert.equal((await req('/api/storage-health')).data.storage,'Supabase PostgreSQL');
 assert.equal((await req('/api/research',undefined,{})).status,401);
 assert.equal((await req('/api/research',{action:'feedback',feature:'overall',rating:'useful',comment:'Integration verification'}, {...auth,Origin:'https://evil.test'})).status,403);
 assert.equal((await req('/api/research',{action:'consent',enabled:true})).status,200);
 assert.equal((await req('/api/research',{action:'event',event:'visit'})).status,200);
 assert.equal((await req('/api/research',{action:'event',event:'visit'})).status,200);
 assert.equal((await req('/api/research',{action:'feedback',feature:'daily',rating:'generic',comment:'Integration verification'})).status,200);
 let d=await req('/api/research?dashboard=1');assert.equal(d.status,200);assert.equal(d.data.storage,'Supabase PostgreSQL');assert.equal(d.data.ownFeedback.length,2);
 assert.equal((await req('/api/research?dashboard=1',undefined,{...auth,'oai-authenticated-user-id':other,'oai-authenticated-user-email':'other@example.test'})).status,403);
 const birth={name:'Integration verification',date:'1995-10-24',time:'08:30',city:0,unknown:false,fold:'earlier'};
 assert.equal((await req('/api/vault',{action:'save-profile',birth})).status,200);
 const entry=await req('/api/vault',{action:'save-entry',title:'Integration verification',body:'Private test note',mood:'calm'});assert.equal(entry.status,200);
 assert.equal((await req('/api/vault',{action:'delete-entry',id:entry.data.id},{...auth,'oai-authenticated-user-id':other})).status,404);
 assert.equal((await req('/api/reflections',{action:'create',birth,day,lang:'en',observation:'Private test observation',note:'Private test note',rating:'useful',completed:true})).status,200);
 assert.equal((await req('/api/studio',{action:'create',record:{kind:'archetype',qualities:['Builder'],example:'Integration verification',intention:'Test secure storage'}})).status,200);
 const exported=await req('/api/vault?export=1');assert.equal(exported.status,200);assert.equal(exported.data.research.feedback.length,2);assert.equal(exported.data.profiles.length,1);assert.equal(exported.data.reflections.length,1);assert.equal(exported.data.studio.length,1);
 d=await req('/api/research?dashboard=1');assert.equal(d.status,200);assert.ok(!JSON.stringify(d.data).includes('Private test'));
 console.log('PASS: feedback, dashboard, private archive and export through compiled Worker.');
 }else{assert.equal((await req('/api/storage-health',undefined,{})).status,401);assert.equal((await req('/api/storage-health')).data.storage,'Supabase PostgreSQL');}
 const checkout=await req('/api/billing/checkout',{product:'dossier'});assert.equal(checkout.status,200);
 const paidAt=new Date().toISOString();
 const order={meta:{event_name:'order_created',custom_data:{natalastra_intent:intent}},data:{type:'orders',id:String(Math.floor(Math.random()*900000000)+100000000),attributes:{store_id:1,test_mode:true,currency:'USD',first_order_item:{variant_id:11,price:1400},subtotal:1400,discount_total:0,status:'paid',refunded:false,created_at:paidAt,updated_at:paidAt}}};
 async function webhook(body){const raw=JSON.stringify(body),r=await mf.dispatchFetch('https://local.test/api/billing/webhook',{method:'POST',headers:{'X-Signature':createHmac('sha256',webhookSecret).update(raw).digest('hex')},body:raw});return {status:r.status,data:await r.json()};}
 {const w=await webhook(order);assert.equal(w.status,200,w.data.error);}{const w=await webhook(order);assert.equal(w.status,200,w.data.error);}assert.equal((await req('/api/billing/access')).data.purchases.length,1);
 order.meta.event_name='order_refunded';order.data.attributes.status='refunded';order.data.attributes.refunded=true;{const w=await webhook(order);assert.equal(w.status,200,w.data.error);}assert.equal((await req('/api/billing/access')).data.purchases[0].status,'revoked');
 assert.equal((await req('/api/research',{action:'consent',enabled:false})).status,200);assert.equal((await req('/api/vault?export=1')).data.research.events.length,0);
 assert.equal((await req('/api/vault',{action:'delete-archive',confirm:'DELETE'})).status,200);assert.equal((await req('/api/vault?export=1')).data.research.feedback.length,0);assert.equal((await req('/api/billing/access')).data.purchases.length,1);
 console.log('PASS: Supabase-backed compiled Worker verified test payment, replay, refund, consent withdrawal and archive erase preserving purchase records.');
}finally{
 await mf.dispose();
 const cleanup=[];
 for(const table of ['natal_product_feedback','natal_profiles','natal_journal','natal_studio','natal_reflections','natal_research_events','natal_research_consent','natal_service_usage','natal_purchases','natal_checkout_intents'])for(const u of [user,other]){
  const url=new URL('/rest/v1/'+table,config.url);url.searchParams.set('user_id','eq.'+u);cleanup.push(fetch(url,{method:'DELETE',headers}).then(r=>{if(!r.ok)throw Error('Test cleanup failed');}));
 }
 await Promise.all(cleanup);
 console.log('Test records removed.');
}
