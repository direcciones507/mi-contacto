import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import sharp from 'sharp';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT,jwtVerify} from 'jose';
import {testFixture} from '../scripts/test-fixture.mjs';
import {featureQuote,activeFeature,visiblePhotos} from '../feature-policy.js';
import {isolatedObjectStorage} from '../photo-storage.js';
import {validateCatalog,loadCatalog} from '../scripts/load-catalog.mjs';
import jsQR from 'jsqr';
import {createAuth} from '../auth-runtime.js';

test('integración real en PostgreSQL WASM aislado, sin servicios ni pagos',async t=>{
 const f=await testFixture({simulation:true});let id,main,version;
 const image=await sharp({create:{width:1200,height:800,channels:3,background:'#155eb1'}}).png().toBuffer();
 const save=extra=>({version,displayName:'Persona sintética',profession:'Oficio de prueba',description:'Texto <seguro>',phone:'+50760000000',whatsapp:'+50760000000',categoryId:f.category,...f.geo.PA,directoryConsent:true,contactConsent:false,locationConsent:false,latitude:null,longitude:null,...extra});
 const current=async()=>{const p=await(await f.request('/api/profiles/'+id)).json();version=p.version;return p;};
 try{
  await t.test('autenticación, ADMIN y CSRF',async()=>{
   assert.equal((await f.request('/api/profiles',{as:null})).status,401);
   assert.equal((await f.request('/api/admin/profiles')).status,403);
   assert.equal((await f.request('/api/profiles',{method:'POST',csrf:false,body:{}})).status,403);
   assert.equal((await f.request('/api/profiles',{method:'POST',headers:{origin:'https://evil.invalid'},body:{}})).status,403);
   assert.equal((await f.request('/auth/google',{as:null})).status,503);
   assert.equal((await(await f.request('/api/auth-options',{as:null})).json()).googleEnabled,false);
  });
  await t.test('crear, duplicados por país, sin suplantar propietario ni roles',async()=>{
   const r=await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'persona-sintetica',displayName:'Persona sintética',profession:'Prueba'}});assert.equal(r.status,201);id=(await r.json()).id;
   assert.equal((await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'otro-enlace',displayName:'Otra ficha'}})).status,409);
   assert.equal((await f.request('/api/profiles',{as:'other',method:'POST',body:{country:'PA',linkName:'persona-sintetica',displayName:'Otra persona'}})).status,409);
   assert.equal((await f.request('/api/profiles/'+id,{as:'other'})).status,404);
   assert.equal((await f.request('/api/profiles',{method:'POST',body:{country:'CR',linkName:'permitido',displayName:'Persona',role:'ADMIN'}})).status,400);
   const cr=await f.request('/api/profiles',{method:'POST',body:{country:'CR',linkName:'persona-sintetica',displayName:'Persona sintética CR'}});assert.equal(cr.status,409);
   const lookup=await(await f.request('/api/slugs?country=PA&linkName=persona-sintetica')).json();assert.equal(lookup.available,false);
   for(const country of ['NI','SV','HN','GT','MX','CO'])assert.equal((await f.request('/api/profiles',{method:'POST',body:{country,linkName:'enlace-'+country.toLowerCase(),displayName:'Perfil sintético '+country}})).status,409);
   assert.equal((await(await f.request('/api/profiles')).json()).items.length,1);
   assert.equal((await f.request('/api/profiles',{method:'POST',body:{country:'PE',linkName:'no-permitido',displayName:'Perfil sintético'}})).status,400);
  });
  await t.test('edición y ubicación: consentimiento, homónimos y bloqueo de identidad',async()=>{
   await current();assert.equal((await f.request('/api/profiles/'+id,{method:'PATCH',body:save({...f.geo.CR})})).status,400);
   assert.equal((await f.request('/api/profiles/'+id,{method:'PATCH',body:save({latitude:8,longitude:-80})})).status,400);
   assert.equal((await f.request('/api/profiles/'+id,{method:'PATCH',body:save({whatsapp:'60000000'})})).status,400);
   assert.equal((await f.request('/api/profiles/'+id,{method:'PATCH',body:save({slug:'cambiar'})})).status,400);
   assert.equal((await f.request('/api/profiles/'+id,{method:'PATCH',body:save()})).status,200);
   assert.equal((await f.request('/api/profiles/'+id,{method:'PATCH',body:save()})).status,409);await current();
   await assert.rejects(f.pool.query("UPDATE micontacto.profiles SET slug='romper' WHERE id=$1",[id]),/PROFILE_IDENTITY_IMMUTABLE/);
   assert.equal((await f.request('/api/profiles/'+id+'/publish',{method:'POST'})).status,400);
  });
  await t.test('fotos: MIME, tamaño, permisos, principal, galería protegida',async()=>{
   assert.equal((await f.request('/api/profiles/'+id+'/photos',{as:'other',method:'POST',raw:true,body:image})).status,404);
   assert.equal((await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:Buffer.from('<svg/>')})).status,400);
   assert.equal((await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:Buffer.alloc(5*1024*1024+1)})).status,413);
   const photo=await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:image});assert.equal(photo.status,201);main=(await photo.json()).id;
   assert.equal((await f.request('/api/profiles/'+id+'/photos?role=GALLERY',{method:'POST',raw:true,body:image})).status,409);
   assert.equal((await f.request('/media/'+id+'/'+main,{as:null})).status,404);
   const ownPhoto=await f.request('/media/'+id+'/'+main);assert.equal(ownPhoto.status,200);assert.equal(ownPhoto.response.headers.get('content-type'),'image/webp');
  });
  await t.test('publicación, revisión versionada y privacidad pública',async()=>{
   assert.equal((await f.request('/api/profiles/'+id+'/publish',{method:'POST'})).status,202);await current();
   assert.equal((await f.request('/api/admin/profiles/'+id,{as:'admin',method:'POST',body:{action:'APPROVE',reason:'Revisión sintética',version:version-1}})).status,409);
   assert.equal((await f.request('/api/admin/profiles/'+id,{as:'admin',method:'POST',body:{action:'APPROVE',reason:'Revisión sintética',version}})).status,400);
   const r=await f.request('/pa/persona-sintetica',{as:null});assert.equal(r.status,200);assert.match(r.response.headers.get('x-robots-tag'),/noindex/);const html=await r.response.text();assert.doesNotMatch(html,/60000000|mailto:|accounts.google|google_subject/);assert.match(html,/&lt;seguro&gt;/);
   const dir=await(await f.request('/api/directory?country=PA&keyword=Persona',{as:null})).json();assert.equal(dir.items.length,0);
   assert.equal((await(await f.request('/api/directory?country=PA&regionId='+f.geo.PA.regionId+'&localityId='+f.geo.PA.localityId+'&categoryId='+f.category,{as:null})).json()).items.length,0);
   assert.equal((await(await f.request('/api/directory?country=PA&regionId='+f.geo.CR.regionId,{as:null})).json()).items.length,0);
   assert.equal((await(await f.request('/api/directory?country=PA&limit=1&offset=1',{as:null})).json()).items.length,0);
   assert.equal((await(await f.request('/api/directory?country=PA&keyword=%25',{as:null})).json()).items.length,0);
   const sitemap=await(await f.request('/sitemap.xml',{as:null})).response.text();assert.doesNotMatch(sitemap,/persona-sintetica/);
   const qr=await f.request('/pa/persona-sintetica/qr.svg',{as:null});assert.equal(qr.status,200);
   const svg=await qr.response.text(),{data,info}=await sharp(Buffer.from(svg)).resize(700,700).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   assert.equal(jsQR(new Uint8ClampedArray(data),info.width,info.height).data,'https://micontacto.online/pa/persona-sintetica');
  });
  await t.test('pausa conserva URL/QR y no admite eludir bloqueo ADMIN',async()=>{
   const term=await f.app.features.prepare(f.owner,id,1);await f.app.features.activateSimulation(f.owner,id,term.id,'synthetic-'+randomUUID());
   assert.equal((await f.request('/api/profiles/'+id+'/pause',{method:'POST'})).status,200);
   assert.equal((await f.request('/pa/persona-sintetica',{as:null})).status,200);assert.equal((await f.request('/media/'+id+'/'+main,{as:null})).status,200);
   assert.equal((await f.request('/pa/persona-sintetica/qr.svg',{as:null})).status,200);
   assert.equal((await f.request('/api/profiles/'+id+'/resume',{method:'POST'})).status,200);assert.equal((await current()).url,'https://micontacto.online/pa/persona-sintetica');await f.app.features.cancel(f.admin,term.id,'Fin de simulación');
  });
  await t.test('verificación gratis manual, revocada al cambiar foto principal',async()=>{
   const r=await f.request('/api/profiles/'+id+'/verification',{method:'POST'});assert.equal(r.status,201);const v=await r.json();
   assert.equal((await f.request('/api/admin/verifications/'+v.id,{as:'admin',method:'POST',body:{approved:true,evidenceReviewed:false,reason:'Prueba'}})).status,400);
   assert.equal((await f.request('/api/admin/verifications/'+v.id,{as:'admin',method:'POST',body:{approved:true,evidenceReviewed:true,reason:'Evidencia sintética revisada'}})).status,200);assert.equal((await current()).photoVerified,true);
   const replacement=await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:image});assert.equal(replacement.status,201);assert.equal((await current()).photoVerified,false);
   assert.equal((await f.request('/media/'+id+'/'+main,{as:null})).status,404);assert.equal((await f.request('/pa/persona-sintetica',{as:null})).status,404);
  });
  await t.test('destacados: precios, fotos adicionales y fin exacto sin borrar datos',async()=>{
   assert.deepEqual(featureQuote(30),{days:30,amountCents:3900,currency:'USD',paymentEnabled:false,automaticRenewal:false});assert.throws(()=>featureQuote(2));
   const start=new Date(Date.now()-1000),end=new Date(Date.now()+86400000);
   await f.request('/api/profiles/'+id+'/publish',{method:'POST'});await current();await f.request('/api/admin/profiles/'+id,{as:'admin',method:'POST',body:{action:'APPROVE',version,reason:'Revisión de foto nueva'}});
   const prepared=await f.app.features.prepare(f.owner,id,30);const term=prepared.id;await f.app.features.activateSimulation(f.owner,id,term,'synthetic-'+randomUUID());
   const gallery=await f.request('/api/profiles/'+id+'/photos?role=GALLERY',{method:'POST',raw:true,body:image});assert.equal(gallery.status,201);let galleryId=(await gallery.json()).id;assert.equal((await current()).featureTerms.find(t=>t.id===term).state,'PAUSED');
   for(let i=0;i<3;i++)assert.equal((await f.request('/api/profiles/'+id+'/photos?role=GALLERY',{method:'POST',raw:true,body:image})).status,201);
   assert.equal((await f.request('/api/profiles/'+id+'/photos?role=GALLERY',{method:'POST',raw:true,body:image})).status,409);
   const oldGallery=galleryId;
   const swapped=await f.request('/api/profiles/'+id+'/photos?role=GALLERY&replace='+oldGallery,{method:'POST',raw:true,body:image});assert.equal(swapped.status,201);galleryId=(await swapped.json()).id;
   assert.equal((await current()).photos.length,5);assert.equal((await f.request('/media/'+id+'/'+oldGallery)).status,404);
   const failed=await f.request('/api/profiles/'+id+'/photos?role=GALLERY&replace='+galleryId,{method:'POST',raw:true,body:Buffer.from('invalid')});assert.equal(failed.status,400);assert.equal((await f.request('/media/'+id+'/'+galleryId)).status,200);
   await f.request('/api/profiles/'+id+'/publish',{method:'POST'});await current();await f.request('/api/admin/profiles/'+id,{as:'admin',method:'POST',body:{action:'APPROVE',version,reason:'Revisión nueva'}});
   await f.request('/api/profiles/'+id+'/resume',{method:'POST'});assert.equal((await f.request('/media/'+id+'/'+galleryId,{as:null})).status,200);
   await f.pool.query("UPDATE micontacto.feature_terms SET remaining_ms=0 WHERE id=$1",[term]);
   assert.equal((await f.request('/media/'+id+'/'+galleryId,{as:null})).status,404);assert.equal((await current()).photos.length,5);
   assert.equal((await f.request('/api/profiles/'+id+'/photos?role=GALLERY&replace='+galleryId,{method:'POST',raw:true,body:image})).status,409);
   assert.equal(activeFeature([{state:'ACTIVE',starts_at:start.toISOString(),expires_at:end.toISOString()}],+end),false);
   assert.equal(visiblePhotos([{id:1,state:'ACTIVE',role:'GALLERY'},{id:2,state:'ACTIVE',role:'MAIN'}],false)[0].id,2);
   assert.equal((await f.request('/api/admin/featured/'+term+'/cancel',{method:'POST',body:{reason:'Sin permiso'}})).status,403);
   assert.equal((await f.request('/api/admin/featured/'+term+'/cancel',{as:'admin',method:'POST',body:{reason:'Cancelar prueba sin cargos'}})).status,200);
  });
  await t.test('denuncias, moderación de pago/gratis y auditoría',async()=>{
   const report=await f.request('/api/reports',{as:'other',method:'POST',body:{profileId:id,reason:'Contenido sintético para revisión'}});assert.equal(report.status,201);
   await current();assert.equal((await f.request('/api/admin/profiles/'+id,{as:'admin',method:'POST',body:{action:'BLOCK',version,reason:'Bloqueo de prueba'}})).status,200);
   assert.equal((await f.request('/api/profiles/'+id+'/resume',{method:'POST'})).status,409);assert.equal((await f.request('/pa/persona-sintetica',{as:null})).status,404);
   assert.equal((await(await f.request('/api/directory?country=PA',{as:null})).json()).items.length,0);
   assert.ok((await(await f.request('/api/admin/audit',{as:'admin'})).json()).items.length>=8);
   assert.equal((await f.request('/api/admin/catalog',{method:'POST',body:{type:'categories',id:f.category,enabled:false,reason:'No autorizado'}})).status,403);
   assert.equal((await f.request('/api/admin/geography?country=PA&type=localities')).status,403);
   const geography=await(await f.request('/api/admin/geography?country=PA&type=localities',{as:'admin'})).json();assert.equal(geography.items[0].id,f.geo.PA.localityId);
   assert.equal((await f.request('/api/admin/catalog',{as:'admin',method:'POST',body:{type:'localities',id:f.geo.PA.localityId,enabled:false,reason:'Revisión geográfica sintética'}})).status,200);
   assert.equal((await(await f.request('/api/localities?country=PA&regionId='+f.geo.PA.regionId,{as:null})).json()).items.length,0);
  });
  await t.test('catálogo real recuperado con procedencia y pertenencia exacta',async()=>{
   assert.throws(()=>validateCatalog({regions:[{country:'PA',source:'PA.1',name:'Fixture',level:1}],localities:[{country:'CR',source:'1',name:'Fixture',region:'PA.1'}]}),/INVALID_LOCALITY/);
   const imported=await loadCatalog(f.pool,{selectedCountries:['CR']});assert.ok(imported.localities>5000);assert.equal(imported.reviewRequired,true);
   const count=(await f.pool.query("SELECT count(*)::int AS n FROM micontacto.geo_localities WHERE country_code='CR'")).rows[0].n;assert.ok(count>5000);
   assert.equal((await f.request('/api/admin/catalog',{as:'admin',method:'POST',body:{type:'countries',id:'CR',enabled:false,reason:'Pausa de catálogo sintético'}})).status,200);
   assert.equal((await(await f.request('/api/countries',{as:null})).json()).items.some(c=>c.code==='CR'),false);
   assert.equal((await f.request('/api/profiles',{as:'other',method:'POST',body:{country:'CR',linkName:'bloqueado-pais',displayName:'Persona sintética'}})).status,400);
  });
  await t.test('sesiones revocadas y ningún acceso por cookies de otra plataforma',async()=>{
   const response=await f.app.handle(new Request(f.origin+'/api/profiles',{headers:{cookie:'ad507_session=anything'}}));assert.equal(response.status,401);
   assert.equal((await f.request('/auth/logout',{method:'POST'})).status,204);assert.equal((await f.request('/api/profiles')).status,401);
  });
 }finally{await f.local.pool.close();}
});

