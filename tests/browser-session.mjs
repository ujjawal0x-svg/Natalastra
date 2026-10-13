import {guestChartUrl} from './guest-chart-module.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
const events=new EventTarget();
globalThis.localStorage=storage();globalThis.sessionStorage=storage();
globalThis.window={location:{origin:'https://local.test'},localStorage,sessionStorage,addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events)};
let homeUrl,homeEvents=0;window.history={state:{},replaceState:(state,title,url)=>{homeUrl=url;}};
let fetched,source='supabase';
globalThis.fetch=async(input,init)=>{fetched={input,init};return Response.json({user:{source}});};
const code=ts.transpileModule(fs.readFileSync('app/browser-session.ts','utf8').replace("import {reportDiagnostic,safeApiTarget} from './diagnostics-client';","const reportDiagnostic=()=>{};const safeApiTarget=()=> 'other';").replace("'./guest-chart'",JSON.stringify(guestChartUrl)),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const session=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
let changes=0;const stop=session.watchBrowserAccount(()=>changes++);
session.setBrowserGuest(true);assert.equal(session.isBrowserGuest(),true);assert.equal(changes,1);
await session.apiFetch('/api/auth/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
assert.equal(fetched.init.headers.get('X-Natalastra-Guest'),'1');assert.equal(fetched.init.method,'POST');assert.equal(fetched.init.body,'{}');assert.equal(fetched.init.headers.get('Content-Type'),'application/json');
await session.apiFetch('https://other.test/api/profile');assert.equal(fetched.init.headers.get('X-Natalastra-Guest'),null);
await session.apiFetch('/chart');assert.equal(fetched.init.headers.get('X-Natalastra-Guest'),null);
source='chatgpt';await assert.rejects(session.confirmBrowserSignIn(),/could not keep/);assert.equal(session.isBrowserGuest(),true);
const guestChart=await import(guestChartUrl);guestChart.saveGuestChart({name:'Guest',date:'1998-04-12',time:'08:30',city:0,unknown:false,fold:'earlier'});assert.ok(guestChart.readGuestChart());source='supabase';await session.confirmBrowserSignIn();assert.ok(guestChart.readGuestChart());assert.equal(session.isBrowserGuest(),false);assert.equal(fetched.init.headers,undefined);
localStorage.setItem('natalastra:guest','1');window.dispatchEvent(new Event('pageshow'));assert.equal(changes,3);assert.equal(session.isBrowserGuest(),true);
stop();window.dispatchEvent(new Event('pageshow'));assert.equal(changes,3);
for(const name of ['localStorage','sessionStorage']){const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};globalThis[name]=blocked;window[name]=blocked;}
session.setBrowserGuest(true);assert.equal(session.isBrowserGuest(),true);assert.equal(session.browserGuestPersistent(),false);
await session.apiFetch('/api/auth/session');assert.equal(fetched.init.headers.get('X-Natalastra-Guest'),'1');
console.log('PASS: persistent logout preference, API denial header, no external leakage, verified sign-in only, page restoration, and blocked-storage fallback.');

const stopHome=session.watchLogoutHome(()=>homeEvents++);session.finishBrowserLogout();assert.equal(homeEvents,1);assert.equal(homeUrl,'/');assert.equal(session.isBrowserGuest(),true);stopHome();console.log('PASS: logout mounts the homepage event and replaces URL with / even when browser storage is blocked.');

let signinEvents=0;const stopSignin=session.watchSignInHome(()=>signinEvents++);session.openSignedInHome();assert.equal(homeUrl,'/');assert.equal(signinEvents,1);assert.equal(session.isBrowserGuest(),false);session.openPendingSignupHome();assert.equal(homeUrl,'/?verify_email=1');assert.equal(session.isBrowserGuest(),true);stopSignin();console.log('PASS: sign-in opens public home automatically; pending signup opens guest home with verification notice.');
