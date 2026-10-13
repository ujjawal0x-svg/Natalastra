import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const encode=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const profile=encode(fs.readFileSync('lib/profile.ts','utf8').replace("'zod'",JSON.stringify(pathToFileURL(require.resolve('zod')).href)));
export const guestChartUrl=encode(fs.readFileSync('app/guest-chart.ts','utf8').replace("'../lib/profile'",JSON.stringify(profile)));
