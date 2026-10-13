import ts from 'typescript';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'natalastra-entry-'));
try{
 fs.symlinkSync(path.resolve('node_modules'),path.join(tmp,'node_modules'),'dir');
 for(const name of ['chiron','house-systems','transit-timeline','astro','profile','entry-flow']){const code=ts.transpileModule(fs.readFileSync('lib/'+name+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from ['"]\.\/(astro|profile|chiron|house-systems|transit-timeline)['"]/g,"from './$1.mjs'");fs.writeFileSync(path.join(tmp,name+'.mjs'),code);}
 const {savedBirth,savedProfile}=await import(pathToFileURL(path.join(tmp,'entry-flow.mjs')));
 const birth={name:'Entry test',date:'1995-10-24',time:'08:30',city:0,unknown:false,fold:'earlier'};
 const profiles=[{id:'latest',birth},{id:'other',birth:{...birth,name:'Other chart'}}];
 assert.equal(savedBirth([],null),null);
 assert.equal(savedBirth(profiles,null).name,'Entry test');
 assert.equal(savedBirth(profiles,'other').name,'Other chart');assert.equal(savedProfile(profiles,'other').id,'other');assert.equal(savedProfile(profiles,null).id,'latest');
 assert.throws(()=>savedBirth(profiles,'missing'),/not in your archive/);
 assert.throws(()=>savedBirth([{id:'broken',birth:{}}],null),/need attention/);
 assert.throws(()=>savedBirth(undefined,null),/could not be loaded/);
 assert.equal(savedBirth([{id:'broken',birth:{}},...profiles],null).name,'Entry test');
 assert.throws(()=>savedBirth([{id:'broken',birth:{}},...profiles],'broken'),/need attention/);
 console.log('PASS: new-account onboarding, latest saved chart, explicit chart selection, invalid/missing profiles and malformed responses.');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
