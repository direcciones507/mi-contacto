import {databaseConfig,migrateDatabase} from './database.js';
import {Pool} from 'pg';
import {randomUUID,createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,isAbsolute} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {r2PhotoStorage} from './photo-storage-r2.js';
import {preparePhoto} from './photo-storage.js';
import {profileRuntime} from './profile-runtime.js';
const exec=promisify(execFile);
export function realVerificationInventory(env=process.env){
 const missing=keys=>keys.filter(k=>!env[k]);
 return {postgresql:missing(['MC_TEST_DATABASE_URL','MC_TEST_RESTORE_DATABASE_URL','MC_TEST_DATABASE_ISOLATED']),r2:missing(['MC_R2_ACCOUNT_ID','MC_R2_ACCESS_KEY_ID','MC_R2_SECRET_ACCESS_KEY','MC_R2_BUCKET','MC_R2_ISOLATED']),google:missing(['MC_GOOGLE_CLIENT_ID','MC_GOOGLE_CLIENT_SECRET'])};
}
export function isolatedNativeConfig(env=process.env){
 if(env.MC_TEST_DATABASE_ISOLATED!=='true')throw Error('EXCLUSIVE_TEST_DATABASES_CONFIRMATION_REQUIRED');
 if(!env.MC_TEST_DATABASE_URL||!env.MC_TEST_RESTORE_DATABASE_URL)throw Error('BOTH_TEST_DATABASE_URLS_REQUIRED');
 const urls=[env.MC_TEST_DATABASE_URL,env.MC_TEST_RESTORE_DATABASE_URL].map(value=>new URL(value));
 if(urls.some(u=>!/^\/mi_contacto_test_[a-z0-9_]+$/.test(u.pathname))||urls[0].href===urls[1].href||urls[0].hostname===urls[1].hostname&&urls[0].port===urls[1].port&&urls[0].pathname===urls[1].pathname)throw Error('DISTINCT_NAMED_TEST_DATABASES_REQUIRED');
 return urls.map(u=>databaseConfig({MC_DATABASE_ISOLATED:'true',MC_DATABASE_URL:u.href,MC_DATABASE_TLS:env.MC_TEST_DATABASE_TLS,MC_DATABASE_CA:env.MC_TEST_DATABASE_CA}));
}
async function fingerprint(pool){const names=(await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='micontacto' ORDER BY tablename")).rows;const rows=[];for(const {tablename}of names){assert.match(tablename,/^[a-z_]+$/);rows.push([tablename,(await pool.query('SELECT to_jsonb(t) AS data FROM micontacto.'+tablename+' t ORDER BY to_jsonb(t)::text')).rows]);}return createHash('sha256').update(JSON.stringify(rows)).digest('hex');}
async function empty(pool){const rows=(await pool.query("SELECT table_name FROM information_schema.tables WHERE table_type='BASE TABLE' AND table_schema NOT IN ('pg_catalog','information_schema')")).rows;if(rows.length)throw Error('TEST_DATABASE_NOT_EMPTY_NO_CHANGES_ALLOWED');}
export async function verifyNativeDatabases(env=process.env){
 const bin=env.MC_PG_BIN;if(bin&&!isAbsolute(bin))throw Error('ABSOLUTE_POSTGRES_BIN_REQUIRED');if(env.MC_PG_LIBRARY_PATH&&!isAbsolute(env.MC_PG_LIBRARY_PATH))throw Error('ABSOLUTE_POSTGRES_LIBRARY_PATH_REQUIRED');
 const configs=isolatedNativeConfig(env),pools=configs.map(c=>new Pool(c)),root=await mkdtemp(join(tmpdir(),'mc-native-verification-'));const poolsToClose=[...pools],checks=[];
 const command=async(name,args=[],index=0)=>{const url=new URL(configs[index].connectionString),childEnv={PATH:process.env.PATH,LANG:'C',PGHOST:url.hostname.replace(/^\[|\]$/g,''),PGPORT:url.port||'5432',PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGDATABASE:decodeURIComponent(url.pathname.slice(1)),PGSSLMODE:configs[index].ssl?'verify-full':'disable',PGCONNECT_TIMEOUT:'10'};if(env.MC_PG_LIBRARY_PATH)childEnv.LD_LIBRARY_PATH=env.MC_PG_LIBRARY_PATH;if(env.MC_TEST_DATABASE_CA){const ca=join(root,'ca.pem');await writeFile(ca,env.MC_TEST_DATABASE_CA,{mode:0o600});childEnv.PGSSLROOTCERT=ca;}return exec(bin?join(bin,name):name,args,{env:childEnv,timeout:60000,maxBuffer:1024*1024});};
 try{
  // Require client tools and both empty, dedicated databases before any writes.
  await command('pg_dump',['--version']);await command('pg_restore',['--version']);await Promise.all(pools.map(empty));
  const [source,restore]=pools;const version=(await source.query('SHOW server_version')).rows[0].server_version;
  const applied=await migrateDatabase(source);assert.ok(applied.includes('012_legal_consent.sql'));assert.deepEqual(await migrateDatabase(source),[]);checks.push('native migrations and idempotency');
  const account=randomUUID();await source.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[account,'synthetic-native-'+account]);
  const runtime=profileRuntime(source);const replies=await Promise.all(Array.from({length:10},(_,i)=>runtime.create(account,{country:i%2?'CR':'PA',linkName:'native-one-'+i,displayName:'Persona sintética nativa'})));assert.equal(replies.filter(r=>r.status===201).length,1);assert.equal(replies.filter(r=>r.status===409).length,9);checks.push('ten concurrent creates: one profile per account');
  const a=await source.connect(),b=await source.connect();try{assert.notEqual((await a.query('SELECT pg_backend_pid() AS pid')).rows[0].pid,(await b.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);}finally{a.release();b.release();}checks.push('distinct native backend connections');
  const before=await fingerprint(source);await assert.rejects(source.query('UPDATE micontacto.profiles SET region_id=-1 WHERE account_id=$1',[account]),e=>e.code==='23503');assert.equal(await fingerprint(source),before);checks.push('referential integrity rejects missing territory without data loss');const tx=await source.connect();try{await tx.query('BEGIN');await tx.query("UPDATE micontacto.profiles SET display_name='Cambio transaccional' WHERE account_id=$1",[account]);await tx.query('ROLLBACK');}finally{tx.release();}assert.equal(await fingerprint(source),before);checks.push('transaction rollback fingerprint');
  const reopen=new Pool(configs[0]);poolsToClose.push(reopen);assert.equal(await fingerprint(reopen),before);checks.push('new application pool preserves data');
  const file=join(root,'owned-synthetic.dump');await command('pg_dump',['--format=custom','--no-owner','--no-acl','--file',file]);await empty(restore);await command('pg_restore',['--exit-on-error','--no-owner','--no-acl','--dbname',new URL(configs[1].connectionString).pathname.slice(1),file],1);assert.equal(await fingerprint(restore),before);checks.push('pg_dump pg_restore full schema and row fingerprints');
  return {status:'PASS',engine:'native PostgreSQL',serverVersion:version,checks,passed:checks.length,failed:0,fixtureData:'synthetic only',databaseServerRestart:'NOT_EXECUTED; requires separate infrastructure authorization',backupRestored:true,productionApproval:false};
 }finally{for(const pool of poolsToClose)await pool.end();await rm(root,{recursive:true,force:true});}
}
export async function verifyRealR2(env=process.env){
 if(env.MC_R2_ISOLATED!=='true')throw Error('EXCLUSIVE_R2_CONFIRMATION_REQUIRED');
 const config={accountId:env.MC_R2_ACCOUNT_ID,accessKeyId:env.MC_R2_ACCESS_KEY_ID,secretAccessKey:env.MC_R2_SECRET_ACCESS_KEY,bucket:env.MC_R2_BUCKET,isolated:true},storage=r2PhotoStorage(config),key='mi-contacto/'+randomUUID()+'/'+randomUUID()+'.webp';let uploaded=false;
 try{const bytes=await preparePhoto(await sharp({create:{width:32,height:32,channels:3,background:'blue'}}).png().toBuffer(),'image/png');uploaded=true;await storage.put(key,bytes);assert.deepEqual(await storage.get(key),bytes);assert.deepEqual(await r2PhotoStorage(config).get(key),bytes);await storage.delete(key);uploaded=false;assert.equal(await storage.get(key),null);return {status:'PASS',engine:'Cloudflare R2 real S3 API',passed:4,failed:0,checks:['upload own synthetic object','byte comparison','new client persistence','delete own object and confirm absent'],bucketPublicDomains:'NOT_VERIFIED; review managed/custom public domains separately',applicationAuthorization:'verified separately by HTTP tests',productionApproval:false};}
 finally{if(uploaded)await storage.delete(key).catch(()=>{});}
}
export async function verifyRealServices({env=process.env,run=false}={}){
 const inventory=realVerificationInventory(env),result={checkedAt:new Date().toISOString(),productionReady:false,postgresql:{status:'BLOCKED',missing:inventory.postgresql},r2:{status:'BLOCKED',missing:inventory.r2},google:{status:'BLOCKED',missing:inventory.google,reason:'Real browser Google login/callback and owner consent are required; credentials alone are not verification.'}};
 for(const [name,fn]of [['postgresql',verifyNativeDatabases],['r2',verifyRealR2]]){if(inventory[name].length)continue;if(!run){result[name]={status:'NOT_EXECUTED',reason:'Use --run-isolated with dedicated empty resources; no writes made.'};continue;}try{result[name]=await fn(env);}catch(e){const safe=/^[A-Z][A-Z0-9_]+$/.test(e.message)?e.message:e.code==='ENOENT'?'POSTGRES_CLIENT_TOOLS_REQUIRED':e.code==='28P01'?'DATABASE_AUTHENTICATION_FAILED':e.code==='ECONNREFUSED'?'DATABASE_CONNECTION_REFUSED':'REAL_VERIFICATION_FAILED';result[name]={status:safe==='POSTGRES_CLIENT_TOOLS_REQUIRED'?'BLOCKED':'FAIL',reason:safe,failed:1};}}
 return result;
}
