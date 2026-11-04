import {yappySandbox} from '../yappy-sandbox.js';
import {createServer} from 'node:http';
import {createApplication} from '../application.js';
import {databasePool} from '../database.js';
import {localPhotoStorage} from '../photo-storage-local.js';
import {r2PhotoStorage} from '../photo-storage-r2.js';
const env=process.env;if(!env.MC_ORIGIN)throw Error('EXPLICIT_ORIGIN_REQUIRED');
const pool=databasePool();
// Migrations are an explicit, separate operation. Never auto-upgrade a live database.
const latest=(await pool.query("SELECT name FROM micontacto.schema_migrations WHERE name='012_sandbox_payments.sql'")).rows[0];if(!latest)throw Error('DATABASE_MIGRATIONS_REQUIRED');
const storage=env.MC_STORAGE==='r2'?r2PhotoStorage({accountId:env.MC_R2_ACCOUNT_ID,accessKeyId:env.MC_R2_ACCESS_KEY_ID,secretAccessKey:env.MC_R2_SECRET_ACCESS_KEY,bucket:env.MC_R2_BUCKET,isolated:env.MC_R2_ISOLATED==='true'}):env.MC_STORAGE==='local'?await localPhotoStorage({root:env.MC_PHOTO_ROOT,isolated:true,allowDeletion:true}):null;
if(!storage)throw Error('PERSISTENT_STORAGE_REQUIRED');
if(!env.MC_GOOGLE_CLIENT_ID||!env.MC_GOOGLE_CLIENT_SECRET)throw Error('GOOGLE_CONFIGURATION_REQUIRED');
const paymentProvider=env.MC_YAPPY_SANDBOX_ENABLED==='true'?yappySandbox({environment:'test',isolated:env.MC_YAPPY_ISOLATED==='true',merchantId:env.MC_YAPPY_MERCHANT_ID,domain:env.MC_ORIGIN,ipnUrl:env.MC_ORIGIN+'/api/payments/yappy/ipn',secret:env.MC_YAPPY_SECRET}):null;
const app=createApplication({pool,paymentProvider,secret:env.MC_SESSION_SECRET,origin:env.MC_ORIGIN,storage,google:{clientId:env.MC_GOOGLE_CLIENT_ID,clientSecret:env.MC_GOOGLE_CLIENT_SECRET}});
const server=createServer(async(req,res)=>{try{
 const chunks=[];let size=0;for await(const part of req){size+=part.length;if(size>6*1024*1024){res.writeHead(413);res.end();return;}chunks.push(part);}
 const response=await app.handle(new Request(env.MC_ORIGIN+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}));
 res.statusCode=response.status;for(const[k,v]of response.headers)if(k!=='set-cookie')res.setHeader(k,v);const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('set-cookie',cookies);res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(503,{'cache-control':'no-store'});res.end('Servicio no disponible');}
});
server.requestTimeout=20000;server.headersTimeout=10000;
server.listen(Number(env.PORT??3000),env.MC_BIND_HOST??'127.0.0.1',()=>console.log('Mi Contacto iniciado; persistencia PostgreSQL y almacenamiento configurados.'));
// Only queued, committed deletion work. Storage errors remain queued for retry.
const cleanup=setInterval(()=>app.erasure.cleanup().catch(()=>{}),60000);cleanup.unref();
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{clearInterval(cleanup);server.close(async()=>{await pool.end();process.exit(0);});setTimeout(()=>{server.closeAllConnections();},20000).unref();});
