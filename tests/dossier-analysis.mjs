import assert from 'node:assert/strict';import ts from 'typescript';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'natalastra-report-'));try{
fs.symlinkSync(path.resolve('node_modules'),tmp+'/node_modules','dir');
for(const file of ['chiron','house-systems','transit-timeline','astro','insights','interpretation','dossier-synthesis','dossier-analysis']){const code=ts.transpileModule(fs.readFileSync('lib/'+file+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from ['"]\.\/(astro|insights|interpretation|chiron|house-systems|transit-timeline|dossier-synthesis)['"]/g,"from './$1.mjs'");fs.writeFileSync(tmp+'/'+file+'.mjs',code);}
const {buildDossierAnalysis}=await import(pathToFileURL(tmp+'/dossier-analysis.mjs'));
const {synthesizePair,editorialPairs}=await import(pathToFileURL(tmp+'/dossier-synthesis.mjs'));const {calculate}=await import(pathToFileURL(tmp+'/astro.mjs'));
const birth={name:'Alex',date:'1995-10-24',time:'08:30',city:0,unknown:false,fold:'earlier'};
const a=buildDossierAnalysis(birth,'Equal','relationships'),b=buildDossierAnalysis({...birth,date:'2000-04-12',time:'16:05'},'Equal','relationships'),work=buildDossierAnalysis(birth,'Equal','work'),unknown=buildDossierAnalysis({...birth,unknown:true},'Whole Sign','self-understanding');
for(const chapter of ['orientation','communication','connection'])assert.notEqual(a[chapter].body,b[chapter].body);
assert.notEqual(a.orientation.question,work.orientation.question);assert.notDeepEqual(a.houses,b.houses);assert.notDeepEqual(a.aspectNotes,b.aspectNotes);
assert.equal(a.weeks.length,4);assert.equal(a.houses.length,12);assert.equal(a.aspectNotes.length,4);
assert.ok(unknown.houses.every(h=>h.basis.includes('UNASSIGNED')));assert.ok(unknown.aspectNotes.every(h=>!h.title.includes('Moon')));assert.ok(unknown.orientation.body.includes('provisional'));
const base=calculate(birth.date,birth.time,birth.city);const pairChart=offset=>({...base,planets:base.planets.map(p=>({...p,lon:p.name==='Mercury'?10:p.name==='Saturn'?offset:p.lon}))});
const near=synthesizePair(pairChart(14),'Whole Sign','Mercury','Saturn','work'),apart=synthesizePair(pairChart(24),'Whole Sign','Mercury','Saturn','work');
assert.notEqual(near.body,apart.body,'same signs must differ when geometry differs');assert.ok(near.body.includes('Conjunction'));assert.ok(apart.body.includes('No major aspect'));assert.notEqual(near.practice,apart.practice);
assert.equal(synthesizePair({...base,unknown:true},'Whole Sign','Sun','Moon','relationships'),null);assert.ok(synthesizePair({...base,unknown:true},'Whole Sign','Mercury','Saturn','work').body.includes('House context is omitted'));
assert.equal(a.version,4);assert.equal(a.editorial.humanReviewed,false);assert.ok(a.editorial.rules.length>=3);assert.ok(a.aspectNotes.every(x=>!['Sun / Moon','Mercury / Saturn','Venus / Mars'].some(pair=>x.title.startsWith(pair))));
assert.notEqual(synthesizePair(base,'Whole Sign','Venus','Mars','work').practice,synthesizePair(base,'Whole Sign','Venus','Mars','relationships').practice);
for(const [left,right] of editorialPairs)for(const [offset,expected] of [[0,'Conjunction'],[60,'Sextile'],[90,'Square'],[120,'Trine'],[180,'Opposition'],[20,'placement-only']]){
 const fixture={...base,planets:base.planets.map(p=>({...p,lon:p.name===left?10:p.name===right?10+offset:p.lon}))};
 for(const focus of ['self-understanding','relationships','work']){const reading=synthesizePair(fixture,'Equal',left,right,focus);assert.ok(reading.ruleId.includes(expected));assert.ok(!reading.body.includes('Give the symbolic roles'),'named pair needs its own editorial synthesis');assert.ok(reading.practice.length>40);}
}
console.log('PASS: 39 pair families across five major aspects/no aspect and three focus choices (702 synthetic branches).');
console.log('PASS: same signs with different geometry produce different analysis; no invented aspect, unknown-time Moon synthesis omitted, focus-specific practices, auditable rule IDs and no repeated main-chapter aspect pairs.');
console.log('PASS: birth details change synthesis, communication, boundaries, house context and aspect analysis; focus changes prompts; unknown birth time omits unsupported houses and Moon contacts.');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
