import {Pool} from 'pg';
import {readdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export function databaseConfig(env=process.env){
 if(env.MC_DATABASE_ISOLATED!=='true'||!env.MC_DATABASE_URL)throw Error('DEDICATED_DATABASE_CONFIRMATION_REQUIRED');
 let url;try{url=new URL(env.MC_DATABASE_URL);}catch{throw Error('INVALID_DATABASE_URL');}if(!['postgres:','postgresql:'].includes(url.protocol))throw Error('INVALID_DATABASE_URL');
 const loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(!loopback&&env.MC_DATABASE_TLS!=='true')throw Error('DATABASE_TLS_REQUIRED');
 // Never permit connection-string options to disable certificate verification.
 url.search='';
 return {connectionString:url.href,ssl:loopback?false:{rejectUnauthorized:true,...(env.MC_DATABASE_CA?{ca:env.MC_DATABASE_CA}:{})},max:10,connectionTimeoutMillis:10000,options:'-c statement_timeout=15000 -c lock_timeout=10000',application_name:'mi-contacto'};
}
export const databasePool=(env=process.env)=>new Pool(databaseConfig(env));
export async function migrateDatabase(pool){
 const tx=await pool.connect();try{
  await tx.query("SELECT pg_advisory_lock(5072026)");
  const exists=(await tx.query("SELECT to_regclass('micontacto.schema_migrations') AS ledger,to_regclass('micontacto.profiles') AS profiles")).rows[0];
  if(exists.profiles&&!exists.ledger)throw Error('EXISTING_DATABASE_REQUIRES_REVIEWED_BASELINE');
  await tx.query('CREATE SCHEMA IF NOT EXISTS micontacto');
  await tx.query('CREATE TABLE IF NOT EXISTS micontacto.schema_migrations(name text PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
  const applied=[];
  for(const name of (await readdir(new URL('./db/',import.meta.url))).filter(n=>/^\d{3}_.*\.sql$/.test(n)).sort()){
   const sql=await readFile(new URL('./db/'+name,import.meta.url),'utf8'),sha=createHash('sha256').update(sql).digest('hex');
   const old=(await tx.query('SELECT sha256 FROM micontacto.schema_migrations WHERE name=$1',[name])).rows[0];
   if(old){if(old.sha256!==sha)throw Error('MIGRATION_CHECKSUM_MISMATCH');continue;}
   await tx.query('BEGIN');try{await tx.query(sql.replace(/^BEGIN;\s*|\s*COMMIT;\s*$/gmi,''));await tx.query('INSERT INTO micontacto.schema_migrations(name,sha256) VALUES($1,$2)',[name,sha]);await tx.query('COMMIT');applied.push(name);}catch(e){await tx.query('ROLLBACK');throw e;}
  }return applied;
 }finally{await tx.query('SELECT pg_advisory_unlock(5072026)').catch(()=>{});tx.release();}
}

/** Read-only startup gate: never start a newer/older runtime against an unverified schema. */
export async function assertDatabaseReady(pool){
 const expected=new Map();for(const name of (await readdir(new URL('./db/',import.meta.url))).filter(n=>/^\d{3}_.*\.sql$/.test(n)).sort()){const bytes=await readFile(new URL('./db/'+name,import.meta.url));expected.set(name,createHash('sha256').update(bytes).digest('hex'));}
 let rows;try{rows=(await pool.query('SELECT name,sha256 FROM micontacto.schema_migrations')).rows;}catch{throw Error('DATABASE_MIGRATIONS_REQUIRED');}
 if(rows.length!==expected.size)throw Error('DATABASE_MIGRATIONS_REQUIRED');for(const row of rows)if(expected.get(row.name)!==row.sha256)throw Error('MIGRATION_CHECKSUM_MISMATCH');return {migrations:expected.size};
}
