import statements from './supabase-statements.json';
type Binding=string|number|null;
type Result<T=Record<string,unknown>>={success:boolean;results:T[];meta:{changes:number}};
const registry=statements as Record<string,{id:string;sql:string;returns:boolean}>;

/** Server-only HTTPS transport. No credentials, payloads, or provider errors are logged. */
export class SupabaseStorage {
 constructor(private url:string,private secret:string){
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||!parsed.hostname.endsWith('.supabase.co')||parsed.username||parsed.password||parsed.pathname!=='/')throw new Error('Invalid database URL');
 }
 prepare(query:string){const key=query.trim().replace(/\s+/g,' '),statement=registry[key];if(!statement)throw new Error('Unknown database statement');return new SupabaseStatement(this,statement.id);}
 async batch<T=Record<string,unknown>>(items:SupabaseStatement[]):Promise<Result<T>[]>{
  if(items.some(item=>item.database!==this))throw new Error('Mixed database batch');
  const response=await fetch(new URL('/rest/v1/rpc/natalastra_batch',this.url),{method:'POST',headers:{apikey:this.secret,'Content-Type':'application/json'},body:JSON.stringify({commands:items.map(item=>({id:item.id,values:item.values}))}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`Database request failed (${response.status})`);
  const result=await response.json();if(!Array.isArray(result)||result.length!==items.length)throw new Error('Invalid database response');return result;
 }
}
export class SupabaseStatement {
 constructor(readonly database:SupabaseStorage,readonly id:string,readonly values:Binding[]=[]){ }
 bind(...values:Binding[]){if(values.some(v=>v!==null&&typeof v!=='string'&&(typeof v!=='number'||!Number.isFinite(v))))throw new Error('Invalid database binding');return new SupabaseStatement(this.database,this.id,values);}
 async all<T=Record<string,unknown>>(){return (await this.database.batch<T>([this]))[0];}
 async first<T=Record<string,unknown>>(column?:string):Promise<T|null>{const row=(await this.all<T>()).results[0];return row?(column?(row as Record<string,unknown>)[column] as T:row):null;}
 async run(){return this.all();}
}
