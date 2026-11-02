import {tmpdir} from 'node:os';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {isAbsolute,join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer} from 'node:net';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {Pool} from 'pg';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {featureRuntime} from '../feature-runtime.js';
import {profileRuntime} from '../profile-runtime.js';
import {nativePlan,nativeCases} from './native/plan.mjs';
const args=process.argv.slice(2),run=args.includes('--run');
if(!run){console.log(JSON.stringify(nativePlan(),null,2));process.exit(0);}
// No privilege workaround, no installation, no URL/credential from any environment.
if(typeof process.getuid!=='function'||process.getuid()===0)throw Error('NATIVE_REQUIRES_EXISTING_NON_ROOT_ENVIRONMENT');
if(args.some(a=>a.includes('postgres://')||a.includes('postgresql://')))throw Error('EXTERNAL_DATABASE_FORBIDDEN');
const value=key=>args[args.indexOf(key)+1],bin=value('--pg-bin'),out=value('--evidence');
if(!args.includes('--pg-bin')||!isAbsolute(bin??'')||!args.includes('--evidence')||!isAbsolute(out??''))throw Error('EXPLICIT_NATIVE_BIN_AND_NEW_EVIDENCE_DIR_REQUIRED');
await mkdir(out,{recursive:false,mode:0o700});
const root=await mkdtemp(join(tmpdir(),'mi-contacto-native-')),data=join(root,'pgdata'),pwfile=join(root,'password'),password=randomBytes(32).toString('hex');
await writeFile(pwfile,password,{mode:0o600});
const exec=promisify(execFile),results=[],env={PATH:process.env.PATH,LANG:'C',PGPASSWORD:password};
const command=async(name,argv)=>exec(join(resolve(bin),name),argv,{env,timeout:60000,maxBuffer:2*1024*1024});
let running=false;const pools=[];
const test=async(name,fn)=>{try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.message});throw e;}};
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
const config={host:'127.0.0.1',port,user:'mc_synthetic',password,ssl:false,application_name:'mi-contacto-native-synthetic',connectionTimeoutMillis:5000,max:12,options:'-c statement_timeout=10000 -c lock_timeout=5000'};
function pool(database){const p=new Pool({...config,database});pools.push(p);return p;}
const migrations=readdirSync(new URL('../db/',import.meta.url)).filter(n=>/^\d{3}_.*\.sql$/.test(n)).sort();
const sql=name=>readFileSync(new URL('../db/'+name,import.meta.url),'utf8');
async function migrate(p){for(const n of migrations)await p.query(sql(n));}
async function fingerprint(p){const tables=(await p.query("SELECT tablename FROM pg_tables WHERE schemaname='micontacto' ORDER BY tablename")).rows;const values=[];for(const {tablename}of tables){assert.match(tablename,/^[a-z_]+$/);values.push([tablename,(await p.query('SELECT to_jsonb(t) AS row FROM micontacto.'+tablename+' t ORDER BY to_jsonb(t)::text')).rows]);}return createHash('sha256').update(JSON.stringify(values)).digest('hex');}
try{
 await command('initdb',['-D',data,'--username=mc_synthetic','--pwfile='+pwfile,'--auth-local=trust','--auth-host=scram-sha-256','--encoding=UTF8','--no-locale']);
 running=true;await command('pg_ctl',['-D',data,'-l',join(out,'postgres.log'),'-o',`-h 127.0.0.1 -p ${port} -k ${root}`,'-w','start']);
 const control=pool('postgres');assert.equal((await control.query('SHOW data_directory')).rows[0].data_directory,data);
 for(const name of ['mi_contacto_disposable','mi_contacto_restore_disposable','mi_contacto_rollback_disposable'])await control.query('CREATE DATABASE '+name);
 const p=pool('mi_contacto_disposable');let at=Date.now()+60000;
 const account=randomUUID(),admin=randomUUID(),profile=randomUUID();
 await test(nativeCases[0],async()=>{
  await p.query('CREATE EXTENSION pgcrypto');assert.equal((await p.query("SELECT encode(digest('synthetic','sha256'),'hex') AS x")).rows[0].x.length,64);
  await p.query(sql(migrations[0]));await p.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[account,'synthetic-'+account]);
  await p.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code) VALUES($1,$2,'Perfil sintético','native-synthetic','PA')",[profile,account]);
  const before=(await p.query('SELECT to_jsonb(t) AS row FROM micontacto.profiles t')).rows[0].row;
  for(const name of migrations.slice(1))await p.query(sql(name));const after=(await p.query('SELECT to_jsonb(t) AS row FROM micontacto.profiles t')).rows[0].row;for(const k of Object.keys(before))assert.deepEqual(after[k],before[k]);
 });
 await p.query("INSERT INTO micontacto.accounts(id,google_subject,role) VALUES($1,$2,'ADMIN')",[admin,'synthetic-'+admin]);
 await p.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED',directory_consent=true WHERE id=$1",[profile]);
 // Deterministic test time only within our just-created database; no application test-clock option.
 await p.query('CREATE TABLE micontacto.synthetic_clock(at timestamptz NOT NULL)');await p.query('INSERT INTO micontacto.synthetic_clock VALUES($1)',[new Date(at)]);
 await p.query("CREATE OR REPLACE FUNCTION micontacto.feature_now() RETURNS timestamptz LANGUAGE sql VOLATILE AS $$ UPDATE micontacto.feature_clock SET high_water=greatest(high_water,(SELECT at FROM micontacto.synthetic_clock)) WHERE singleton RETURNING high_water $$");
 const advance=async ms=>{at+=ms;await p.query('UPDATE micontacto.synthetic_clock SET at=$1',[new Date(at)]);};
 const f=featureRuntime(p,{simulation:true}),profiles=profileRuntime(p,{features:f});let term;
 await test(nativeCases[1],async()=>{
  const a=await p.connect(),b=await p.connect();try{assert.notEqual((await a.query('SELECT pg_backend_pid() AS id')).rows[0].id,(await b.query('SELECT pg_backend_pid() AS id')).rows[0].id);}finally{a.release();b.release();}
  term=await f.prepare(account,profile,1);await Promise.all(Array.from({length:8},()=>f.activateSimulation(account,profile,term.id,'synthetic-native-confirmation')));
  assert.equal((await p.query("SELECT count(*)::int AS n FROM micontacto.feature_terms WHERE state='ACTIVE'")).rows[0].n,1);assert.equal((await p.query("SELECT count(*)::int AS n FROM micontacto.feature_events WHERE action='ACTIVATED_SIMULATION'")).rows[0].n,1);
 });
 await test(nativeCases[2],async()=>{
  await advance(43200000);await Promise.all(Array.from({length:8},()=>f.toggle(account,profile)));await advance(3*86400000);
  assert.equal(Number((await f.snapshot(profile)).terms.find(t=>t.id===term.id).remaining_ms),43200000);
  await Promise.all(Array.from({length:8},()=>f.toggle(account,profile,true)));await advance(123);await f.toggle(account,profile);assert.equal(Number((await f.snapshot(profile)).terms.find(t=>t.id===term.id).remaining_ms),43199877);
  await f.toggle(account,profile,true);await advance(43199877);assert.equal((await f.snapshot(profile)).terms.find(t=>t.id===term.id).state,'EXPIRED');
 });
 await test(nativeCases[3],async()=>{
  const next=await f.prepare(account,profile,5);await f.activateSimulation(account,profile,next.id,'synthetic-native-second');await f.toggle(account,profile);
  await Promise.allSettled([f.toggle(account,profile,true),profiles.moderate(admin,profile,{action:'BLOCK',reason:'Bloqueo sintético concurrente',version:1})]);
  assert.equal((await p.query('SELECT status FROM micontacto.profiles WHERE id=$1',[profile])).rows[0].status,'BLOCKED');await assert.rejects(f.toggle(account,profile,true),/PROFILE_LOCKED/);
  assert.equal((await f.snapshot(profile)).terms.find(t=>t.id===next.id).state,'PAUSED');
 });
 await test(nativeCases[4],async()=>{const before=await fingerprint(p),c=await p.connect();try{await c.query('BEGIN');await c.query("UPDATE micontacto.feature_terms SET remaining_ms=0 WHERE state='PAUSED'");await c.query('ROLLBACK');}finally{c.release();}assert.equal(await fingerprint(p),before);});
 await test(nativeCases[5],async()=>{
  const blocker=await p.connect();let waiting;try{
   await blocker.query('BEGIN');await blocker.query('SELECT micontacto.feature_now()');waiting=f.snapshot(profile);let observed=false;
   for(let i=0;i<60;i++){observed=(await p.query("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND pid<>pg_backend_pid()) AS waiting")).rows[0].waiting;if(observed)break;await new Promise(r=>setTimeout(r,20));}
   assert.equal(observed,true);await blocker.query('COMMIT');await waiting;
  }finally{await blocker.query('ROLLBACK');blocker.release();if(waiting)await waiting.catch(()=>{});}
 });
 await test(nativeCases[6],async()=>{
  const dump=join(out,'synthetic.dump'),before=await fingerprint(p);await command('pg_dump',['-h','127.0.0.1','-p',String(port),'-U','mc_synthetic','--format=custom','--no-owner','--no-acl','-f',dump,'mi_contacto_disposable']);
  await command('pg_restore',['-h','127.0.0.1','-p',String(port),'-U','mc_synthetic','--exit-on-error','--no-owner','--no-acl','-d','mi_contacto_restore_disposable',dump]);const restored=pool('mi_contacto_restore_disposable');assert.equal(await fingerprint(restored),before);
  assert.equal((await featureRuntime(restored).snapshot(profile)).terms.some(t=>t.state==='PAUSED'),true);
 });
 await test(nativeCases[7],async()=>{const clean=pool('mi_contacto_rollback_disposable');await migrate(clean);for(const n of ['rollback_009.sql','rollback_008.sql','rollback_007.sql'])await clean.query(sql(n));for(const n of migrations.filter(n=>/^00[789]_/.test(n)))await clean.query(sql(n));assert.ok((await clean.query("SELECT to_regclass('micontacto.removal_requests') AS t")).rows[0].t);});
 await test(nativeCases[8],async()=>{const before=await fingerprint(p);const closed=pools.splice(0);await Promise.all(closed.map(old=>old.end()));await command('pg_ctl',['-D',data,'-m','fast','-w','stop']);running=false;await command('pg_ctl',['-D',data,'-l',join(out,'postgres.log'),'-o',`-h 127.0.0.1 -p ${port} -k ${root}`,'-w','start']);running=true;assert.equal(await fingerprint(pool('mi_contacto_disposable')),before);});
}catch(e){if(!results.some(x=>x.status==='FAIL'))results.push({name:'native setup or dependent phase',status:'FAIL',error:e.message});process.exitCode=1;}
finally{
 for(const p of pools)await p.end();if(running)await command('pg_ctl',['-D',data,'-m','fast','-w','stop']).catch(()=>{process.exitCode=1;});
 // Keep failed cluster for diagnosis; success cleanup affects only mkdtemp-created synthetic files.
 if(!process.exitCode)await rm(root,{recursive:true,force:false});
 const summary={engine:'native PostgreSQL; owned disposable cluster',results,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,notExecuted:nativeCases.filter(name=>!results.some(x=>x.name===name)),realProfiles:0,externalConnections:0};await writeFile(join(out,'results.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
}
