import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applicationOrigin} from '../origin-policy.js';
import {testFixture} from '../scripts/test-fixture.mjs';
test('acceptance origin: opt-in explícito y dominio propio o servicio Mi Contacto',()=>{
 for(const origin of ['https://pruebas.micontacto.online','https://mi-contacto-acceptance-production.up.railway.app']){
  assert.throws(()=>applicationOrigin(origin),/INVALID_ORIGIN/);assert.equal(applicationOrigin(origin,{acceptance:true}).origin,origin);
 }
 for(const origin of ['https://empleospa.com','https://direcciones507.com','https://leveia.up.railway.app','https://mi-contacto-test.up.railway.app.evil.test','http://mi-contacto-test.up.railway.app','https://micontacto.online/path'])assert.throws(()=>applicationOrigin(origin,{acceptance:true}),/INVALID_ORIGIN/);
});
test('enlace de aceptación y QR usan origen propio y se conservan al mudar país',async()=>{
 const origin='https://mi-contacto-acceptance-production.up.railway.app',f=await testFixture({origin,acceptance:true});try{
  const p=await f.app.profiles.create(f.owner,{country:'PA',linkName:'enlace-prueba',displayName:'Persona sintética'});const id=p.body.id;
  const before=await f.app.profiles.detail(f.owner,id);assert.equal(before.url,origin+'/pa/enlace-prueba');
  const reply=await f.request('/api/profiles/'+id,{method:'PATCH',body:{version:before.version,country:'CR',displayName:'Persona sintética',profession:'Oficio',description:'Prueba',...f.geo.CR}});assert.equal(reply.status,200);
  assert.equal((await f.app.profiles.detail(f.owner,id)).url,before.url);
 }finally{await f.pool.close();}
});
