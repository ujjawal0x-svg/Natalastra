import {createHmac} from 'node:crypto';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
console.log('Ready for storage health credentials on hidden stdin.');
const config=await new Promise(resolve=>{let input='';const read=chunk=>{input+=chunk;const end=input.indexOf('\n');if(end>=0){process.stdin.off('data',read);if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();resolve(JSON.parse(input.slice(0,end)));}};process.stdin.on('data',read);process.stdin.resume();});
const timestamp=Date.now().toString(),signature=createHmac('sha256',config.secret).update('natalastra-storage-health:'+timestamp).digest('hex');
const r=await fetch(new URL('/api/storage-health',config.site),{headers:{'OAI-Sites-Authorization':'Bearer '+config.bypass,'X-Natalastra-Health-Time':timestamp,'X-Natalastra-Health-Signature':signature},signal:AbortSignal.timeout(30000)});
if(!r.ok)throw Error('Storage health check failed: '+r.status);
const d=await r.json();if(d.ok!==true||d.storage!=='Supabase PostgreSQL')throw Error('Unexpected storage health response');
console.log('PASS: published website backend connected to Supabase PostgreSQL.');
