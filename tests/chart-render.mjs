import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import ts from 'typescript';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {pathToFileURL} from 'node:url';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'natalastra-wheel-'));
try{
 fs.symlinkSync(path.resolve('node_modules'),tmp+'/node_modules','dir');
 const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.React};
 for(const name of ['chiron','house-systems','transit-timeline','astro','wheel-layout'])fs.writeFileSync(tmp+'/'+name+'.mjs',ts.transpileModule(fs.readFileSync('lib/'+name+'.ts','utf8'),{compilerOptions:options}).outputText.replace(/from ['"]\.\/(chiron|house-systems|astro)['"]/g,"from './$1.mjs'"));
 const source=ts.createSourceFile('universe.tsx',fs.readFileSync('app/universe.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const wheel=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='Wheel');assert.ok(wheel);
 fs.writeFileSync(tmp+'/wheel.mjs',ts.transpileModule("import React from 'react';import {calculate,aspects,signs,glyphs,placement} from './astro.mjs';import {spreadLabels} from './wheel-layout.mjs';import {houseCusps} from './house-systems.mjs';export "+wheel.getText(source),{compilerOptions:options}).outputText);
 const {calculate,placement}=await import(pathToFileURL(tmp+'/astro.mjs')),{Wheel}=await import(pathToFileURL(tmp+'/wheel.mjs'));
 const a=calculate('1995-10-24','08:30',2),b=calculate('2000-04-12','16:05',2),time=calculate('1995-10-24','14:30',2);
 const render=chart=>renderToStaticMarkup(React.createElement(Wheel,{chart,selected:'Sun',setSelected:()=>{},system:'Whole Sign'}));
 const positions=svg=>[...svg.matchAll(/<circle[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"/g)].map(x=>[x[1],x[2]]);
 assert.notDeepEqual(a.planets,b.planets);assert.notEqual(placement(a.planets[0].lon),placement(b.planets[0].lon));assert.notDeepEqual(positions(render(a)),positions(render(b)),'actual Wheel coordinates must change');assert.notEqual(render(a),render(b));
 assert.notEqual(a.asc,time.asc);assert.notDeepEqual(positions(render(a)),positions(render(time)),'birth time changes Wheel rotation/positions');assert.equal(placement(a.planets[0].lon),placement(time.planets[0].lon),'same-date Sun sign can remain the same');
 assert.ok(render(a).includes(a.utc));assert.ok(render(b).includes(b.utc));assert.deepEqual(calculate('1995-10-24','08:30',2),a,'identical astronomical inputs should give identical charts');
 console.log(JSON.stringify({test:'Actual Wheel SSR geometry changes with date/time; same inputs deterministic',charts:[a,b,time].map(c=>({utc:c.utc,sun:placement(c.planets[0].lon),moon:placement(c.planets[1].lon),asc:placement(c.asc)}))}));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
