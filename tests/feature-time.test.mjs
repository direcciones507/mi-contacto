import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {testFixture} from '../scripts/test-fixture.mjs';
import {FEATURE_PRICES} from '../feature-policy.js';
import {featureRuntime} from '../feature-runtime.js';

test('Destacados: saldo persistido, privacidad, idempotencia y auditoría',async t=>{
 const f=await testFixture({simulation:true});let clock=Date.now()+1000;
 // Test-only replacement in this newly created disposable database. Never loaded by runtime.
 await f.pool.query('CREATE TABLE micontacto.synthetic_clock(at timestamptz NOT NULL)');
 await f.pool.query('INSERT INTO micontacto.synthetic_clock VALUES($1)',[new Date(clock)]);
 await f.pool.query(`CREATE OR REPLACE FUNCTION micontacto.feature_now() RETURNS timestamptz LANGUAGE sql VOLATILE AS $$ UPDATE micontacto.feature_clock SET high_water=greatest(high_water,(SELECT at FROM micontacto.synthetic_clock)) WHERE singleton RETURNING high_water $$`);
 const advance=async ms=>{clock+=ms;await f.pool.query('UPDATE micontacto.synthetic_clock SET at=$1',[new Date(clock)]);};
 const owners=new Map();const create=async(country='PA',as=country==='CR'?'other':'owner')=>{const r=await f.request('/api/profiles',{as,method:'POST',body:{country,linkName:'saldo-'+randomUUID(),displayName:'Persona sintética'}});assert.equal(r.status,201);const id=(await r.json()).id;owners.set(id,as);await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED',directory_consent=true WHERE id=$1",[id]);return id;};
 const detail=async id=>(await f.app.profiles.detail(f[owners.get(id)],id));
 const prepare=async(id,days)=>{const r=await f.request('/api/profiles/'+id+'/feature',{as:owners.get(id),method:'POST',body:{days}});assert.equal(r.status,201);return r.json();};
 const activate=async(id,days,key='synthetic-'+randomUUID())=>{const term=await prepare(id,days);await f.app.features.activateSimulation(f[owners.get(id)],id,term.id,key);return term;};
 const directory=async()=>(await(await f.request('/api/directory?country=PA',{as:null})).json()).items;
 try{
  const id=await create();let term,path,qr;
  await t.test('gratuita solo por enlace y QR, nunca en directorio',async()=>{const p=await detail(id);path='/pa/'+p.slug;assert.equal((await directory()).length,0);assert.equal((await f.request(path,{as:null})).status,200);qr=await(await f.request(path+'/qr.svg',{as:null})).response.text();assert.match(qr,/<svg/);});
  await t.test('siete paquetes exactos y el cliente no puede activar ni alterar saldo',async()=>{
   for(const [days,cents] of Object.entries(FEATURE_PRICES)){const x=await prepare(id,Number(days));assert.equal(x.amountCents,cents);assert.equal(x.paymentEnabled,false);assert.equal((await prepare(id,Number(days))).id,x.id);await f.app.features.activateSimulation(f.owner,id,x.id,'synthetic-'+randomUUID());const balance=(await detail(id)).featureTerms.find(t=>t.id===x.id);assert.equal(balance.remainingSeconds,Number(days)*86400);assert.equal(balance.usedSeconds,0);await f.app.features.cancel(f.admin,x.id,'Fin del paquete sintético');}
   assert.equal((await directory()).length,0);
   assert.equal((await f.request('/api/profiles/'+id+'/feature',{method:'POST',body:{days:1,remainingSeconds:999999}})).status,400);
   assert.equal((await f.request('/api/profiles/'+id+'/feature',{method:'POST',body:{days:2}})).status,400);
   assert.equal((await f.request('/api/profiles/'+id,{method:'PATCH',body:{remainingSeconds:9999}})).status,400);
   assert.equal((await f.request('/api/profiles/'+id+'/feature',{as:'other',method:'POST',body:{days:1}})).status,404);
   assert.equal((await f.request('/api/profiles/'+id+'/activate',{method:'POST'})).status,404);
   await assert.rejects(featureRuntime(f.pool).activateSimulation(f.owner,id,randomUUID(),'synthetic-'+randomUUID()),/SIMULATION_DISABLED/);
  });
  await t.test('24h: 12h consumidas, pausa tres días y reanudar conserva exactamente 12h',async()=>{
   const pending=await prepare(id,1);await advance(86400000);assert.equal((await detail(id)).featureTerms.find(x=>x.id===pending.id).remainingSeconds,86400);term=await activate(id,1);assert.equal((await directory()).length,1);await advance(12*3600000);
   const both=await Promise.all([f.request('/api/profiles/'+id+'/pause',{method:'POST'}),f.request('/api/profiles/'+id+'/pause',{method:'POST'})]);assert.deepEqual(both.map(x=>x.status),[200,200]);
   await advance(3*86400000);let p=await detail(id),x=p.featureTerms.find(x=>x.id===term.id);assert.equal(x.remainingSeconds,43200);assert.equal(x.usedSeconds,43200);assert.equal(x.state,'PAUSED');assert.equal((await directory()).length,0);
   assert.equal((await f.request(path,{as:null})).status,200);assert.equal(await(await f.request(path+'/qr.svg',{as:null})).response.text(),qr);
   assert.equal((await f.request('/api/profiles/'+id+'/resume',{method:'POST'})).status,200);assert.equal((await directory()).length,1);assert.equal((await detail(id)).featureTerms.find(x=>x.id===term.id).remainingSeconds,43200);
  });
  await t.test('reintentos, múltiples sesiones, ciclos subsegundo y reloj atrasado no regalan tiempo',async()=>{
   for(let i=0;i<5;i++){await advance(123);await f.request('/api/profiles/'+id+'/pause',{method:'POST'});await advance(456);await f.request('/api/profiles/'+id+'/resume',{method:'POST'});}
   const before=(await detail(id)).featureTerms.find(x=>x.id===term.id).remainingSeconds;assert.equal(before,43200-.615);
   await f.request('/api/profiles/'+id+'/resume',{method:'POST'});await advance(-600000);assert.equal((await detail(id)).featureTerms.find(x=>x.id===term.id).remainingSeconds,before);await advance(600000);
   const another=await f.app.auth.issue(f.owner);const r=await f.app.handle(new Request(f.origin+'/api/profiles/'+id+'/pause',{method:'POST',headers:{cookie:'mc_session='+another.token,origin:f.origin,'x-mc-csrf':another.csrf,'content-type':'application/json'},body:JSON.stringify({now:'1990-01-01',remainingSeconds:999999})}));assert.equal(r.status,200);assert.equal((await detail(id)).featureTerms.find(x=>x.id===term.id).remainingSeconds,before);
   await f.request('/api/profiles/'+id+'/resume',{method:'POST'});
  });
  await t.test('agotamiento exacto, caída automática de resultados y enlace/QR intactos',async()=>{
   const x=(await detail(id)).featureTerms.find(x=>x.id===term.id);await advance(x.remainingSeconds*1000-1);assert.equal((await directory()).length,1);await advance(1);assert.equal((await directory()).length,0);
   assert.equal((await f.request(path,{as:null})).status,200);assert.equal(await(await f.request(path+'/qr.svg',{as:null})).response.text(),qr);
   const p=await detail(id);assert.equal(p.featureTerms.find(x=>x.id===term.id).state,'EXPIRED');assert.equal(p.featureTerms.find(x=>x.id===term.id).remainingSeconds,0);assert.equal((await f.request('/api/profiles/'+id+'/resume',{method:'POST'})).status,409);
  });
  await t.test('consentimiento y privacidad siguen vigentes con saldo contratado',async()=>{
   const privateId=await create('CR');const term=await activate(privateId,1);const p=await detail(privateId);
   await f.pool.query('UPDATE micontacto.profiles SET directory_consent=false,phone=$2,whatsapp=$2,contact_consent=false WHERE id=$1',[privateId,'+50760000000']);
   assert.equal((await(await f.request('/api/directory?country=CR',{as:null})).json()).items.length,0);
   const page=await f.request('/cr/'+p.slug,{as:null});assert.equal(page.status,200);assert.doesNotMatch(await page.response.text(),/60000000/);
   await f.request('/api/profiles/'+privateId+'/pause',{as:'other',method:'POST'});assert.equal((await f.request('/api/profiles/'+privateId+'/resume',{as:'other',method:'POST'})).status,409);
   await f.app.features.cancel(f.admin,term.id,'Fin de privacidad sintética');
  });
  await t.test('confirmación sintética no reutilizable y doble activación sin duplicar saldo',async()=>{
   const key='synthetic-'+randomUUID(),next=await prepare(id,5);
   await Promise.all([f.app.features.activateSimulation(f.owner,id,next.id,key),f.app.features.activateSimulation(f.owner,id,next.id,key)]);
   assert.equal((await detail(id)).featureTerms.filter(t=>t.state==='ACTIVE').length,1);
   const cr=(await f.pool.query("SELECT id FROM micontacto.profiles WHERE country_code='CR' AND account_id=$1",[f.other])).rows[0].id;await f.pool.query('UPDATE micontacto.profiles SET directory_consent=true WHERE id=$1',[cr]);const otherTerm=await prepare(cr,1);await assert.rejects(f.app.features.activateSimulation(f.other,cr,otherTerm.id,key),e=>e.code==='23505');
   assert.equal((await detail(cr)).featureTerms.find(t=>t.id===otherTerm.id).state,'PREPARED');
   assert.equal((await f.request('/api/profiles/'+id+'/feature',{method:'POST',body:{days:10}})).status,409);
  });
  await t.test('ADMIN ve propietario, tiempos e historial; bloqueo impide reanudar',async()=>{
   const admin=await(await f.request('/api/admin/profiles/'+id,{as:'admin'})).json();assert.equal(admin.ownerId,f.owner);assert.ok(admin.featureEvents.some(e=>e.action==='PAUSED'));assert.ok(admin.featureEvents.some(e=>e.action==='RESUMED'));assert.ok(admin.featureTerms.some(t=>t.startsAt&&Number.isFinite(t.usedSeconds)));
   assert.equal((await f.request('/api/admin/profiles/'+id,{as:'admin',method:'POST',body:{action:'BLOCK',version:admin.version,reason:'Bloqueo sintético'}})).status,200);
   assert.equal((await f.request('/api/profiles/'+id+'/resume',{method:'POST'})).status,409);assert.equal((await f.request(path,{as:null})).status,404);assert.equal((await directory()).length,0);const frozen=(await detail(id)).featureTerms.find(t=>t.state==='PAUSED');assert.ok(frozen);await advance(86400000);assert.equal((await detail(id)).featureTerms.find(t=>t.id===frozen.id).remainingSeconds,frozen.remainingSeconds);assert.ok((await detail(id)).featureEvents.some(e=>e.action==='AUTO_PAUSED'));
   await assert.rejects(f.pool.query(readFileSync(new URL('../db/rollback_008.sql',import.meta.url),'utf8')),/ROLLBACK_REQUIRES_DATA_PRESERVATION/);await f.pool.query('ROLLBACK');assert.ok((await detail(id)).featureEvents.length>0);
  });
 }finally{await f.pool.close();}
});
