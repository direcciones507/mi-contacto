import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {testFixture} from '../scripts/test-fixture.mjs';

test('privacidad: ocultación reversible y solicitud de eliminación no destructiva',async t=>{
 const f=await testFixture({simulation:true});let id,photo,removal,originalQR;
 const path='/pa/privacidad-sintetica';
 const detail=async()=>(await(await f.request('/api/profiles/'+id)).json());
 const directory=async()=>(await(await f.request('/api/directory?country=PA',{as:null})).json()).items;
 try{
  await t.test('gratuita sin consentimiento de directorio se aprueba y publica solo por enlace',async()=>{
   const c=await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'privacidad-sintetica',displayName:'Persona sintética',profession:'Prueba'}});id=(await c.json()).id;let p=await detail();
   assert.equal((await f.request('/api/profiles/'+id,{method:'PATCH',body:{version:p.version,displayName:p.displayName,profession:'Prueba',description:'Descripción sintética',phone:'+50760000000',whatsapp:'+50760000000',...f.geo.PA,directoryConsent:false,contactConsent:false,locationConsent:false,latitude:null,longitude:null}})).status,200);
   const bytes=await sharp({create:{width:25,height:25,channels:3,background:'blue'}}).png().toBuffer();photo=(await(await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:bytes})).json()).id;
   await f.request('/api/profiles/'+id+'/publish',{method:'POST'});p=await detail();assert.equal((await f.request('/api/admin/profiles/'+id,{as:'admin',method:'POST',body:{action:'APPROVE',version:p.version,reason:'Aprobación sintética gratuita'}})).status,200);
   const r=await f.request(path,{as:null});assert.equal(r.status,200);assert.doesNotMatch(await r.response.text(),/60000000|wa.me|maps\/search|Localidad sintética|Región sintética/);assert.equal((await directory()).length,0);originalQR=await(await f.request(path+'/qr.svg',{as:null})).response.text();
  });
  await t.test('ocultar exige propietario y CSRF; ocultar corta ficha, QR y fotos públicos',async()=>{
   assert.equal((await f.request('/api/profiles/'+id+'/privacy',{as:'other',method:'POST',body:{hidden:true}})).status,404);
   assert.equal((await f.request('/api/profiles/'+id+'/privacy',{method:'POST',csrf:false,body:{hidden:true}})).status,403);
   assert.equal((await f.request('/api/profiles/'+id+'/privacy',{method:'POST',body:{hidden:true,ownerId:f.other}})).status,400);
   assert.equal((await f.request('/api/profiles/'+id+'/privacy',{method:'POST',body:{hidden:true}})).status,200);
   for(const url of [path,path+'/qr.svg','/media/'+id+'/'+photo])assert.equal((await f.request(url,{as:null})).status,404);
   assert.equal((await f.request('/media/'+id+'/'+photo)).status,200);assert.equal((await detail()).privacyHidden,true);
   assert.equal((await f.request('/api/profiles/'+id+'/privacy',{method:'POST',body:{hidden:false}})).status,200);assert.equal(await(await f.request(path+'/qr.svg',{as:null})).response.text(),originalQR);
  });
  await t.test('ocultación con Destacado congela saldo y mostrar no reanuda automáticamente',async()=>{
   await f.pool.query('UPDATE micontacto.profiles SET directory_consent=true WHERE id=$1',[id]);const term=await f.app.features.prepare(f.owner,id,1);await f.app.features.activateSimulation(f.owner,id,term.id,'synthetic-'+randomUUID());assert.equal((await directory()).length,1);
   const filtered='/api/directory?country=PA&regionId='+f.geo.PA.regionId+'&localityId='+f.geo.PA.localityId;
   assert.equal((await(await f.request(filtered,{as:null})).json()).items.length,0);await f.pool.query('UPDATE micontacto.profiles SET location_consent=true WHERE id=$1',[id]);assert.equal((await(await f.request(filtered,{as:null})).json()).items.length,1);assert.match(await(await f.request(path,{as:null})).response.text(),/Localidad sintética/);await f.pool.query('UPDATE micontacto.profiles SET location_consent=false WHERE id=$1',[id]);assert.doesNotMatch(await(await f.request(path,{as:null})).response.text(),/Localidad sintética|Región sintética/);
   await f.request('/api/profiles/'+id+'/privacy',{method:'POST',body:{hidden:true}});const frozen=(await detail()).featureTerms.find(t=>t.id===term.id);assert.equal(frozen.state,'PAUSED');assert.equal((await f.request('/api/profiles/'+id+'/resume',{method:'POST'})).status,409);
   await f.request('/api/profiles/'+id+'/privacy',{method:'POST',body:{hidden:false}});assert.equal((await directory()).length,0);assert.equal((await detail()).featureTerms.find(t=>t.id===term.id).remainingSeconds,frozen.remainingSeconds);assert.equal((await f.request('/api/profiles/'+id+'/resume',{method:'POST'})).status,200);
  });
  await t.test('solicitud repetida registra una sola petición y bloquea republicación sin borrar',async()=>{
   assert.equal((await f.request('/api/profiles/'+id+'/removal',{method:'POST',body:{confirm:false}})).status,400);
   const requests=await Promise.all([1,2].map(()=>f.request('/api/profiles/'+id+'/removal',{method:'POST',body:{confirm:true}})));const a=await requests[0].json(),b=await requests[1].json();assert.equal(requests[0].status,202);assert.equal(a.id,b.id);assert.equal(a.physicalDeletion,false);removal=a.id;
   assert.equal((await f.request(path,{as:null})).status,404);assert.equal((await directory()).length,0);assert.equal((await f.request('/api/profiles/'+id+'/privacy',{method:'POST',body:{hidden:false}})).status,409);assert.equal((await f.request('/api/profiles/'+id+'/resume',{method:'POST'})).status,409);
   assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.profiles WHERE id=$1',[id])).rows[0].n,1);assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.photos WHERE profile_id=$1',[id])).rows[0].n,1);assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.profile_slug_reservations WHERE profile_id=$1',[id])).rows[0].n,1);
   assert.equal((await f.pool.query("SELECT count(*)::int AS n FROM micontacto.audit WHERE profile_id=$1 AND action='REMOVAL_REQUESTED'",[id])).rows[0].n,1);
  });
  await t.test('ADMIN acusa revisión con motivo y auditoría; no afirma ni ejecuta borrado físico',async()=>{
   assert.equal((await f.request('/api/admin/removals')).status,403);assert.equal((await f.request('/api/admin/removals/'+removal,{method:'POST',body:{reason:'Sin permiso'}})).status,403);
   const admin=(await(await f.request('/api/admin/removals',{as:'admin'})).json()).items;assert.equal(admin[0].account_id,f.owner);
   assert.equal((await f.request('/api/admin/removals/'+removal,{as:'admin',method:'POST',body:{reason:'Revisión sintética sin purga'}})).status,200);assert.equal((await f.request('/api/admin/removals/'+removal,{as:'admin',method:'POST',body:{reason:'Reintento sintético'}})).status,200);
   assert.equal((await detail()).removalRequest.state,'ACKNOWLEDGED');assert.equal((await f.request('/media/'+id+'/'+photo,{as:null})).status,404);
   assert.equal((await f.pool.query("SELECT count(*)::int AS n FROM micontacto.audit WHERE profile_id=$1 AND action='REMOVAL_ACKNOWLEDGED'",[id])).rows[0].n,1);
   await assert.rejects(f.pool.query(readFileSync(new URL('../db/rollback_009.sql',import.meta.url),'utf8')),/ROLLBACK_REQUIRES_DATA_PRESERVATION/);await f.pool.query('ROLLBACK');assert.equal((await detail()).privacyHidden,true);
  });
 }finally{await f.pool.close();}
});
