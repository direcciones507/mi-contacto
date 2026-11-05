import {mkdir,writeFile,chmod,stat,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID,createHash} from 'node:crypto';
const exec=promisify(execFile);
/** Existing exclusive acceptance resources only. No restore, drop, new DB or resource. */
export async function protectUnificationMigration(pool,env,root){
 const exists=(await pool.query("SELECT to_regclass('micontacto.schema_migrations') AS ledger")).rows[0].ledger;if(!exists)return null;
 if((await pool.query("SELECT name FROM micontacto.schema_migrations WHERE name='014_protection_moderation.sql'")).rows.length)return null;
 const previous=JSON.parse(await readFile(join(root,'acceptance-status.json'),'utf8'));if(previous.backup?.restored!==true)throw Error('EXISTING_ACCEPTANCE_BACKUP_REPORT_REQUIRED');
 const folder=join(root,'backups');await mkdir(folder,{recursive:true,mode:0o700});const basename='pre-unification-'+randomUUID()+'.dump',file=join(folder,basename),ca=join(folder,'unification-ca.crt');await writeFile(ca,env.MC_DATABASE_CA,{mode:0o600});
 const url=new URL(env.MC_DATABASE_URL),pgEnv={PATH:process.env.PATH,PGHOST:url.hostname,PGPORT:url.port||'5432',PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGDATABASE:url.pathname.slice(1),PGSSLMODE:'verify-full',PGSSLROOTCERT:ca};
 await exec('pg_dump',['--format=custom','--no-owner','--no-acl','--file',file],{env:pgEnv,timeout:180000,maxBuffer:1024*1024});await chmod(file,0o600);const size=(await stat(file)).size;if(!size)throw Error('EMPTY_PRE_MIGRATION_BACKUP');await exec('pg_restore',['--list',file],{env:pgEnv,timeout:30000,maxBuffer:4*1024*1024});
 const result={createdAt:new Date().toISOString(),basename,bytes:size,sha256:createHash('sha256').update(await readFile(file)).digest('hex'),archiveReadable:true,restoreExecuted:false};await writeFile(join(folder,'unification-protection.json'),JSON.stringify(result,null,2),{mode:0o600});return result;
}
