import {codeReceiptWorker} from '../codes-runtime.js';
import {officialRequestPolicy} from '../official-origin.js';
import {migratingPhotoStorage} from '../storage-migration.js';
import {acceptanceWindow} from '../acceptance-window.js';
import {authEmailTransport} from '../auth-email-transport.js';
import {legalConfig} from '../legal.js';
import {bootstrapAcceptance} from './bootstrap-acceptance.mjs';
import {receiptWorker} from '../payment-runtime.js';
import {resendTestTransport} from '../receipt-resend.js';
import {yappySandbox} from '../yappy-sandbox.js';
import {createServer} from 'node:http';
import {createApplication} from '../application.js';
import {databasePool,assertDatabaseReady} from '../database.js';
import {localPhotoStorage} from '../photo-storage-local.js';
import {r2PhotoStorage} from '../photo-storage-r2.js';
const env=process.env;const window=acceptanceWindow(env);if(window)console.info('MC_ACCEPTANCE_WINDOW '+JSON.stringify(window));if(!env.MC_ORIGIN)throw Error('EXPLICIT_ORIGIN_REQUIRED');
const legal=legalConfig(env,{requireApproval:env.MC_ACCEPTANCE_MODE!=='true'});
const pool=databasePool();
// Migrations are an explicit, separate operation. Never auto-upgrade a live database.
const acceptanceReport=env.MC_ACCEPTANCE_BOOTSTRAP==='true'?await bootstrapAcceptance(pool,env):null;
const latest=(await pool.query("SELECT name FROM micontacto.schema_migrations WHERE name='013_legal_consent.sql'")).rows[0];if(!latest)throw Error('DATABASE_MIGRATIONS_REQUIRED');
await assertDatabaseReady(pool);
let storage=env.MC_STORAGE==='r2'?r2PhotoStorage({accountId:env.MC_R2_ACCOUNT_ID,accessKeyId:env.MC_R2_ACCESS_KEY_ID,secretAccessKey:env.MC_R2_SECRET_ACCESS_KEY,bucket:env.MC_R2_BUCKET,reuseExistingBucket:env.MC_R2_REUSE_DIRECCIONES_BUCKET==='true',isolated:env.MC_R2_ISOLATED==='true'}):env.MC_STORAGE==='local'?await localPhotoStorage({root:env.MC_PHOTO_ROOT,isolated:true,allowDeletion:true}):null;
if(!storage)throw Error('PERSISTENT_STORAGE_REQUIRED');
if(env.MC_STORAGE==='r2'&&env.MC_R2_MIGRATE_LOCAL==='true'){if(!env.MC_PHOTO_ROOT)throw Error('EXISTING_PHOTO_ROOT_REQUIRED');storage=migratingPhotoStorage(storage,await localPhotoStorage({root:env.MC_PHOTO_ROOT,isolated:true,allowDeletion:true}));}
const google=env.MC_GOOGLE_CLIENT_ID&&env.MC_GOOGLE_CLIENT_SECRET?{clientId:env.MC_GOOGLE_CLIENT_ID,clientSecret:env.MC_GOOGLE_CLIENT_SECRET}:null;
const emailTransport=authEmailTransport(env);
if(!google&&!emailTransport&&env.MC_ACCEPTANCE_MODE!=='true')throw Error('AUTH_CONFIGURATION_REQUIRED');
if(!!env.MC_GOOGLE_CLIENT_ID!==!!env.MC_GOOGLE_CLIENT_SECRET)throw Error('GOOGLE_CONFIGURATION_INCOMPLETE');
const paymentProvider=env.MC_YAPPY_SANDBOX_ENABLED==='true'?yappySandbox({environment:'test',isolated:env.MC_YAPPY_ISOLATED==='true',merchantId:env.MC_YAPPY_MERCHANT_ID,domain:env.MC_ORIGIN,ipnUrl:env.MC_ORIGIN+'/api/payments/yappy/ipn',secret:env.MC_YAPPY_SECRET}):null;
const app=createApplication({emailTransport,accessEvent:event=>console.info('MC_PRIVATE_ACCESS '+JSON.stringify(event)),pool,paymentProvider,acceptanceReport,legal,acceptanceOwner:env.MC_ACCEPTANCE_OWNER_CODE_HASH?{accountId:env.MC_ACCEPTANCE_OWNER_ID,codeHash:env.MC_ACCEPTANCE_OWNER_CODE_HASH,expiresAt:Date.parse(env.MC_ACCEPTANCE_EXPIRES_AT)}:null,acceptance:env.MC_ACCEPTANCE_MODE==='true',privateOfficialOrigin:env.MC_PRIVATE_OFFICIAL_ORIGIN==='true',secret:env.MC_SESSION_SECRET,origin:env.MC_ORIGIN,storage,google});
const receiptTransport=env.MC_EMAIL_TEST_ENABLED==='true'?resendTestTransport({apiKey:env.MC_RESEND_API_KEY,from:env.MC_EMAIL_FROM,allowedRecipients:(env.MC_EMAIL_TEST_RECIPIENTS??'').split(',').map(x=>x.trim()).filter(Boolean),isolated:env.MC_EMAIL_ISOLATED==='true',enabled:true,reuseExistingSender:env.MC_REUSE_DIRECCIONES_EMAIL==='true'}):null;
const deliverCodeReceipt=receiptTransport?codeReceiptWorker(pool,receiptTransport):null;
const deliverReceipt=env.MC_EMAIL_TEST_ENABLED==='true'?receiptWorker(pool,resendTestTransport({apiKey:env.MC_RESEND_API_KEY,from:env.MC_EMAIL_FROM,allowedRecipients:(env.MC_EMAIL_TEST_RECIPIENTS??'').split(',').map(x=>x.trim()).filter(Boolean),isolated:env.MC_EMAIL_ISOLATED==='true',enabled:true,reuseExistingSender:env.MC_REUSE_DIRECCIONES_EMAIL==='true'})):null;
const server=createServer(async(req,res)=>{try{
 const policy=officialRequestPolicy({host:req.headers.host,method:req.method,url:req.url},env.MC_ORIGIN);if(policy){res.statusCode=policy.status;for(const[k,v]of policy.headers)res.setHeader(k,v);res.end(Buffer.from(await policy.arrayBuffer()));return;}
 if(env.MC_ORIGIN==='https://micontacto.online')res.setHeader('strict-transport-security','max-age=86400');
 const chunks=[];let size=0;for await(const part of req){size+=part.length;if(size>6*1024*1024){res.writeHead(413);res.end();return;}chunks.push(part);}
 const response=await app.handle(new Request(env.MC_ORIGIN+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}));
 res.statusCode=response.status;for(const[k,v]of response.headers)if(k!=='set-cookie')res.setHeader(k,v);const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('set-cookie',cookies);res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(503,{'cache-control':'no-store'});res.end('Servicio no disponible');}
});
server.requestTimeout=20000;server.headersTimeout=10000;
server.listen(Number(env.PORT??3000),env.MC_BIND_HOST??'127.0.0.1',()=>console.log('Mi Contacto iniciado; persistencia PostgreSQL y almacenamiento configurados.'));
// Only queued, committed deletion work. Storage errors remain queued for retry.
let sending=false;
const receipts=deliverReceipt?setInterval(async()=>{if(sending)return;sending=true;try{await deliverReceipt();await deliverCodeReceipt();}catch{console.error('MC_RECEIPT_WORKER_UNAVAILABLE');}finally{sending=false;}},30000):null;
receipts?.unref();
const cleanup=setInterval(()=>app.erasure.cleanup().catch(()=>{}),60000);cleanup.unref();
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{clearInterval(cleanup);if(receipts)clearInterval(receipts);server.close(async()=>{await pool.end();process.exit(0);});setTimeout(()=>{server.closeAllConnections();},20000).unref();});

// Explicit bounded acceptance window; do not extend paid compute automatically.
if(env.MC_ACCEPTANCE_MODE==='true'&&env.MC_ACCEPTANCE_STOP_AT){
 const stopAt=Date.parse(env.MC_ACCEPTANCE_STOP_AT);if(!Number.isFinite(stopAt))throw Error('INVALID_ACCEPTANCE_STOP_AT');
 const timer=setTimeout(()=>{console.log('MC_ACCEPTANCE_WINDOW_ENDED');process.emit('SIGTERM');},Math.max(1,stopAt-Date.now()));timer.unref();
}
