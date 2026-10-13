import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
let replies=[],calls=[];
globalThis.testApiFetch=async path=>{calls.push(path);const [status,body]=replies.shift();return Response.json(body,{status});};
const source=fs.readFileSync('app/feature-access.ts','utf8').replace("import {apiFetch} from './browser-session';",'const apiFetch=globalThis.testApiFetch;');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {checkPurchasedAccess}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
replies=[[401,{error:'Sign in required'}],[200,{complimentary:true}]];
assert.deepEqual(await checkPurchasedAccess('pass'),{complimentary:true,guest:true});
assert.deepEqual(calls,['/api/billing/access?require=pass','/api/billing/catalog']);
for(const body of [{complimentary:false},{complimentary:'true'},{}]){
 replies=[[401,{error:'Sign in required'}],[200,body]];
 await assert.rejects(checkPurchasedAccess('pass'),/Sign in/);
}
replies=[[401,{error:'Sign in required'}],[503,{error:'Unavailable'}]];await assert.rejects(checkPurchasedAccess('dossier'),/Sign in/);
replies=[[403,{error:'Purchase required'}]];await assert.rejects(checkPurchasedAccess('pass'),/Purchase required/);assert.equal(replies.length,0);
replies=[[200,{dossier:true}]];assert.deepEqual(await checkPurchasedAccess('dossier'),{dossier:true});
console.log('PASS: guest local tools require confirmed complimentary catalog; paid, unavailable and malformed access fail closed; private authorization unchanged.');

replies=[[401,{error:'Sign in required'}]];await assert.rejects(checkPurchasedAccess('dossier'),/purchase the dossier/);assert.equal(replies.length,0);