test('OAuth completo: token firmado, PKCE, state por navegador, replay y registro aislado',async()=>{
 const {privateKey,publicKey}=await generateKeyPair('RS256');const jwk=await exportJWK(publicKey);jwk.kid='synthetic-key';const jwks=createLocalJWKSet({keys:[jwk]});let nonce,verifier;
 const f=await testFixture({google:{clientId:'synthetic-client',clientSecret:'synthetic-only'},verifyToken:async token=>(await jwtVerify(token,jwks,{audience:'synthetic-client',issuer:'https://accounts.google.com',algorithms:['RS256']})).payload,fetch:async(url,options)=>{
  assert.equal(url,'https://oauth2.googleapis.com/token');assert.equal(options.body.get('code_verifier'),verifier);
  const token=await new SignJWT({nonce}).setProtectedHeader({alg:'RS256',kid:'synthetic-key'}).setSubject('synthetic-google-new-account').setIssuer('https://accounts.google.com').setAudience('synthetic-client').setExpirationTime('5m').sign(privateKey);return Response.json({id_token:token});
 }});
 try{
  const login=await f.request('/auth/google',{as:null});assert.equal(login.status,302);const state=new URL(login.response.headers.get('location')).searchParams.get('state');
  const row=(await f.pool.query('SELECT nonce,verifier FROM micontacto.oauth_transactions WHERE state_hash=$1',[createHash('sha256').update(state).digest('hex')])).rows[0];nonce=row.nonce;verifier=row.verifier;
  assert.equal((await f.request('/auth/google/callback?state='+state+'&code=test',{as:null})).status,400);
  const callback=()=>f.request('/auth/google/callback?state='+state+'&code=test',{as:null,headers:{cookie:'mc_oauth='+state}});
  const success=await callback();assert.equal(success.status,302);assert.match(success.response.headers.get('set-cookie'),/mc_session=/);assert.equal((await callback()).status,400);
  assert.equal((await f.pool.query("SELECT role FROM micontacto.accounts WHERE google_subject='synthetic-google-new-account'")).rows[0].role,'USER');
 }finally{await f.local.pool.close();}
});

test('almacenamiento aislado simulado exige bucket explícito y claves propias',async()=>{
 assert.throws(()=>isolatedObjectStorage({client:{},bucket:'otro'}),/ISOLATED_STORAGE_REQUIRED/);const calls=[];
 const storage=isolatedObjectStorage({isolated:true,bucket:'mi-contacto-synthetic-only',client:{putObject:async x=>calls.push(x),getObject:async()=>Buffer.from('fixture'),deleteObject:async()=>{}}});
 await assert.rejects(storage.put('../otro-proyecto/a',Buffer.from('x')),/INVALID_OBJECT_KEY/);
 await storage.put('mi-contacto/'+randomUUID()+'/'+randomUUID()+'.webp',Buffer.from('fixture'));assert.equal(calls[0].public,false);
});
test('la configuración de autenticación rechaza otros proyectos y protocolos inseguros',()=>{
 for(const origin of ['https://direcciones507.com','ftp://localhost','http://micontacto.online','https://micontacto.online/otra-ruta'])assert.throws(()=>createAuth({},{secret:'x'.repeat(48),origin}),/INVALID_ORIGIN/);
});
