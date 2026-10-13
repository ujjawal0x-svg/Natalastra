import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
globalThis.testEnv={};
const source=fs.readFileSync('lib/dossier-preview.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env=globalThis.testEnv;');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {dossierPreview}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const now=Date.now(),owner={email:'owner@example.test'};assert.equal(dossierPreview(owner,now),null);testEnv.RESEARCH_ADMIN_EMAIL=' Owner@example.test ';testEnv.NATALASTRA_DOSSIER_PREVIEW_UNTIL=new Date(now+1000).toISOString();assert.ok(dossierPreview(owner,now));assert.equal(dossierPreview({email:'buyer@example.test'},now),null);assert.equal(dossierPreview(owner,now+1000),null);testEnv.NATALASTRA_DOSSIER_PREVIEW_UNTIL='invalid';assert.equal(dossierPreview(owner,now),null);testEnv.NATALASTRA_DOSSIER_PREVIEW_UNTIL=new Date(now+1000).toISOString();delete testEnv.RESEARCH_ADMIN_EMAIL;assert.equal(dossierPreview(owner,now),null);
console.log('PASS: preview owner scope, explicit configuration, expiry and malformed/missing config fail closed.');
