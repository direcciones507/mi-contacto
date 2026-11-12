import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,isAbsolute} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer} from 'node:net';
import {randomBytes} from 'node:crypto';
import {Pool} from 'pg';
import {migrateDatabase} from '../../database.js';
/** Owned disposable native cluster. No external DB URL/credentials accepted. */
export async function nativeTestDatabase({bin}={}){
 if(typeof process.getuid!=='function'||process.getuid()===0)throw Error('NATIVE_REQUIRES_EXISTING_NON_ROOT_ENVIRONMENT');
 if(!isAbsolute(bin??''))throw Error('EXPLICIT_NATIVE_BIN_REQUIRED');
 const root=await mkdtemp(join(tmpdir(),'mc-browser-native-')),data=join(root,'data'),pwfile=join(root,'password'),password=randomBytes(32).toString('hex');
 const exec=promisify(execFile);const command=(name,args)=>exec(join(bin,name),args,{timeout:60000,maxBuffer:2*1024*1024,env:{PATH:process.env.PATH,LANG:'C',PGPASSWORD:password}});
 await writeFile(pwfile,password,{mode:0o600});
 const socket=createServer();await new Promise((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.1',resolve);});const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
 let started=false,pool;const restoredPools=[];
 async function close(){await Promise.all(restoredPools.map(p=>p.end()));await pool?.end();if(started){await command('pg_ctl',['-D',data,'-m','fast','-w','stop']);started=false;}await rm(root,{recursive:true,force:false});}
 try{
  await command('initdb',['-D',data,'--username=mc_synthetic','--pwfile='+pwfile,'--auth-local=trust','--auth-host=scram-sha-256','--encoding=UTF8','--no-locale']);
  await command('pg_ctl',['-D',data,'-l',join(root,'postgres.log'),'-o',`-h 127.0.0.1 -p ${port} ${process.env.MC_TEST_DISABLE_UNIX_SOCKET==='true'?"-k ''":'-k '+root}`,'-w','start']);started=true;
  pool=new Pool({host:'127.0.0.1',port,user:'mc_synthetic',password,database:'postgres',max:12,connectionTimeoutMillis:5000,options:'-c statement_timeout=15000 -c lock_timeout=10000',application_name:'mi-contacto-browser-native'});
  const actual=(await pool.query('SHOW data_directory')).rows[0].data_directory;if(actual!==data)throw Error('DISPOSABLE_CLUSTER_IDENTITY_MISMATCH');
  pool.on('error',()=>{}); // Idle connections are discarded during the explicit test restart.
  pool.close=close;
  async function restart(){await command('pg_ctl',['-D',data,'-m','fast','-w','stop']);started=false;await command('pg_ctl',['-D',data,'-l',join(root,'postgres.log'),'-o',`-h 127.0.0.1 -p ${port} ${process.env.MC_TEST_DISABLE_UNIX_SOCKET==='true'?"-k ''":'-k '+root}`,'-w','start']);started=true;}
  async function restoredSnapshot(){
   const file=join(root,'synthetic.dump');await command('pg_dump',['-h','127.0.0.1','-p',String(port),'-U','mc_synthetic','--format=custom','--no-owner','--no-acl','-f',file,'postgres']);
   await command('pg_restore',['--list',file]);await pool.query('CREATE DATABASE mc_synthetic_restore');
   await command('pg_restore',['-h','127.0.0.1','-p',String(port),'-U','mc_synthetic','--exit-on-error','--no-owner','--no-acl','-d','mc_synthetic_restore',file]);
   const restored=new Pool({host:'127.0.0.1',port,user:'mc_synthetic',password,database:'mc_synthetic_restore',connectionTimeoutMillis:5000});restoredPools.push(restored);return restored;
  }
  return {pool,engine:'native PostgreSQL',restart,restoredSnapshot,migrate:()=>migrateDatabase(pool)};
 }catch(e){await close().catch(()=>{});throw e;}
}
