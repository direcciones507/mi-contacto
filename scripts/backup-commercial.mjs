import {databaseConfig} from '../database.js';import {mkdtemp,writeFile,rm,readFile,realpath} from 'node:fs/promises';import {join,resolve,dirname} from 'node:path';import {tmpdir} from 'node:os';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {createHash} from 'node:crypto';
if(!process.argv.includes('--authorized-acceptance'))throw Error('EXPLICIT_ACCEPTANCE_BACKUP_REQUIRED');
const output=process.argv.find(v=>v.startsWith('--output='))?.slice(9);if(!output||!output.startsWith('/'))throw Error('ABSOLUTE_OUTPUT_REQUIRED');
const parent=await realpath(dirname(output)),repo=await realpath(new URL('..',import.meta.url));if(parent===repo||parent.startsWith(repo+'/'))throw Error('BACKUP_MUST_REMAIN_OUTSIDE_GIT');
const config=databaseConfig(),url=new URL(config.connectionString),tmp=await mkdtemp(join(tmpdir(),'mc-backup-ca-')),run=promisify(execFile);
try{const env={...process.env,PGHOST:url.hostname,PGPORT:url.port||'5432',PGDATABASE:decodeURIComponent(url.pathname.slice(1)),PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGSSLMODE:config.ssl?'verify-full':'disable'};
 if(config.ssl?.ca){const path=join(tmp,'ca.crt');await writeFile(path,config.ssl.ca,{mode:0o600});env.PGSSLROOTCERT=path;}
 await writeFile(output,'',{flag:'wx',mode:0o600});
 await run('pg_dump',['--format=custom','--no-owner','--no-acl','--file',resolve(output)],{env,timeout:120000,maxBuffer:1024*1024});
 await run('pg_restore',['--list',resolve(output)],{env,timeout:30000,maxBuffer:8*1024*1024});const digest=createHash('sha256').update(await readFile(output)).digest('hex');await writeFile(output+'.sha256',digest+'\n',{mode:0o600});console.log(JSON.stringify({backupCreated:true,archiveReadable:true,sha256:digest,liveRestorePerformed:false}));
}catch{throw Error('BACKUP_NOT_VERIFIED');}finally{await rm(tmp,{recursive:true,force:true});}
