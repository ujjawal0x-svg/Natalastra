import ts from 'typescript';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'natalastra-quality-'));
try{fs.symlinkSync(path.resolve('node_modules'),path.join(tmp,'node_modules'),'dir');
for(const name of ['chiron','house-systems','transit-timeline','astro','insights','interpretation']){const code=ts.transpileModule(fs.readFileSync('lib/'+name+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from ['"]\.\/(astro|insights|interpretation|chiron|house-systems|transit-timeline)['"]/g,"from './$1.mjs'");fs.writeFileSync(path.join(tmp,name+'.mjs'),code);}
const {calculate,mod,utcCandidates}=await import(pathToFileURL(path.join(tmp,'astro.mjs'))),{archetypes,placementReading,houseNumber}=await import(pathToFileURL(path.join(tmp,'interpretation.mjs'))),{dailyInsight}=await import(pathToFileURL(path.join(tmp,'insights.mjs')));
const reference=JSON.parse(fs.readFileSync('tests/fixtures/swiss-reference.json','utf8')),max={};
const distance=(a,b)=>Math.min(mod(a-b),mod(b-a));
for(const c of reference.cases){const chart=calculate(c.date,c.time,c.location,false,c.fold);assert.equal(chart.utc,c.utc,c.id+' UTC');for(const p of chart.planets.filter(p=>p.name!=='Chiron')){const error=distance(p.lon,c.planets[p.name]);assert.ok(error<=.02,`${c.id} ${p.name} discrepancy ${error}° exceeds 0.02°`);max[p.name]=Math.max(max[p.name]||0,error);}const error=distance(chart.asc,c.asc);assert.ok(error<=.01,`${c.id} asc discrepancy ${error}° exceeds 0.01°`);max.Ascendant=Math.max(max.Ascendant||0,error);
for(const [system,cusps] of [['Whole Sign',c.wholeSign],['Equal',c.equal]])for(let h=0;h<12;h++){const start=system==='Whole Sign'?Math.floor(chart.asc/30)*30:chart.asc;assert.ok(distance(start+h*30,cusps[h])<=.01,c.id+' '+system+' cusp');assert.equal(houseNumber(mod(cusps[h]+15),chart,system),h+1);}
}
assert.throws(()=>utcCandidates('2023-03-12','02:30','America/New_York'),/did not exist/);assert.equal(utcCandidates('2023-11-05','01:30','America/New_York').length,2);assert.throws(()=>calculate('2026-02-30','12:00',0),/valid calendar/);
const base=calculate('1995-10-24','08:30',0),unknown=calculate('1995-10-24','08:30',0,true);assert.equal(unknown.asc,0);assert.ok(unknown.moonWindow);assert.ok(archetypes(unknown).moon.includes('provisional'));assert.ok(!archetypes(unknown).sun.includes('house '));assert.ok(placementReading(base,'Saturn','Equal').body.includes('house '));assert.ok(placementReading(base,'Uranus').body.includes('generation'));
const transit={...base,planets:[{name:'Sun',glyph:'☉',lon:10}]},natalMoon={...base,planets:[{name:'Sun',glyph:'☉',lon:95},{name:'Moon',glyph:'☽',lon:10}]},natalMercury={...base,planets:[{name:'Sun',glyph:'☉',lon:95},{name:'Mercury',glyph:'☿',lon:10}]};
const m=dailyInsight(natalMoon,transit,'en'),m2=dailyInsight(natalMercury,transit,'en');assert.notEqual(m.body,m2.body);assert.notEqual(m.action,m2.action);assert.ok(m.basis.includes('natal Moon'));assert.ok(m2.basis.includes('natal Mercury'));assert.ok(!dailyInsight({...natalMoon,unknown:true},transit,'en').basis.includes('natal Moon'));assert.ok(dailyInsight(natalMoon,transit,'hi').body.includes('प्रतीकात्मक'));assert.deepEqual(m,dailyInsight(natalMoon,transit,'en'));
const report={reference:reference.engine,backend:reference.backend,charts:reference.cases.length,planetToleranceDegrees:.02,ascendantToleranceDegrees:.01,maxErrorsDegrees:Object.fromEntries(Object.entries(max).map(([k,v])=>[k,Number(v.toFixed(6))])),cases:reference.cases.map(c=>({id:c.id,utc:c.utc,latitude:c.location.lat,longitude:c.location.lon}))};
const reportFile='lib/calculation-validation.json';if(process.argv.includes('--write-report'))fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(reportFile,'utf8')),report,'Published accuracy evidence must match the regression suite');
console.log(`PASS: ${reference.cases.length} independent charts / ${reference.cases.length*11} planet comparisons / 240 house cusps; DST folds/gap, invalid dates, unknown-time handling; pair-specific, deterministic readings. Largest planet error ${Math.max(...Object.values(max).slice(0,11)).toFixed(6)}°.`);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
