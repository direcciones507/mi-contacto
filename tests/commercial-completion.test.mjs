import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {testFixture} from '../scripts/test-fixture.mjs';
import {validateMapsUrl} from '../maps.js';
import {memoryPhotoStorage} from '../photo-storage.js';
import {r2PhotoStorage} from '../photo-storage-r2.js';
import {databaseConfig} from '../database.js';
import {randomUUID} from 'node:crypto';

test('pin de Maps: lista permitida, sin redirecciones ni coordenadas inventadas',()=>{
 for(const url of ['https://maps.app.goo.gl/ABC','https://goo.gl/maps/ABC','https://www.google.com/maps?q=Panama'])assert.equal(validateMapsUrl(url),url);
 for(const url of ['http://maps.app.goo.gl/ABC','https://maps.app.goo.gl.evil.com/x','https://user@maps.google.com/','javascript:alert(1)','https://www.google.com/url?url=https://evil.com'])assert.throws(()=>validateMapsUrl(url),/INVALID_MAPS_URL/);
});

test('un perfil por cuenta, mudanza conserva id URL QR; pin independiente y directorio regional',async()=>{
 const f=await testFixture({simulation:true});
 try{
  const created=await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'mudanza-estable',displayName:'Persona sintética',profession:'Docente'}});assert.equal(created.status,201);const {id,url}=await created.json();
  const dupe=await Promise.all(['CR','PA'].map(country=>f.request('/api/profiles',{method:'POST',body:{country,linkName:'segundo-'+country.toLowerCase(),displayName:'Duplicado'}})));assert.deepEqual(dupe.map(r=>r.status),[409,409]);
  let p=await f.app.profiles.detail(f.owner,id);
  const input={version:p.version,country:'CR',displayName:p.displayName,profession:'Docente',description:'Descripción actualizada',phone:'',whatsapp:'',...f.geo.CR,latitude:null,longitude:null,directoryConsent:true,contactConsent:false,locationConsent:true,mapsUrl:'https://maps.app.goo.gl/syntheticPin'};
  assert.equal((await f.request('/api/profiles/'+id,{method:'PATCH',body:{...input,...f.geo.PA}})).status,400);
  assert.equal((await f.request('/api/profiles/'+id,{method:'PATCH',body:input})).status,200);
  const bytes=await sharp({create:{width:20,height:20,channels:3,background:'blue'}}).png().toBuffer();assert.equal((await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:bytes})).status,201);
  assert.equal((await f.request('/api/profiles/'+id+'/publish',{method:'POST'})).status,202);p=await f.app.profiles.detail(f.owner,id);
  assert.equal((await f.request('/api/admin/profiles/'+id,{as:'admin',method:'POST',body:{version:p.version,action:'APPROVE',reason:'Revisión de mudanza'}})).status,400);
  p=await f.app.profiles.detail(f.owner,id);assert.equal(p.country,'CR');assert.equal(p.url,url);assert.equal(p.urlCountry,'PA');
  const page=await f.request('/pa/mudanza-estable',{as:null});assert.equal(page.status,200);const html=await page.response.text();assert.equal(p.mapsUrl,'https://maps.app.goo.gl/syntheticPin');assert.doesNotMatch(html,/maps.app.goo.gl\/syntheticPin/);assert.doesNotMatch(html,/waze.com/);assert.match(html,/Descargar QR/);assert.match(html,/Compartir/);assert.match(html,/\/pa\/mudanza-estable\/qr.svg/);
  assert.equal((await f.request('/pa/mudanza-estable/qr.svg',{as:null})).status,200);assert.equal((await f.request('/cr/mudanza-estable',{as:null})).status,404);
  const term=await f.app.features.prepare(f.owner,id,1);await f.app.features.activateSimulation(f.owner,id,term.id,'synthetic-'+randomUUID());
  assert.equal((await(await f.request('/api/directory?country=PA',{as:null})).json()).items.length,0);const rows=(await(await f.request('/api/directory?country=CR',{as:null})).json()).items;assert.equal(rows.length,1);assert.equal(rows[0].url_country,'PA');
 }finally{await f.pool.close();}
});

