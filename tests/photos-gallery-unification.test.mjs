import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {randomUUID} from 'node:crypto';
import {testFixture} from '../scripts/test-fixture.mjs';

test('foto principal gratuita y cuatro extras vigentes; reemplazo al límite, propiedad y expiración',async()=>{
 const f=await testFixture({simulation:true});try{
  const id=(await(await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'fotografias-consolidadas',displayName:'Persona sintética'}})).json()).id;
  const bytes=await sharp({create:{width:24,height:24,channels:3,background:'blue'}}).png().toBuffer();
  const upload=(query,as='owner')=>f.request('/api/profiles/'+id+'/photos?'+query,{as,method:'POST',raw:true,body:bytes});
  assert.equal((await upload('role=MAIN')).status,201);assert.equal((await upload('role=GALLERY')).status,409);
  await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED',directory_consent=true WHERE id=$1",[id]);const term=await f.app.features.prepare(f.owner,id,1);await f.app.features.activateSimulation(f.owner,id,term.id,'synthetic-gallery-'+randomUUID());
  const gallery=[];for(let i=0;i<4;i++){const r=await upload('role=GALLERY');assert.equal(r.status,201);gallery.push((await r.json()).id);}assert.equal((await upload('role=GALLERY')).status,409);
  assert.equal((await upload('role=GALLERY&replace='+gallery[0],'other')).status,404);const r=await upload('role=GALLERY&replace='+gallery[0]);assert.equal(r.status,201);const replacement=(await r.json()).id;
  const p=await f.app.profiles.detail(f.owner,id);assert.equal(p.photos.length,5);assert.equal(p.photos.filter(p=>p.role==='MAIN').length,1);assert.equal(p.photos.filter(p=>p.role==='GALLERY').length,4);assert.ok(p.photos.some(p=>p.id===replacement));assert.ok(!p.photos.some(p=>p.id===gallery[0]));assert.equal((await f.request('/media/'+id+'/'+gallery[0])).status,404);
  assert.equal((await f.request('/api/profiles/'+id+'/photos/'+replacement,{method:'DELETE'})).status,200);assert.equal((await f.app.profiles.detail(f.owner,id)).photos.length,4);
  await f.pool.query("UPDATE micontacto.feature_terms SET state='EXPIRED',remaining_ms=0,anchor_at=NULL WHERE id=$1",[term.id]);assert.equal((await upload('role=GALLERY')).status,409);
  assert.equal((await upload('role=MAIN')).status,201);assert.equal((await f.app.profiles.detail(f.owner,id)).photos.filter(p=>p.role==='MAIN').length,1);
 }finally{await f.pool.close();}
});
