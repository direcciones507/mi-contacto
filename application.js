import {emailAuth} from './email-auth.js';
import {authPage} from './email-auth-view.js';
import {publicPhoto} from './watermark.js';
import {moderationRuntime} from './moderation.js';
import {protectionGate} from './protection-gate.js';
import {policyDigest} from './legal.js';
import {reportPage} from './report-view.js';
import {legalPage,legalConfig,consentRuntime} from './legal.js';
import {territoryDisplayName} from './territory-corrections.js';
import {acceptanceAccess} from './acceptance-access.js';
import {sandboxPaymentPage} from './payment-view.js';
import {paymentRuntime} from './payment-runtime.js';
import {erasureRuntime} from './erasure.js';
import {randomUUID,randomBytes,createHmac,timingSafeEqual} from 'node:crypto';
import {readFileSync} from 'node:fs';
import QRCode from 'qrcode';
import {createAuth} from './auth-runtime.js';
import {profileRuntime,transaction} from './profile-runtime.js';
import {photoRuntime} from './photo-runtime.js';
import {memoryPhotoStorage,MAX_PHOTO_BYTES} from './photo-storage.js';
import {directoryQuery} from './directory-query.js';
import {slugLookupPostgres,checkSlugAvailability} from './slug-availability.js';
import {privacyRuntime} from './privacy-runtime.js';
import {featureRuntime,featureExistsSQL} from './feature-runtime.js';
import {featureQuote} from './feature-policy.js';
import {COUNTRIES} from './countries.js';
import {dashboard,publicProfile,layout} from './views.js';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function createApplication({pool,secret,origin='https://micontacto.online',google=null,emailTransport=null,fetch:network,verifyToken,storage=memoryPhotoStorage(),simulation=false,legal=legalConfig({}),paymentProvider=null,acceptance=false,privateOfficialOrigin=false,acceptanceOwner=null,acceptanceReport=null,accessEvent=()=>{},now=()=>Date.now()}){
 const features=featureRuntime(pool,{simulation});
 if(paymentProvider&&paymentProvider.domain!==origin)throw Error('INVALID_PAYMENT_CONFIGURATION');
 const payments=paymentRuntime(pool,{provider:paymentProvider});
 const auth=createAuth(pool,{secret,origin,google,fetch:network,verifyToken,acceptance,acceptanceOwner,now}),profiles=profileRuntime(pool,{now,features,origin}),photos=photoRuntime(pool,profiles,storage,{now});
 const emailAccess=emailAuth(pool,auth,{origin,secret,transport:emailTransport,now});
 const privateAccess=acceptanceAccess(pool,auth,{secret,origin,acceptance,privateOfficialOrigin,config:acceptanceOwner,onEvent:accessEvent,now});
 const privacy=privacyRuntime(pool,profiles),erasure=erasureRuntime(pool,storage);
 const consent=consentRuntime(pool,legal),moderation=moderationRuntime(pool,profiles),gate=protectionGate({secret,origin,digest:policyDigest(legal),now});
 const reportMac=value=>createHmac('sha256',secret).update('report:'+value).digest('base64url');
 const reportCookie=req=>(req.headers.get('cookie')??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('mc_report='))?.slice(10)??'';
 const rates=new Map();
 const readRates=new Map();
 function allowRead(key,max){const minute=Math.floor(now()/60000);for(const[k,v]of readRates)if(v.minute!==minute)readRates.delete(k);const count=(readRates.get(key)?.count??0)+1;if(count>max||!readRates.has(key)&&readRates.size>=4096)return false;readRates.set(key,{minute,count});return true;}
 const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow','content-security-policy':"default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"};
 if(new URL(origin).protocol==='https:')headers['strict-transport-security']='max-age=31536000';
 const json=(status,body)=>Response.json(body,{status,headers});
 const html=body=>new Response(body,{headers:{...headers,'content-type':'text/html; charset=utf-8'}});
 const allowedAssets={'/email-auth-client.js':'text/javascript','/protection-policy.js':'text/javascript','/report-client.js':'text/javascript','/payment-client.js':'text/javascript','/styles.css':'text/css','/runtime.css':'text/css','/app.js':'text/javascript','/directory-client.js':'text/javascript','/countries.js':'text/javascript','/dashboard.js':'text/javascript','/feature-policy.js':'text/javascript','/public-profile.js':'text/javascript'};
 async function publicRow(country,slug){return (await pool.query("SELECT p.* FROM micontacto.profiles p JOIN micontacto.accounts a ON a.id=p.account_id JOIN micontacto.country_settings cs ON cs.code=p.country_code AND cs.enabled WHERE p.url_country=$1 AND p.slug=$2 AND NOT p.privacy_hidden AND NOT p.moderation_restricted AND p.status='ACTIVE' AND p.review_decision='APPROVED' AND a.status='ACTIVE'",[country,slug])).rows[0]??null;}
 async function bytes(req,limit){if(Number(req.headers.get('content-length'))>limit)throw Error('PAYLOAD_TOO_LARGE');const chunks=[];let n=0;const reader=req.body?.getReader();if(!reader)return Buffer.alloc(0);try{while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>limit){await reader.cancel();throw Error('PAYLOAD_TOO_LARGE');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}return Buffer.concat(chunks);}
 async function body(req){if(!req.headers.get('content-type')?.startsWith('application/json'))throw Error('JSON_REQUIRED');try{const data=JSON.parse((await bytes(req,16384)).toString());if(!data||typeof data!=='object'||Array.isArray(data))throw Error('INVALID_JSON');return data;}catch(e){if(e.message==='PAYLOAD_TOO_LARGE')throw e;throw Error('INVALID_JSON');}}
 async function handle(req){
  const url=new URL(req.url),path=url.pathname;
  try{
   if(req.method==='GET'&&path==='/health/live')return json(200,{status:'alive'});
   if(req.method==='GET'&&path==='/health/ready'){await pool.query('SELECT 1 AS healthy');return json(200,{status:'ready'});}
   if(path.startsWith('/auth/google')&&!allowRead('oauth',120))return json(429,{error:'RATE_LIMITED'});
   if(req.method==='GET'&&['/api/countries','/api/categories','/api/regions','/api/localities','/api/directory'].includes(path)&&!allowRead('directory',2000))return json(429,{error:'RATE_LIMITED'});
   if(path==='/api/payments/yappy/ipn'&&!allowRead('payment-ipn',600))return json(429,{error:'RATE_LIMITED'});
   if(path==='/api/payments/yappy/ipn'&&req.method==='GET')return json(200,await payments.confirm(url.searchParams));
   const gateReply=await gate.handle(req);if(gateReply)return secure(gateReply);
   if(legal.enforce&&path.startsWith('/auth/google')&&!gate.accepted(req)){
    const existing=await auth.current(req);if(!existing||!await consent.accepted(existing.id))return secure(new Response(null,{status:303,headers:{location:'/aviso'}}));
   }
   const accessReply=await privateAccess.handle(req);if(accessReply)return secure(accessReply,true);
   if(path==='/api/auth-options'&&req.method==='GET')return json(200,{emailEnabled:emailAccess.enabled,googleEnabled:!!google?.clientId&&!!google?.clientSecret,acceptanceLoginEnabled:privateAccess.enabled()});
   const emailReply=await emailAccess.handle(req);if(emailReply)return secure(emailReply);
   if(req.method==='GET'&&path==='/acceso')return html(authPage());
   const authReply=await auth.handle(req);if(authReply){
    if(path==='/auth/google/callback'&&authReply.status>=400&&req.headers.get('accept')?.includes('text/html')){
     const error=(await authReply.clone().json()).error;const messages={OAUTH_CANCELLED:'Cancelaste el acceso con Google. Puedes volver a intentarlo.',INVALID_OAUTH_STATE:'La solicitud venció o corresponde a otro navegador. Inicia el acceso nuevamente.',ACCOUNT_SUSPENDED:'El acceso a esta cuenta está restringido. Solicita revisión a administración.'};
     const content='<p role="alert">'+(messages[error]??'No se pudo verificar el acceso con Google. Vuelve a intentarlo en unos minutos.')+'</p><a class="btn btn-primary" href="/mi-perfil">Volver a Mi perfil</a>';const h=new Headers(authReply.headers);h.set('content-type','text/html; charset=utf-8');h.set('vary','Accept');return secure(new Response(layout('Acceso no completado',content,{script:null}),{status:authReply.status,headers:h}));
    }if(legal.enforce&&path==='/auth/google/callback'&&authReply.status===302&&gate.accepted(req)){const token=authReply.headers.getSetCookie().find(x=>x.startsWith('mc_session='))?.split(';')[0];if(token){const account=await auth.current(new Request(origin+'/api/session',{headers:{cookie:token}}));if(account)await consent.accept(account.id,{acceptTerms:true,acceptPrivacy:true,adult:true,version:legal.version,policyDigest:policyDigest(legal)});}}return secure(authReply);
   }
   if(req.method==='GET'&&Object.hasOwn(allowedAssets,path))return new Response(readFileSync(new URL('.'+path,import.meta.url)),{headers:{...headers,'content-type':allowedAssets[path]}});
   if(req.method==='GET'&&path==='/')return html(readFileSync(new URL('./index.html',import.meta.url),'utf8'));
   if(req.method==='GET'&&path==='/api/legal')return json(200,consent.publicInfo);
   if(req.method==='GET'&&['/privacidad','/terminos','/comunidad'].includes(path))return html(legalPage(path==='/privacidad'?'privacy':path==='/comunidad'?'community':'terms',legal));
   if(req.method==='GET'&&path==='/mi-perfil')return html(dashboard(false));
   if(req.method==='GET'&&path==='/admin')return html(dashboard(true));
   if(req.method==='GET'&&path==='/robots.txt')return new Response('User-agent: *\nDisallow: /api/\nDisallow: /media/\nDisallow: /admin\nDisallow: /mi-perfil\nSitemap: https://micontacto.online/sitemap.xml\n',{headers:{...headers,'content-type':'text/plain'}});
   if(req.method==='GET'&&path==='/sitemap.xml')return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://micontacto.online/</loc></url></urlset>',{headers:{...headers,'content-type':'application/xml'}});
   if(req.method==='GET'&&path==='/api/countries'){const enabled=(await pool.query('SELECT code FROM micontacto.country_settings WHERE enabled')).rows.map(x=>x.code);return json(200,{items:COUNTRIES.filter(x=>enabled.includes(x.code))});}
   if(req.method==='GET'&&path==='/api/categories')return json(200,{items:(await pool.query('SELECT id,name FROM micontacto.categories WHERE enabled ORDER BY name')).rows});
   if(req.method==='GET'&&path==='/api/regions'){
    const country=url.searchParams.get('country');if(!COUNTRIES.some(x=>x.code===country))throw Error('INVALID_COUNTRY');const parent=url.searchParams.get('parentId');if(parent&&!/^\d+$/.test(parent))throw Error('INVALID_LOCATION_ID');
    return json(200,{items:(await pool.query('SELECT id,name,parent_id,admin_level FROM micontacto.geo_regions WHERE country_code=$1 AND enabled AND '+(parent?'parent_id=$2':'parent_id IS NULL')+' ORDER BY name',parent?[country,parent]:[country])).rows.map(r=>({...r,name:territoryDisplayName(r.name)})),reviewRequired:true});
   }
   if(req.method==='GET'&&path==='/api/localities'){
    const country=url.searchParams.get('country'),region=url.searchParams.get('regionId'),q=(url.searchParams.get('q')??'').trim().slice(0,80);
    if(!COUNTRIES.some(x=>x.code===country)||!/^\d+$/.test(region??''))throw Error('INVALID_GEO_SELECTION');
    return json(200,{items:(await pool.query("WITH RECURSIVE scope AS (SELECT id FROM micontacto.geo_regions WHERE id=$1 AND country_code=$2 AND enabled UNION ALL SELECT r.id FROM micontacto.geo_regions r JOIN scope s ON r.parent_id=s.id WHERE r.country_code=$2 AND r.enabled) SELECT l.id,l.name,l.region_id,r.name AS region_name FROM micontacto.geo_localities l JOIN micontacto.geo_regions r ON r.id=l.region_id WHERE l.region_id IN (SELECT id FROM scope) AND l.country_code=$2 AND l.enabled AND strpos(lower(l.name),lower($3))>0 ORDER BY l.name,l.id LIMIT 200",[region,country,q])).rows.map(l=>({...l,region_name:territoryDisplayName(l.region_name)})),limit:200,reviewRequired:true});
   }
   if(req.method==='GET'&&path==='/api/directory'){
    const f=Object.fromEntries(url.searchParams);const query=directoryQuery(f);return json(200,{items:(await pool.query(query.sql,query.params)).rows,pageLimit:Math.min(50,Number(f.limit)||20),attribution:'GeoNames · CC BY 4.0 · revisión territorial pendiente'});
   }
   if(req.method==='GET'&&path==='/api/featured/quote')return json(200,featureQuote(Number(url.searchParams.get('days'))));
   const publicMatch=path.match(/^\/(pa|cr|ni|sv|hn|gt|mx|co)\/([a-z0-9-]{3,60})(\/qr.svg)?$/);
   if(publicMatch&&req.method==='GET'){
    const p=await publicRow(publicMatch[1].toUpperCase(),publicMatch[2]);if(!p)return json(404,{error:'NOT_FOUND'});
    const view=await profiles.decorate(p);
    return publicMatch[3]?new Response(await QRCode.toString(view.url,{type:'svg',errorCorrectionLevel:'M',margin:4}),{headers:{...headers,'content-type':'image/svg+xml'}}):html(publicProfile(view));
   }
   const reportPageMatch=path.match(/^\/reportar\/([a-f0-9-]{36})$/);
   if(reportPageMatch&&req.method==='GET'){
    if(!allowRead('report-form',300))return json(429,{error:'RATE_LIMITED'});
    const id=reportPageMatch[1],p=(await pool.query('SELECT url_country,slug FROM micontacto.profiles WHERE id=$1',[id])).rows[0];if(!p||!await publicRow(p.url_country,p.slug))throw Error('NOT_FOUND');
    let token=reportCookie(req);if(!/^[a-f0-9]{48}$/.test(token))token=randomBytes(24).toString('hex');
    const r=html(reportPage(id,reportMac(token)));r.headers.set('set-cookie','mc_report='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400'+(origin.startsWith('https:')?'; Secure':''));return r;
   }
   if(path==='/api/public-reports'&&req.method==='POST'){
    const token=reportCookie(req),mac=req.headers.get('x-mc-report')??'';
    if(req.headers.get('origin')!==origin||req.headers.get('sec-fetch-site')==='cross-site'||!/^[a-f0-9]{48}$/.test(token)||mac.length!==43||!timingSafeEqual(Buffer.from(mac),Buffer.from(reportMac(token))))throw Error('CSRF_DENIED');
    if(!allowRead('report-submit',100))return json(429,{error:'RATE_LIMITED'});
    const data=await body(req);if(data.website||Object.keys(data).some(k=>!['profileId','category','reason','evidence','website'].includes(k)))throw Error('INVALID_REPORT');
    return json(201,await moderation.report(data,token));
   }
   const user=await auth.current(req);
   const mediaMatch=path.match(/^\/media\/([a-f0-9-]{36})\/([a-f0-9-]{36})$/);
   if(mediaMatch&&req.method==='GET'){
    const row=(await pool.query("SELECT ph.*,p.account_id,p.country_code,p.url_country,p.slug,p.sensitive_hold,p.moderation_restricted,p.status AS profile_status FROM micontacto.photos ph JOIN micontacto.profiles p ON p.id=ph.profile_id WHERE ph.profile_id=$1 AND ph.id=$2 AND ph.state='ACTIVE'",[mediaMatch[1],mediaMatch[2]])).rows[0];if(!row||row.sensitive_hold||row.profile_status==='DELETED')throw Error('NOT_FOUND');
    if(user?.id!==row.account_id&&user?.role!=='ADMIN'){
     const p=await publicRow(row.url_country,row.slug);if(!p||!(await profiles.decorate(p)).photos.some(x=>x.id===row.id))throw Error('NOT_FOUND');
    }
    const image=await storage.get(row.object_key);if(!image)throw Error('NOT_FOUND');return new Response(await publicPhoto(image),{headers:{...headers,'content-type':'image/webp','x-mc-watermark':'center-v1'}});
   }
   const paymentPage=path.match(/^\/pago-prueba\/([a-f0-9-]{36})$/);
   if(paymentPage&&req.method==='GET'){
    if(!user)return json(401,{error:'UNAUTHENTICATED'});if(!payments.enabled)return json(503,{error:'PAYMENTS_DISABLED'});
    await profiles.detail(user.id,paymentPage[1]);
    return new Response(sandboxPaymentPage(),{headers:{...headers,'content-type':'text/html; charset=utf-8','content-security-policy':headers['content-security-policy'].replace("script-src 'self'", "script-src 'self' https://bt-cdn-uat.yappycloud.com").replace("connect-src 'self'", "connect-src 'self' https://api-comecom-uat.yappycloud.com").replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")}});
   }
   if(!path.startsWith('/api/'))return json(404,{error:'NOT_FOUND'});
   if(!user)return json(401,{error:'UNAUTHENTICATED'});
   if(user.status==='SUSPENDED'&&!(req.method==='GET'&&!path.startsWith('/api/admin/')||req.method==='POST'&&/^\/api\/profiles\/[a-f0-9-]{36}\/appeal$/.test(path)))return json(403,{error:'ACCOUNT_SUSPENDED'});
   if(!['GET','POST','PATCH','DELETE'].includes(req.method))return json(405,{error:'METHOD_NOT_ALLOWED'});
   if(req.method!=='GET'){
    auth.requireWrite(req,user);const minute=Math.floor(now()/60000),key=user.id+':'+minute;
    for(const [k,r]of rates)if(r.minute!==minute)rates.delete(k);
    const count=(rates.get(key)?.count??0)+1;if(count>60||!rates.has(key)&&rates.size>=4096)return json(429,{error:'RATE_LIMITED'});rates.set(key,{minute,count});
   }
   if(path==='/api/legal-consent'&&req.method==='GET')return json(200,{accepted:await consent.accepted(user.id),...consent.publicInfo});
   if(path==='/api/legal-consent'&&req.method==='POST')return json(200,await consent.accept(user.id,await body(req)));
   if((path==='/api/profiles'&&req.method==='POST'||/\/(publish|photos)$/.test(path)&&req.method==='POST')&&!await consent.accepted(user.id))throw Error('LEGAL_ACCEPTANCE_REQUIRED');
   const appealMatch=path.match(/^\/api\/profiles\/([a-f0-9-]{36})\/appeal$/);if(appealMatch&&req.method==='POST')return json(201,await moderation.appeal(user.id,appealMatch[1],await body(req)));
   if(path.startsWith('/api/admin/')&&user.role!=='ADMIN')return json(403,{error:'FORBIDDEN'});
   if(path==='/api/admin/acceptance/status'&&req.method==='GET'&&acceptance&&acceptanceReport)return json(200,acceptanceReport);
   if(path==='/api/payments/config'&&req.method==='GET')return json(200,{enabled:payments.enabled,environment:'test',liveCharges:false});
   const payment=path.match(/^\/api\/payments\/([a-f0-9-]{36})(?:\/(initialize))?$/);
   if(payment&&req.method==='GET'&&!payment[2])return json(200,await payments.read(user.id,payment[1]));
   if(payment&&req.method==='POST'&&payment[2]){const data=await body(req);if(Object.keys(data).some(k=>k!=='alias'))throw Error('INVALID_PAYMENT_REQUEST');return json(200,await payments.initialize(user.id,payment[1],data.alias));}
   const orderList=path.match(/^\/api\/profiles\/([a-f0-9-]{36})\/orders$/);
   if(orderList&&req.method==='GET')return json(200,{items:await payments.list(user.id,orderList[1])});
   const checkout=path.match(/^\/api\/profiles\/([a-f0-9-]{36})\/checkout$/);
   if(checkout&&req.method==='POST')return json(201,await payments.prepare(user.id,checkout[1],await body(req)));
   if(path==='/api/profiles'&&req.method==='GET'){const items=(await pool.query('SELECT id FROM micontacto.profiles WHERE account_id=$1 ORDER BY country_code',[user.id])).rows;return json(200,{items:await Promise.all(items.map(x=>profiles.detail(user.id,x.id)))});}
   if(path==='/api/profiles'&&req.method==='POST'){const data=await body(req);if(Object.keys(data).some(k=>!['country','linkName','displayName','profession','description'].includes(k)))throw Error('INVALID_PROFILE_FIELDS');if(!(await pool.query('SELECT code FROM micontacto.country_settings WHERE code=$1 AND enabled',[String(data.country).toUpperCase()])).rows.length)throw Error('INVALID_COUNTRY');const r=await profiles.create(user.id,data);return json(r.status,r.body);}
   const location=path.match(/^\/api\/profile-location\/([a-f0-9-]{36})$/);
   if(location&&req.method==='GET'){
    const p=(await pool.query('SELECT region_id,locality_id FROM micontacto.profiles WHERE id=$1 AND account_id=$2',[location[1],user.id])).rows[0];if(!p)throw Error('NOT_FOUND');
    if(!p.region_id)return json(200,{topRegionId:null,districtId:null,locality:null});
    const trail=(await pool.query('WITH RECURSIVE trail AS (SELECT id,parent_id,0 AS depth FROM micontacto.geo_regions WHERE id=$1 UNION ALL SELECT r.id,r.parent_id,t.depth+1 FROM micontacto.geo_regions r JOIN trail t ON t.parent_id=r.id) SELECT * FROM trail ORDER BY depth',[p.region_id])).rows;
    const locality=(await pool.query('SELECT id,name FROM micontacto.geo_localities WHERE id=$1',[p.locality_id])).rows[0]??null;
    return json(200,{topRegionId:trail.at(-1)?.id,districtId:trail.length>1?trail[0].id:null,locality});
   }
   if(path==='/api/slugs'&&req.method==='GET'){if(!allowRead('slug:'+user.id,30))return json(429,{error:'RATE_LIMITED'});const r=await checkSlugAvailability({country:url.searchParams.get('country'),linkName:url.searchParams.get('linkName')},slugLookupPostgres(pool));return json(r.status,r.body);}
   const profile=path.match(/^\/api\/profiles\/([a-f0-9-]{36})(?:\/(publish|pause|resume|photos|verification|feature|privacy|removal))?(?:\/([a-f0-9-]{36}))?$/);
   if(profile){const [,id,action,photo]=profile;
    if(!uuid.test(id))throw Error('NOT_FOUND');
    if(req.method==='GET'&&!action)return json(200,await profiles.detail(user.id,id));
    if(req.method==='PATCH'&&!action)return json(200,await profiles.update(user.id,id,await body(req)));
    if(req.method==='POST'&&action==='privacy')return json(200,await privacy.visibility(user.id,id,await body(req)));
    if(req.method==='POST'&&action==='removal')return json(202,await privacy.requestRemoval(user.id,id,await body(req)));
    if(req.method==='POST'&&action==='feature'){const data=await body(req);if(Object.keys(data).some(k=>k!=='days'))throw Error('INVALID_FEATURE_FIELDS');return json(201,await features.prepare(user.id,id,data.days));}
    if(req.method==='POST'&&action==='publish')return json(202,await profiles.requestPublication(user.id,id));
    if(req.method==='POST'&&['pause','resume'].includes(action))return json(200,await profiles.pause(user.id,id,action==='resume'));
    if(req.method==='POST'&&action==='photos')return json(201,await photos.upload(user.id,id,url.searchParams.get('role')??'MAIN',await bytes(req,MAX_PHOTO_BYTES),req.headers.get('content-type'),url.searchParams.get('replace')));
    if(req.method==='DELETE'&&action==='photos'&&photo)return json(200,await photos.remove(user.id,id,photo));
    if(req.method==='POST'&&action==='verification')return json(201,await photos.requestVerification(user.id,id));
   }
   if(path==='/api/admin/profiles'&&req.method==='GET'){
    const kind=url.searchParams.get('kind')??'PENDING';
    const items=(await pool.query(`SELECT p.*,${featureExistsSQL} AS featured,EXISTS(SELECT 1 FROM micontacto.feature_terms history WHERE history.profile_id=p.id AND history.state<>'PREPARED') AS has_feature FROM micontacto.profiles p ORDER BY p.updated_at DESC,p.id LIMIT 200`)).rows;
    return json(200,{items:items.filter(p=>kind==='PENDING'?p.status==='PENDING_REVIEW':kind==='FEATURED'?p.has_feature:!p.featured).map(p=>({id:p.id,name:p.display_name,country:p.country_code,status:p.status,version:p.version,featured:p.featured})),limit:200});
   }
   if(path==='/api/admin/removals'&&req.method==='GET')return json(200,{items:(await pool.query('SELECT r.id,r.profile_id,r.state,r.requested_at,r.reviewed_at,p.display_name,p.account_id FROM micontacto.removal_requests r JOIN micontacto.profiles p ON p.id=r.profile_id ORDER BY r.requested_at DESC LIMIT 100')).rows});
   const erase=path.match(/^\/api\/admin\/removals\/([a-f0-9-]{36})\/approve$/);if(erase&&req.method==='POST')return json(200,await erasure.approve(user.id,erase[1],await body(req)));
   const removal=path.match(/^\/api\/admin\/removals\/([a-f0-9-]{36})$/);if(removal&&req.method==='POST')return json(200,await privacy.acknowledge(user.id,removal[1],await body(req)));
   const adminProfile=path.match(/^\/api\/admin\/profiles\/([a-f0-9-]{36})$/);
   if(adminProfile&&req.method==='GET'){const p=(await pool.query('SELECT * FROM micontacto.profiles WHERE id=$1',[adminProfile[1]])).rows[0];if(!p)throw Error('NOT_FOUND');return json(200,await profiles.decorate(p,true));}
   if(adminProfile&&req.method==='POST')return json(200,await profiles.moderate(user.id,adminProfile[1],await body(req)));
   if(path==='/api/admin/categories'&&req.method==='GET')return json(200,{items:(await pool.query('SELECT * FROM micontacto.categories ORDER BY name')).rows});
   if(path==='/api/admin/countries'&&req.method==='GET')return json(200,{items:(await pool.query('SELECT * FROM micontacto.country_settings ORDER BY code')).rows.map(x=>({...x,name:COUNTRIES.find(c=>c.code===x.code).name}))});
   if(path==='/api/admin/geography'&&req.method==='GET'){
    const country=url.searchParams.get('country'),type=url.searchParams.get('type'),q=(url.searchParams.get('q')??'').trim().slice(0,100);
    if(!COUNTRIES.some(c=>c.code===country)||!['regions','localities'].includes(type))throw Error('INVALID_GEO_SELECTION');
    const table=type==='regions'?'geo_regions':'geo_localities';return json(200,{items:(await pool.query('SELECT id,name,enabled,source_id FROM micontacto.'+table+' WHERE country_code=$1 AND strpos(lower(name),lower($2))>0 ORDER BY name,id LIMIT 100',[country,q])).rows,limit:100});
   }
   if(path==='/api/admin/categories'&&req.method==='POST'){
    const data=await body(req);if(typeof data.name!=='string'||data.name.trim().length<2||data.name.length>100)throw Error('INVALID_CATEGORY');
    const id=randomUUID();await transaction(pool,async tx=>{await tx.query('INSERT INTO micontacto.categories(id,name) VALUES($1,$2)',[id,data.name.trim()]);await profiles.audit(tx,user.id,null,'CATEGORY_CREATED',data.name.trim());});return json(201,{id});
   }
   if(path==='/api/admin/catalog'&&req.method==='POST'){
    const data=await body(req);if(!['countries','regions','localities','categories'].includes(data.type)||typeof data.enabled!=='boolean'||typeof data.reason!=='string'||data.reason.trim().length<3||data.reason.length>500)throw Error('INVALID_CATALOG_CHANGE');
    if(data.type==='countries'?!COUNTRIES.some(c=>c.code===data.id):data.type==='categories'?!uuid.test(data.id):!Number.isSafeInteger(Number(data.id)))throw Error('INVALID_CATALOG_CHANGE');
    const table={countries:'country_settings',regions:'geo_regions',localities:'geo_localities',categories:'categories'}[data.type],column=data.type==='countries'?'code':'id';
    await transaction(pool,async tx=>{const r=await tx.query('UPDATE micontacto.'+table+' SET enabled=$2 WHERE '+column+'=$1 RETURNING '+column,[data.id,data.enabled]);if(!r.rows.length)throw Error('NOT_FOUND');await profiles.audit(tx,user.id,null,'CATALOG_CHANGED',data.type+':'+data.id+' '+data.reason);});return json(200,{ok:true});
   }
   if(path==='/api/admin/verifications'&&req.method==='GET')return json(200,{items:(await pool.query("SELECT v.id,v.profile_id,v.photo_id,v.code,v.state,p.display_name FROM micontacto.photo_verifications v JOIN micontacto.profiles p ON p.id=v.profile_id WHERE v.state='PENDING' ORDER BY v.created_at LIMIT 100")).rows});
   const verification=path.match(/^\/api\/admin\/verifications\/([a-f0-9-]{36})$/);if(verification&&req.method==='POST')return json(200,await photos.reviewVerification(user.id,verification[1],await body(req)));
   if(path==='/api/reports'&&req.method==='POST')return json(201,await moderation.report(await body(req),'account:'+user.id,user.id));
   if(path==='/api/admin/reports'&&req.method==='GET')return json(200,{items:(await pool.query('SELECT r.id,r.profile_id,r.category,r.reason,r.evidence,r.state,r.created_at,r.reviewed_at,p.display_name,p.sensitive_hold FROM micontacto.reports r JOIN micontacto.profiles p ON p.id=r.profile_id ORDER BY r.created_at DESC LIMIT 100')).rows});
   const report=path.match(/^\/api\/admin\/reports\/([a-f0-9-]{36})$/);
   if(report&&req.method==='POST'){const data=await body(req);if(data.state==='DISMISSED')data.action='DISMISS';return json(200,await moderation.act(user.id,report[1],data));}
   if(path==='/api/admin/appeals'&&req.method==='GET')return json(200,{items:(await pool.query('SELECT id,profile_id,reason,state,created_at FROM micontacto.appeals ORDER BY created_at DESC LIMIT 100')).rows});
   const appeal=path.match(/^\/api\/admin\/appeals\/([a-f0-9-]{36})$/);if(appeal&&req.method==='POST')return json(200,await moderation.reviewAppeal(user.id,appeal[1],await body(req)));
   if(path==='/api/admin/moderation-events'&&req.method==='GET')return json(200,{items:(await pool.query('SELECT * FROM micontacto.moderation_events ORDER BY created_at DESC LIMIT 100')).rows});
   if(path==='/api/admin/audit'&&req.method==='GET')return json(200,{items:(await pool.query('SELECT actor_id,profile_id,action,reason,created_at FROM micontacto.audit ORDER BY created_at DESC LIMIT 100')).rows});
   const cancel=path.match(/^\/api\/admin\/featured\/([a-f0-9-]{36})\/cancel$/);
   if(cancel&&req.method==='POST'){
    const data=await body(req);if(typeof data.reason!=='string'||data.reason.trim().length<3||data.reason.length>500)throw Error('REASON_REQUIRED');
    return json(200,await features.cancel(user.id,cancel[1],data.reason));
   }
   return json(404,{error:'NOT_FOUND'});
  }catch(e){
   const message=e.message;
   const status=message==='REPORT_RATE_LIMITED'?429:message==='NOT_FOUND'?404:['FORBIDDEN','CSRF_DENIED'].includes(message)?403:/^(INVALID_|PHOTO_REQUIRED|CONSENT_REQUIRED|JSON_REQUIRED|REASON_REQUIRED|VERIFICATION_REVIEW_REQUIRED|PUBLICATION_REQUIREMENTS)/.test(message)?400:message==='LEGAL_ACCEPTANCE_REQUIRED'?428:message==='PAYLOAD_TOO_LARGE'?413:/^(PROFILE_LOCKED|EDIT_CONFLICT|GALLERY_NOT_AVAILABLE|VERIFICATION_STALE|FEATURE_CONFLICT|PAYMENT_CONFLICT|REMOVAL_PENDING)/.test(message)||e.code==='23505'?409:e.code==='23503'||e.code==='23514'||e.code==='22P02'?400:503;
   return json(status,{error:status===503?'OPERATION_UNAVAILABLE':e.code==='23505'?'DUPLICATE_RECORD':['23503','23514','22P02'].includes(e.code)?'INVALID_DATA':message});
  }
 }
 function secure(response,sameOriginForm=false){const h=new Headers(response.headers);for(const[k,v]of Object.entries(headers))h.set(k,v);if(sameOriginForm)h.set('referrer-policy','same-origin');return new Response(response.body,{status:response.status,headers:h});}
 return {handle,auth,profiles,photos,features,payments,privacy,erasure,moderation};
}
