import {migrateDatabase} from '../database.js';
import {loadCatalog} from './load-catalog.mjs';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {join} from 'node:path';
const exec=promisify(execFile);
export async function bootstrapAcceptance(pool,env){
 if(env.MC_ACCEPTANCE_MODE!=='true'||env.MC_DATABASE_ISOLATED!=='true'||!/^https:\/\/mi-contacto-[a-z0-9-]+\.up\.railway\.app$/.test(env.MC_ORIGIN??''))throw Error('EXPLICIT_ACCEPTANCE_BOOTSTRAP_REQUIRED');
 const root='/var/lib/mi-contacto',reportPath=join(root,'acceptance-status.json');await mkdir(root,{recursive:true,mode:0o700});
 const applied=await migrateDatabase(pool);
 const migrated=Number((await pool.query('SELECT count(*) AS n FROM micontacto.schema_migrations')).rows[0].n);if(migrated!==12)throw Error('MIGRATION_COUNT_MISMATCH');
 if(!(await pool.query('SELECT id FROM micontacto.catalog_sources LIMIT 1')).rows.length)await loadCatalog(pool);
 const id=env.MC_ACCEPTANCE_OWNER_ID;
 if(!/^[a-f0-9-]{36}$/.test(id??''))throw Error('ACCEPTANCE_OWNER_REQUIRED');
 await pool.query("INSERT INTO micontacto.accounts(id,google_subject,role) VALUES($1,$2,'ADMIN') ON CONFLICT DO NOTHING",[id,'acceptance-owner:'+id]);
 const owner=(await pool.query('SELECT google_subject,created_at FROM micontacto.accounts WHERE id=$1',[id])).rows[0];if(owner?.google_subject!=='acceptance-owner:'+id)throw Error('ACCEPTANCE_OWNER_CONFLICT');
 const fingerprint=createHash('sha256').update(owner.google_subject+owner.created_at.toISOString()).digest('hex');
 let previous=null;try{previous=JSON.parse(await readFile(reportPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(previous&&previous.persistenceFingerprint!==fingerprint)throw Error('PERSISTENCE_FINGERPRINT_MISMATCH');
 const ssl=(await pool.query('SELECT ssl,version,cipher FROM pg_stat_ssl WHERE pid=pg_backend_pid()')).rows[0];if(!ssl?.ssl)throw Error('VERIFIED_TLS_REQUIRED');
 let backup=previous?.backup??null;
 if(!backup){
  const folder=join(root,'backups');await mkdir(folder,{recursive:true,mode:0o700});const dump=join(folder,'acceptance-initial.dump'),ca=join(folder,'database-ca.crt');await writeFile(ca,env.MC_DATABASE_CA,{mode:0o600});
  const url=new URL(env.MC_DATABASE_URL),pgEnv={PATH:process.env.PATH,PGHOST:url.hostname,PGPORT:url.port||'5432',PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGDATABASE:url.pathname.slice(1),PGSSLMODE:'verify-full',PGSSLROOTCERT:ca};
  const run=(name,args)=>exec(name,args,{env:pgEnv,timeout:180000,maxBuffer:1024*1024});
  const restored='mc_restore_'+randomUUID().replaceAll('-','');
  await run('pg_dump',['--format=custom','--no-owner','--no-acl','--file',dump]);
  await run('createdb',['--maintenance-db='+pgEnv.PGDATABASE,restored]);
  try{
   await run('pg_restore',['--exit-on-error','--no-owner','--no-acl','--dbname='+restored,dump]);
   const {Pool}=await import('pg');const restoreUrl=new URL(env.MC_DATABASE_URL);restoreUrl.pathname='/'+restored;const check=new Pool({connectionString:restoreUrl.href,ssl:{rejectUnauthorized:true,ca:env.MC_DATABASE_CA},max:1});
   try{const restoredOwner=(await check.query('SELECT google_subject,created_at FROM micontacto.accounts WHERE id=$1',[id])).rows[0];if(createHash('sha256').update(restoredOwner.google_subject+restoredOwner.created_at.toISOString()).digest('hex')!==fingerprint)throw Error('RESTORE_FINGERPRINT_MISMATCH');
    const query='SELECT (SELECT count(*) FROM micontacto.geo_regions)::int AS regions,(SELECT count(*) FROM micontacto.geo_localities)::int AS localities,(SELECT count(*) FROM micontacto.schema_migrations)::int AS migrations';
    const original=(await pool.query(query)).rows[0],copy=(await check.query(query)).rows[0];if(JSON.stringify(original)!==JSON.stringify(copy))throw Error('RESTORE_COUNTS_MISMATCH');backup={createdAt:new Date().toISOString(),format:'pg_dump custom',restored:true,counts:copy};
   }finally{await check.end();}
  }finally{await run('dropdb',['--maintenance-db='+pgEnv.PGDATABASE,restored]);}
 }
 const report={bootedAt:new Date().toISOString(),processUid:process.getuid?.(),bootCount:(previous?.bootCount??0)+1,postgresVersion:(await pool.query('SHOW server_version')).rows[0].server_version,migrations:migrated,applied,verifiedTls:true,sslVersion:ssl.version,persistenceFingerprint:fingerprint,persistenceAfterRestart:!!previous,backup,googleConfigured:!!env.MC_GOOGLE_CLIENT_ID,r2Configured:env.MC_STORAGE==='r2',realPaymentsEnabled:false};
 const pending=reportPath+'.pending';await writeFile(pending,JSON.stringify(report,null,2),{mode:0o600});await rename(pending,reportPath);console.log('MC_ACCEPTANCE_CHECKS '+JSON.stringify(report));return report;
}