test('eliminación: solicitud titular, ADMIN CSRF, borrado SQL, QR invalidado y reintento de archivos',async()=>{
 const base=memoryPhotoStorage();let fail=true;const storage={...base,async delete(key){if(fail)throw Error('synthetic storage outage');await base.delete(key);}};
 const f=await testFixture({storage});
 try{
  const id=(await(await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'supprimer-profil',displayName:'Persona sintética'}})).json()).id;
  const bytes=await sharp({create:{width:20,height:20,channels:3,background:'blue'}}).png().toBuffer();const photo=(await(await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:bytes})).json()).id;
  const key=(await f.pool.query('SELECT object_key FROM micontacto.photos WHERE id=$1',[photo])).rows[0].object_key;
  await assert.rejects(f.pool.query('DELETE FROM micontacto.profiles WHERE id=$1',[id]),/PROFILE_IDENTITY_RESERVED/);
  assert.equal((await f.request('/api/admin/removals/'+randomUUID()+'/approve',{as:'admin',method:'POST',body:{confirm:true,reason:'Solicitud inexistente'}})).status,404);
  const request=(await(await f.request('/api/profiles/'+id+'/removal',{method:'POST',body:{confirm:true}})).json()).id;
  const path='/api/admin/removals/'+request+'/approve',body={confirm:true,reason:'Autorización de prueba'};
  assert.equal((await f.request(path,{method:'POST',body})).status,403);assert.equal((await f.request(path,{as:'admin',csrf:false,method:'POST',body})).status,403);
  assert.equal((await f.request(path,{as:'admin',method:'POST',body:{...body,confirm:false}})).status,400);
  const result=await f.request(path,{as:'admin',method:'POST',body});assert.equal(result.status,200);const removed=await result.json();assert.equal(removed.profileDeleted,true);assert.equal(removed.physicalDeletion,false);assert.equal(removed.objects.pending,1);
  for(const table of ['profiles','photos','removal_requests','profile_slug_reservations'])assert.equal(Number((await f.pool.query('SELECT count(*) AS n FROM micontacto.'+table)).rows[0].n),0);
  for(const path of ['/pa/supprimer-profil','/pa/supprimer-profil/qr.svg','/media/'+id+'/'+photo])assert.equal((await f.request(path,{as:null})).status,404);
  assert.ok(await storage.get(key));fail=false;assert.equal((await f.app.erasure.cleanup()).pending,0);assert.equal(await storage.get(key),null);
  const reused=await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'supprimer-profil',displayName:'Reutilización'}});assert.equal(reused.status,409);
  assert.equal((await f.pool.query("SELECT count(*) AS n FROM micontacto.audit WHERE action='PROFILE_ERASED'")).rows[0].n,1);
 }finally{await f.pool.close();}
});

test('adaptador R2 usa comandos SDK privados; verificación por cliente sintético, sin R2 real',async()=>{
 const sent=[];const store=r2PhotoStorage({accountId:'a'.repeat(32),accessKeyId:'synthetic',secretAccessKey:'synthetic',bucket:'mi-contacto-synthetic-only',isolated:true,client:{async send(command){sent.push(command);if(command.constructor.name==='GetObjectCommand')return {ContentLength:3,Body:(async function*(){yield Buffer.from('abc');})()};return {};}}});
 const key='mi-contacto/'+randomUUID()+'/'+randomUUID()+'.webp';await store.put(key,Buffer.from('abc'));assert.equal((await store.get(key)).toString(),'abc');await store.delete(key);assert.deepEqual(sent.map(c=>c.constructor.name),['PutObjectCommand','GetObjectCommand','DeleteObjectCommand']);assert.equal(sent[0].input.ACL,undefined);assert.equal(sent[0].input.CacheControl,'private, no-store');
});

test('configuración PostgreSQL exige aislamiento y TLS remoto sin secretos de otros proyectos',()=>{
 assert.throws(()=>databaseConfig({}),/DEDICATED_DATABASE/);assert.throws(()=>databaseConfig({MC_DATABASE_ISOLATED:'true',MC_DATABASE_URL:'postgres://example/db'}),/DATABASE_TLS_REQUIRED/);
 const config=databaseConfig({MC_DATABASE_ISOLATED:'true',MC_DATABASE_URL:'postgres://example/db?sslmode=no-verify',MC_DATABASE_TLS:'true'});assert.equal(config.ssl.rejectUnauthorized,true);assert.equal(new URL(config.connectionString).search,'');
});

