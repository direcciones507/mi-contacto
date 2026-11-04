import {validateApplicationOrigin} from '../platform-config.js';
import {legalConfig} from '../legal.js';
import {createServer} from 'node:http';
import {createApplication} from '../application.js';
import {databasePool,assertDatabaseReady} from '../database.js';
import {localPhotoStorage} from '../photo-storage-local.js';
import {r2PhotoStorage} from '../photo-storage-r2.js';
const env=process.env;if(!env.MC_ORIGIN)throw Error('EXPLICIT_ORIGIN_REQUIRED');
const origin=validateApplicationOrigin(env.MC_ORIGIN,{stage:env.MC_DEPLOYMENT_STAGE??'production'});
const legal=legalConfig(env,{requireApproval:env.MC_DEPLOYMENT_STAGE!=='staging'});
const pool=databasePool();
// Migrations are an explicit, separate operation. Never auto-upgrade a live database.
await assertDatabaseReady(pool);
const storage=env.MC_STORAGE==='r2'?r2PhotoStorage({accountId:env.MC_R2_ACCOUNT_ID,accessKeyId:env.MC_R2_ACCESS_KEY_ID,secretAccessKey:env.MC_R2_SECRET_ACCESS_KEY,bucket:env.MC_R2_BUCKET,isolated:env.MC_R2_ISOLATED==='true'}):env.MC_STORAGE==='local'?await localPhotoStorage({root:env.MC_PHOTO_ROOT,isolated:true,allowDeletion:true}):null;
if(!storage)throw Error('PERSISTENT_STORAGE_REQUIRED');
if(!env.MC_GOOGLE_CLIENT_ID||!env.MC_GOOGLE_CLIENT_SECRET)throw Error('GOOGLE_CONFIGURATION_REQUIRED');
const app=createApplication({pool,secret:env.MC_SESSION_SECRET,origin,deploymentStage:env.MC_DEPLOYMENT_STAGE,storage,legal,google:{clientId:env.MC_GOOGLE_CLIENT_ID,clientSecret:env.MC_GOOGLE_CLIENT_SECRET}});
const server=createServer(async(req,res)=>{try{
 const chunks=[];let size=0;for await(const part of req){size+=part.length;if(size>6*1024*1024){res.writeHead(413);res.end();return;}chunks.push(part);}
 const response=await app.handle(new Request(origin+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}));
 res.statusCode=response.status;for(const[k,v]of response.headers)if(k!=='set-cookie')res.setHeader(k,v);const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('set-cookie',cookies);res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(503,{'cache-control':'no-store'});res.end('Servicio no disponible');}
});
server.requestTimeout=20000;server.headersTimeout=10000;
server.listen(Number(env.PORT??3000),env.MC_BIND_HOST??(env.MC_ORIGIN.startsWith('https:')?'0.0.0.0':'127.0.0.1'),()=>console.log('Mi Contacto iniciado; persistencia PostgreSQL y almacenamiento configurados.'));
// Only queued, committed deletion work. Storage errors remain queued for retry.
const cleanup=setInterval(()=>app.erasure.cleanup().catch(()=>{}),60000);cleanup.unref();
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{clearInterval(cleanup);server.close(async()=>{await pool.end();process.exit(0);});setTimeout(()=>{server.closeAllConnections();},20000).unref();});
