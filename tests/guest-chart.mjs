import assert from 'node:assert/strict';
import {guestChartUrl} from './guest-chart-module.mjs';
const local=new Map(),tab=new Map();let blocked=false,writes=0;
const storage=entries=>({getItem:key=>{if(blocked)throw Error();return entries.get(key)??null;},setItem:(key,value)=>{if(blocked)throw Error();writes++;entries.set(key,value);},removeItem:key=>entries.delete(key)});
globalThis.window={localStorage:storage(local),sessionStorage:storage(tab)};
const chart=await import(guestChartUrl);
const birth={name:'Guest',date:'1998-04-12',time:'08:30',city:0,unknown:false,fold:'later',location:{name:'Delhi',lat:28.6,lon:77.2,tz:'Asia/Kolkata'}};
assert.equal(chart.readGuestChart(),null);assert.equal(chart.updateGuestChart(birth),false);assert.equal(writes,0);
chart.saveGuestChart(birth);assert.deepEqual(chart.readGuestChart(),birth);assert.equal(chart.guestChartMode(),'device');assert.equal(tab.size,0);
// A new tab/browser session retains local storage and has fresh session storage.
window.sessionStorage=storage(new Map());const reload=await import(guestChartUrl+'#reload');assert.deepEqual(reload.readGuestChart(),birth);
assert.deepEqual(reload.readGuestChart(Date.now()+365*86400000),birth);
const edited={...birth,time:'09:30'};assert.equal(reload.updateGuestChart(edited),true);assert.deepEqual(chart.readGuestChart(),edited);
chart.forgetGuestTab();assert.deepEqual(chart.readGuestChart(),edited);
chart.forgetGuestChart();assert.equal(chart.readGuestChart(),null);assert.equal(chart.updateGuestChart(birth),false);
window.sessionStorage=storage(tab);const now=Date.now();tab.set('natalastra:guest-chart:v1',JSON.stringify({version:1,expiresAt:now+10000,birth}));assert.equal(chart.guestChartMode(now),'tab');chart.updateGuestChart(edited);assert.equal(local.size,0);assert.equal(chart.guestChartMode(),'tab');assert.equal(chart.readGuestChart(now+13*3600000),null);
chart.saveGuestChart({...birth,unknown:true,time:'12:00'});assert.equal(chart.readGuestChart().unknown,true);assert.equal(tab.size,0);
for(const raw of ['bad',JSON.stringify({version:9,birth}),JSON.stringify({version:2,birth:{...birth,time:'25:99'}})]){local.set('natalastra:guest-chart:v2',raw);assert.equal(chart.readGuestChart(),null);assert.equal(local.size,0);}
blocked=true;assert.equal(chart.readGuestChart(),null);assert.throws(()=>chart.saveGuestChart(birth),/cannot save/);blocked=false;
console.log('PASS: explicit consent only, persistent reload/new-session restore with no expiry, validated location/unknown time, edits, removal, legacy tab expiry without consent upgrade, corrupt data rejection and storage failure. Simulated storage; no real browser acceptance.');