test('fallo transaccional al borrar conserva perfil y archivos; no crea trabajo de borrado',async()=>{
 const f=await testFixture();try{
  const id=(await(await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'fallo-borrado',displayName:'Persona sintética'}})).json()).id;
  const removal=(await(await f.request('/api/profiles/'+id+'/removal',{method:'POST',body:{confirm:true}})).json()).id;
  await f.pool.query("CREATE FUNCTION micontacto.reject_erasure_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='PROFILE_ERASED' THEN RAISE EXCEPTION 'SYNTHETIC_ERASURE_FAILURE'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_erasure_audit BEFORE INSERT ON micontacto.audit FOR EACH ROW EXECUTE FUNCTION micontacto.reject_erasure_audit()");
  assert.equal((await f.request('/api/admin/removals/'+removal+'/approve',{as:'admin',method:'POST',body:{confirm:true,reason:'Prueba de rollback'}})).status,503);
  assert.equal((await f.pool.query('SELECT id FROM micontacto.profiles WHERE id=$1',[id])).rows.length,1);assert.equal((await f.pool.query('SELECT state FROM micontacto.removal_requests WHERE id=$1',[removal])).rows[0].state,'OPEN');assert.equal((await f.pool.query('SELECT * FROM micontacto.deleted_urls')).rows.length,0);
 }finally{await f.pool.close();}
});

test('migración 010 se detiene sin perder datos cuando encuentra perfiles históricos duplicados',async()=>{
 const {localDatabase}=await import('../scripts/local-database.mjs'),{readdir,readFile}=await import('node:fs/promises');
 const local=await localDatabase();try{
  for(const name of (await readdir(new URL('../db/',import.meta.url))).filter(n=>/^00\d_.*\.sql$/.test(n)).sort())await local.pool.query(await readFile(new URL('../db/'+name,import.meta.url),'utf8'));
  const account=randomUUID();await local.pool.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[account,'synthetic-'+account]);
  for(const country of ['PA','CR'])await local.pool.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code) VALUES($1,$2,'Persona anterior','perfil-anterior',$3)",[randomUUID(),account,country]);
  await assert.rejects(local.pool.query(await readFile(new URL('../db/010_single_profile_maps.sql',import.meta.url),'utf8')),/ACCOUNT_DUPLICATES_REQUIRE_RECONCILIATION/);await local.pool.query('ROLLBACK');assert.equal((await local.pool.query('SELECT id FROM micontacto.profiles')).rows.length,2);
 }finally{await local.pool.close();}
});

test('persistencia de base WASM en disco tras cerrar y reabrir; no equivale a PostgreSQL nativo',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');const {localDatabase}=await import('../scripts/local-database.mjs');
 const root=await mkdtemp(join(tmpdir(),'mc-database-restart-'));let local;
 try{
  local=await localDatabase({dataDir:join(root,'database')});await local.migrate();const account=randomUUID();await local.pool.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[account,'synthetic-'+account]);
  const {profileRuntime}=await import('../profile-runtime.js');const created=await profileRuntime(local.pool).create(account,{country:'PA',linkName:'persistencia-local',displayName:'Persona sintética'});assert.equal(created.status,201);await local.pool.close();
  local=await localDatabase({dataDir:join(root,'database')});const profile=await profileRuntime(local.pool).detail(account,created.body.id);assert.equal(profile.url,created.body.url);assert.equal(profile.ownerId,account);assert.equal((await local.pool.query('SELECT * FROM micontacto.profile_slug_reservations')).rows.length,1);
 }finally{await local?.pool.close();await rm(root,{recursive:true,force:true});}
});

test('cola de fotos reemplazadas elimina solo archivos retirados; almacenamiento local autoriza borrado explícito',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');const {localPhotoStorage}=await import('../photo-storage-local.js');
 const root=await mkdtemp(join(tmpdir(),'mc-photo-cleanup-'));let f;try{
  const storage=await localPhotoStorage({root,isolated:true,allowDeletion:true});f=await testFixture({storage});const id=(await(await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'fotos-limpias',displayName:'Persona sintética'}})).json()).id;
  const bytes=await sharp({create:{width:20,height:20,channels:3,background:'blue'}}).png().toBuffer();
  await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:bytes});const first=(await f.pool.query('SELECT object_key FROM micontacto.photos WHERE profile_id=$1',[id])).rows[0].object_key;
  const response=await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:bytes});assert.equal(response.status,201);const latest=(await response.json()).id;
  assert.ok(await storage.get(first));assert.equal((await f.app.erasure.cleanup()).pending,0);assert.equal(await storage.get(first),null);assert.equal((await f.request('/media/'+id+'/'+latest)).status,200);
 }finally{await f?.pool.close();await rm(root,{recursive:true,force:true});}
});
