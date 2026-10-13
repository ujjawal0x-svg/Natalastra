import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {createHash} from 'node:crypto';

// Only source-controlled application statements are callable by the backend RPC.
const statements={};
for(const dir of ['app/api','lib'])for(const file of fs.readdirSync(dir,{recursive:true}).filter(f=>f.endsWith('.ts'))){
 const source=ts.createSourceFile(file,fs.readFileSync(path.join(dir,file),'utf8'),ts.ScriptTarget.Latest,true);
 function visit(node){if(ts.isStringLiteralLike(node)){
  const text=node.text.trim().replace(/\s+/g,' ');
  if(/^(SELECT|INSERT|UPDATE|DELETE|WITH)\b/i.test(text)&&/\bnatal_\w+/.test(text)){
   let sql=text.replace(/INSERT OR IGNORE INTO/g,'INSERT INTO');
   if(text.startsWith('INSERT OR IGNORE'))sql+=' ON CONFLICT DO NOTHING';
   sql=sql.replace(/json_extract\(r.payload,'\$\.rating'\)/g,"(r.payload::jsonb ->> 'rating')")
    .replace(/julianday\(e.day\)-julianday\(f.first_day\)/g,'(e.day::date - f.first_day::date)')
    .replace(/date\('now','-(\d+) days'\)/g,(_,n)=>`to_char(CURRENT_DATE - INTERVAL '${n} days','YYYY-MM-DD')`)
    .replace(/MAX\(0,count - 1\)/g,'GREATEST(0,count - 1)')
    .replace(/(FROM|JOIN|INTO|UPDATE) (natal_\w+)/g,'$1 public.$2');
   // PostgreSQL requires target qualification for the UPSERT counter.
   if(sql.includes('ON CONFLICT(id) DO UPDATE SET count'))sql=sql.replace(/SET count = count \+ 1 WHERE count </g,'SET count = natal_service_usage.count + 1 WHERE natal_service_usage.count <');
   statements[text]={id:createHash('sha256').update(text).digest('hex'),sql,returns:/^(SELECT|WITH)\b/i.test(sql)||/\bRETURNING\b/.test(sql)};
  }
 }ts.forEachChild(node,visit);}visit(source);
}
fs.writeFileSync('lib/supabase-statements.json',JSON.stringify(statements,null,2)+'\n');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const cases=Object.values(statements).map(v=>`WHEN ${quote(v.id)} THEN ${quote(v.sql)}`).join('\n');
const returning=Object.values(statements).filter(v=>v.returns).map(v=>quote(v.id)).join(',');
const sql=`CREATE OR REPLACE FUNCTION public.natalastra_batch(commands jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' SET timezone = 'UTC' AS $body$
DECLARE cmd jsonb; template text; value jsonb; fragment text; row_value record; pieces text[]; binding_index integer; rows jsonb; results jsonb := '[]'; changes bigint; returns_rows boolean;
BEGIN
 IF jsonb_typeof(commands) <> 'array' OR jsonb_array_length(commands) < 1 OR jsonb_array_length(commands) > 20 OR octet_length(commands::text) > 250000 THEN RAISE EXCEPTION 'Invalid batch'; END IF;
 FOR cmd IN SELECT jsonb_array_elements(commands) LOOP
  template := CASE cmd->>'id' ${cases} ELSE NULL END;
  IF template IS NULL THEN RAISE EXCEPTION 'Unknown statement'; END IF;
  IF jsonb_typeof(cmd->'values') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid bindings'; END IF;
  pieces := string_to_array(template,'?');
  IF cardinality(pieces)-1 <> jsonb_array_length(cmd->'values') THEN RAISE EXCEPTION 'Binding count mismatch'; END IF;
  template := pieces[1]; binding_index := 1;
  FOR value IN SELECT jsonb_array_elements(cmd->'values') LOOP
   fragment := CASE jsonb_typeof(value) WHEN 'null' THEN 'NULL' WHEN 'number' THEN value::text WHEN 'string' THEN quote_literal(value #>> '{}') ELSE NULL END;
   IF fragment IS NULL THEN RAISE EXCEPTION 'Invalid binding type'; END IF;
   binding_index := binding_index + 1; template := template || fragment || pieces[binding_index];
  END LOOP;
  returns_rows := cmd->>'id' IN (${returning}); rows := '[]'; changes := 0;
  IF returns_rows THEN FOR row_value IN EXECUTE template LOOP rows := rows || jsonb_build_array(to_jsonb(row_value)); changes := changes + 1; END LOOP;
  ELSE EXECUTE template; GET DIAGNOSTICS changes = ROW_COUNT; END IF;
  results := results || jsonb_build_array(jsonb_build_object('success',true,'results',rows,'meta',jsonb_build_object('changes',changes)));
 END LOOP;
 RETURN results;
END $body$;
REVOKE ALL ON FUNCTION public.natalastra_batch(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.natalastra_batch(jsonb) TO service_role;
`;
fs.writeFileSync(process.argv[2]||'/tmp/natalastra-backend-rpc.sql',sql);
console.log(`${Object.keys(statements).length} application statements prepared.`);
