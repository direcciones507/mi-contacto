import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID,randomBytes,createHash,createCipheriv,createDecipheriv} from 'node:crypto';
import assert from 'node:assert/strict';
import {codesRuntime} from '../codes-runtime.js';
const exec=promisify(execFile);
export const RESET_ID='owner-authorized-code-inventory-20261112';
const digest=b=>createHash('sha256').update(b).digest('hex');
export async function inventoryReset(pool,env=process.env){
 if(env.MC_CODES_RESET_APPROVED!==RESET_ID)return null;
 if(env.RAILWAY_PROJECT_ID!=='7d9a7fb0-df2f-487c-8885-d093e1a9c9de'||env.RAILWAY_SERVICE_ID!=='11c5eb89-00ce-4928-bd4e-e2ce0c50d22a'||env.MC_ORIGIN!=='https://micontacto.online')throw Error('CODE_RESET_IDENTITY_MISMATCH');
 const tx=await pool.connect();let file;
 try{
  await tx.query('BEGIN');await tx.query('SELECT pg_advisory_xact_lock(507016)');
  if((await tx.query('SELECT id FROM micontacto.code_inventory_resets WHERE id=$1',[RESET_ID])).rows.length){await tx.query('ROLLBACK');return {alreadyCompleted:true};}
  await tx.query('LOCK TABLE micontacto.commercial_codes, micontacto.code_events, micontacto.code_batches IN SHARE ROW EXCLUSIVE MODE');
  const counts=async()=>Object.fromEntries(await Promise.all(['accounts','profiles','feature_terms','code_events','code_batches','commercial_codes'].map(async t=>[t,(await tx.query('SELECT count(*)::int AS n FROM micontacto.'+t)).rows[0].n])));
  const before=await counts(),folder='/var/lib/mi-contacto/backups';await mkdir(folder,{recursive:true,mode:0o700});
  file=join(folder,'codes-reset-'+randomUUID()+'.dump');const ca=file+'.crt';await writeFile(ca,env.MC_DATABASE_CA??'',{mode:0o600});const u=new URL(env.MC_DATABASE_URL);
  const pgEnv={PATH:process.env.PATH,PGHOST:u.hostname,PGPORT:u.port||'5432',PGUSER:decodeURIComponent(u.username),PGPASSWORD:decodeURIComponent(u.password),PGDATABASE:u.pathname.slice(1),PGSSLMODE:'verify-full',PGSSLROOTCERT:ca};
  try{await exec('pg_dump',['--format=custom','--no-owner','--no-acl','--file',file],{env:pgEnv,timeout:180000,maxBuffer:1048576});await exec('pg_restore',['--list',file],{timeout:30000,maxBuffer:8*1048576});}finally{await unlink(ca).catch(()=>{});}
  const bytes=await readFile(file);assert.ok(bytes.length>0);const key=createHash('sha256').update('mc-inventory-backup:'+env.MC_SESSION_SECRET).digest(),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv),encrypted=Buffer.concat([iv,cipher.update(bytes),cipher.final(),cipher.getAuthTag()]);
  await writeFile(file+'.enc',encrypted,{mode:0o600});const saved=await readFile(file+'.enc'),dec=createDecipheriv('aes-256-gcm',key,saved.subarray(0,12));dec.setAuthTag(saved.subarray(-16));assert.equal(digest(Buffer.concat([dec.update(saved.subarray(12,-16)),dec.final()])),digest(bytes));await unlink(file);
  await tx.query("UPDATE micontacto.code_events SET reason=reason||' [Inventario reiniciado; código id: '||code_id::text||']',code_id=NULL WHERE code_id IS NOT NULL");
  const removed=(await tx.query('DELETE FROM micontacto.commercial_codes')).rowCount;
  const after=await counts();assert.equal(after.commercial_codes,0);for(const t of ['accounts','profiles','feature_terms','code_events','code_batches'])assert.equal(after[t],before[t]);
  const report={reset:RESET_ID,backup:{file:file+'.enc',bytes:bytes.length,sha256:digest(bytes),encryptedSha256:digest(saved),archiveReadable:true,decryptionVerified:true,keyDerivation:'SHA256(mc-inventory-backup: + MC_SESSION_SECRET)'},before,after,removed};
  await tx.query('INSERT INTO micontacto.code_inventory_resets(id,report) VALUES($1,$2)',[RESET_ID,JSON.stringify(report)]);await tx.query('COMMIT');
  console.info('MC_CODES_RESET '+JSON.stringify(report));
  const smoke=await inventorySmoke(pool,env.MC_SESSION_SECRET);console.info('MC_CODES_SMOKE '+JSON.stringify(smoke));return {...report,smoke};
 }catch(e){await tx.query('ROLLBACK').catch(()=>{});throw e;}finally{tx.release();}
}
/** Native live PostgreSQL probes: every temporary code/account/profile is rolled back. */
export async function inventorySmoke(pool,secret){
 const tx=await pool.connect();try{await tx.query('BEGIN');await tx.query('SELECT pg_advisory_xact_lock(507016)');
  const initial=(await tx.query('SELECT count(*)::int AS n FROM micontacto.commercial_codes')).rows[0].n;assert.equal(initial,0);
  const admin=(await tx.query("SELECT id FROM micontacto.accounts WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1")).rows[0]?.id;if(!admin)throw Error('CODE_SMOKE_ADMIN_REQUIRED');
  const facade={query:(...a)=>tx.query(...a),async connect(){const savepoint='probe_'+randomBytes(8).toString('hex');return {async query(q,v){if(q==='BEGIN')return tx.query('SAVEPOINT '+savepoint);if(q==='COMMIT')return tx.query('RELEASE SAVEPOINT '+savepoint);if(q==='ROLLBACK')return tx.query('ROLLBACK TO SAVEPOINT '+savepoint);return tx.query(q,v);},release(){}};}};
  const runtime=codesRuntime(facade,{secret}),batches=[];for(const quantity of [1,7,40,200]){const key=randomUUID(),b=await runtime.generate(admin,{quantity,key});assert.deepEqual(await runtime.generate(admin,{quantity,key}),b);const items=await runtime.list(admin,{isAdmin:true,batchId:b.batchId});assert.equal(items.length,quantity);batches.push({quantity,actual:items.length,idempotent:true});}
  const count=(await tx.query('SELECT count(*)::int AS n,count(DISTINCT token_hash)::int AS unique FROM micontacto.commercial_codes')).rows[0];assert.equal(count.n,248);assert.equal(count.unique,248);
  const c=(await runtime.list(admin,{isAdmin:true}))[0];await runtime.change(admin,c.id,{action:'RESERVE',reference:'Prueba técnica temporal'});await runtime.change(admin,c.id,{action:'GIFT',reference:'Prueba técnica temporal'});
  const account=randomUUID(),profile=randomUUID();await tx.query("INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)",[account,'code-smoke-'+account]);await tx.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code) VALUES($1,$2,'Prueba técnica temporal',$3,'PA')",[profile,account,'code-smoke-'+profile]);
  const redemption=await runtime.redeem(account,profile,{code:c.code});assert.equal(redemption.state,'PAUSED');assert.equal((await runtime.redeem(account,profile,{code:c.code})).replayed,true);
  await tx.query('ROLLBACK');assert.equal((await pool.query('SELECT count(*)::int AS n FROM micontacto.commercial_codes')).rows[0].n,0);
  return {initial:0,batches,unique:248,reservation:true,gift:true,redemption:true,redemptionIdempotent:true,temporaryRowsRolledBack:true,final:0};
 }catch(e){await tx.query('ROLLBACK');throw e;}finally{tx.release();}
}
