import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';
import {testFixture} from '../scripts/test-fixture.mjs';
import {yappySandbox} from '../yappy-sandbox.js';
import {receiptWorker} from '../payment-runtime.js';
const domain='https://micontacto.online',secret=Buffer.from('synthetic-micontacto-key.signature').toString('base64');
const config={environment:'test',isolated:true,merchantId:'synthetic-merchant',domain,ipnUrl:domain+'/api/payments/yappy/ipn',secret};
function notification(id,status='E'){const q=new URLSearchParams({orderId:id,status,domain});q.set('hash',createHmac('sha256','synthetic-micontacto-key').update(id+status+domain).digest('hex'));return q;}
test('Yappy sandbox: producción rechazada, firma, duplicados y proveedor incierto',async()=>{
 assert.throws(()=>yappySandbox({...config,environment:'production'}),/INVALID_PAYMENT_CONFIGURATION/);
 const y=yappySandbox(config,async()=>{throw Error('private-token');});
 assert.equal(y.verify(notification('abc123')).status,'PAID');
 const q=notification('abc123');q.append('status','E');assert.throws(()=>y.verify(q),/INVALID_PAYMENT_NOTIFICATION/);
 const tampered=notification('abc123');tampered.set('status','R');assert.throws(()=>y.verify(tampered),/INVALID_PAYMENT_SIGNATURE/);
 const foreign=notification('abc123');foreign.set('domain','https://direcciones507.com');assert.throws(()=>y.verify(foreign),/INVALID_PAYMENT_NOTIFICATION/);
 await assert.rejects(y.createOrder({provider_order_id:'abc123',amount_cents:190},'60000000'),/^Error: PAYMENT_PROVIDER_UNCONFIRMED$/);
});
test('checkout aislado: firma, propiedad, saldo, comprobante y borrado integral',async t=>{
 let fail=false,calls=0;
 const provider=yappySandbox(config,async(url,opts)=>{
  calls++;assert.ok(url.startsWith('https://api-comecom-uat.yappycloud.com/'));if(fail)throw Error('synthetic timeout');
  const data=JSON.parse(opts.body);return Response.json({body:url.endsWith('/merchant')?{token:'synthetic-token',epochTime:1}:{transactionId:'synthetic-tx-'+data.orderId,token:'synthetic-token',documentName:'synthetic-doc'}});
 });
 const f=await testFixture({paymentProvider:provider});
 try{
  const p=await f.app.profiles.create(f.owner,{country:'PA',linkName:'prueba-pagos',displayName:'Persona de prueba'});const id=p.body.id;
  await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED',directory_consent=true WHERE id=$1",[id]);
  const term=await f.app.features.prepare(f.owner,id,5),checkout='/api/profiles/'+id+'/checkout',payload={termId:term.id,key:randomUUID(),email:'synthetic@example.test'};
  let order;
  await t.test('pantalla de checkout privada, recursos UAT y sin credenciales',async()=>{
   const path='/pago-prueba/'+id;
   assert.equal((await f.request(path,{as:null})).status,401);assert.equal((await f.request(path,{as:'other'})).status,404);
   const page=await f.request(path);assert.equal(page.status,200);const html=await page.response.text();assert.match(html,/Sin cobro real/);assert.match(html,/payment-client.js/);assert.match(html,/bt-cdn-uat.yappycloud.com/);assert.doesNotMatch(html,/synthetic-token|synthetic-micontacto-key/);
   assert.match(page.response.headers.get('content-security-policy'),/api-comecom-uat.yappycloud.com/);assert.match(page.response.headers.get('x-robots-tag'),/noindex/);
   assert.equal((await f.request('/api/profiles/'+id+'/orders',{as:'other'})).status,404);
  });
  await t.test('precio de servidor, CSRF, propietario y orden única',async()=>{
   assert.equal((await f.request(checkout,{as:'other',method:'POST',body:payload})).status,404);
   assert.equal((await f.request(checkout,{method:'POST',body:payload,csrf:false})).status,403);
   assert.equal((await f.request(checkout,{method:'POST',body:{...payload,amountCents:1}})).status,400);
   const r=await f.request(checkout,{method:'POST',body:payload});assert.equal(r.status,201);order=await r.json();assert.equal(order.amountCents,890);assert.equal(order.environment,'test');
   const again=await f.request(checkout,{method:'POST',body:payload});assert.equal((await again.json()).id,order.id);
   assert.equal((await f.request('/api/payments/'+order.id,{as:'other'})).status,404);assert.equal(calls,0);
  });
  let signed;
  await t.test('inicialización única y retorno del navegador no confirma pago',async()=>{
   const init='/api/payments/'+order.id+'/initialize';assert.equal((await f.request(init,{method:'POST',body:{alias:'60000000'}})).status,200);
   assert.equal((await f.request(init,{method:'POST',body:{alias:'60000000'}})).status,409);assert.equal(calls,2);assert.equal((await(await f.request('/api/profiles/'+id+'/orders')).json()).items[0].initialized,true);
   const row=(await f.pool.query('SELECT * FROM micontacto.payment_orders WHERE id=$1',[order.id])).rows[0];signed=notification(row.provider_order_id);
   assert.equal((await f.request('/api/payments/'+order.id,{method:'POST',body:{status:'PAID'}})).status,404);
   assert.equal((await f.app.payments.read(f.owner,order.id)).status,'PENDING');
   const bad=new URLSearchParams(signed);bad.set('hash','0'.repeat(64));assert.equal((await f.request('/api/payments/yappy/ipn?'+bad,{as:null})).status,400);
  });
  await t.test('confirmación repetida: un saldo y un comprobante, sin consumo oculto',async()=>{
   await f.pool.query("UPDATE micontacto.profiles SET status='BLOCKED' WHERE id=$1",[id]);
   const results=await Promise.all(Array.from({length:4},()=>f.request('/api/payments/yappy/ipn?'+signed,{as:null})));assert.deepEqual(results.map(r=>r.status),[200,200,200,200]);
   assert.equal((await f.app.payments.read(f.owner,order.id)).status,'PAID');
   const state=(await f.app.features.snapshot(id)).terms.find(x=>x.id===term.id);assert.equal(state.state,'PAUSED');assert.equal(Number(state.remaining_ms),5*86400000);
   assert.equal(Number((await f.pool.query('SELECT count(*) n FROM micontacto.payment_receipts')).rows[0].n),1);
   const late=new URLSearchParams(signed);late.set('status','R');const row=(await f.pool.query('SELECT provider_order_id FROM micontacto.payment_orders WHERE id=$1',[order.id])).rows[0];await f.app.payments.confirm(notification(row.provider_order_id,'R'));assert.equal((await f.app.payments.read(f.owner,order.id)).status,'PAID');
  });
  await t.test('correo pendiente persiste, reintento estable y fallo no revierte pago',async()=>{
   const keys=[];let error=true;const send=receiptWorker(f.pool,async msg=>{keys.push(msg.idempotencyKey);assert.match(msg.text,/COMPROBANTE DE PRUEBA/);assert.match(msg.text,/USD 7.99/);assert.match(msg.text,/YAPPY/);if(error)throw Error('timeout');return {id:'synthetic-email-id'};});
   assert.equal((await send()).sent,false);assert.equal((await f.app.payments.read(f.owner,order.id)).status,'PAID');
   await f.pool.query('UPDATE micontacto.payment_receipts SET next_attempt_at=now()');error=false;assert.equal((await send()).sent,true);assert.equal(keys[0],keys[1]);assert.equal((await send()).processed,false);
  });
  await t.test('eliminación autorizada retira órdenes y destinatarios de prueba',async()=>{
   const r=await f.request('/api/profiles/'+id+'/removal',{method:'POST',body:{confirm:true}});assert.equal(r.status,202);
   const removal=(await f.pool.query('SELECT id FROM micontacto.removal_requests WHERE profile_id=$1',[id])).rows[0];await f.app.erasure.approve(f.admin,removal.id,{confirm:true,reason:'Borrado de prueba'});
   assert.equal(Number((await f.pool.query('SELECT count(*) n FROM micontacto.payment_orders')).rows[0].n),0);assert.equal(Number((await f.pool.query('SELECT count(*) n FROM micontacto.payment_receipts')).rows[0].n),0);
  });
  await t.test('pago tardío firmado, rollback atómico y activación elegible',async()=>{
   const made=await f.app.profiles.create(f.owner,{country:'PA',linkName:'pago-activo',displayName:'Persona prueba'}),id=made.body.id;
   await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED',directory_consent=true WHERE id=$1",[id]);
   const term=await f.app.features.prepare(f.owner,id,1),o=await f.app.payments.prepare(f.owner,id,{termId:term.id,key:randomUUID(),email:'synthetic@example.test'});
   await f.app.payments.initialize(f.owner,o.id,'60000000');const row=(await f.pool.query('SELECT provider_order_id FROM micontacto.payment_orders WHERE id=$1',[o.id])).rows[0];
   await f.app.payments.confirm(notification(row.provider_order_id,'C'));assert.equal((await f.app.payments.read(f.owner,o.id)).status,'CANCELLED');
   const second=await f.app.features.prepare(f.owner,id,5);await assert.rejects(f.app.payments.prepare(f.owner,id,{termId:second.id,key:randomUUID(),email:'synthetic@example.test'}),/PAYMENT_CONFLICT/);
   await f.pool.query("CREATE FUNCTION micontacto.synthetic_receipt_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic rollback'; END $$; CREATE TRIGGER synthetic_receipt_failure BEFORE INSERT ON micontacto.payment_receipts FOR EACH ROW EXECUTE FUNCTION micontacto.synthetic_receipt_failure()");
   await assert.rejects(f.app.payments.confirm(notification(row.provider_order_id)),/synthetic rollback/);
   assert.equal((await f.app.payments.read(f.owner,o.id)).status,'CANCELLED');assert.equal((await f.app.features.snapshot(id)).terms.find(t=>t.id===term.id).state,'PREPARED');
   await f.pool.query('DROP TRIGGER synthetic_receipt_failure ON micontacto.payment_receipts; DROP FUNCTION micontacto.synthetic_receipt_failure()');
   await f.app.payments.confirm(notification(row.provider_order_id));assert.equal((await f.app.features.snapshot(id)).terms.find(t=>t.id===term.id).state,'ACTIVE');
   await f.pool.query("UPDATE micontacto.payment_receipts SET first_attempt_at=now()-interval '24 hours'");let calls=0;
   assert.equal((await receiptWorker(f.pool,async()=>{calls++;return {id:'unused'};})()).review,true);assert.equal(calls,0);
  });
  await t.test('fallo ambiguo deja orden pendiente y bloquea doble inicialización',async()=>{
   const p=await f.app.profiles.create(f.other,{country:'PA',linkName:'pago-incierto',displayName:'Persona prueba'}),id=p.body.id,term=await f.app.features.prepare(f.other,id,1);
   const order=await f.app.payments.prepare(f.other,id,{termId:term.id,key:randomUUID(),email:'synthetic@example.test'});fail=true;
   await assert.rejects(f.app.payments.initialize(f.other,order.id,'60000000'),/PAYMENT_PROVIDER_UNCONFIRMED/);
   await assert.rejects(f.app.payments.initialize(f.other,order.id,'60000000'),/PAYMENT_CONFLICT/);
   assert.equal((await f.app.payments.read(f.other,order.id)).status,'PENDING');
  });
 }finally{await f.pool.close();}
});
test('checkout desactivado por defecto, incluso sin credenciales',async()=>{const f=await testFixture();try{assert.equal((await(await f.request('/api/payments/config')).json()).enabled,false);await assert.rejects(f.app.payments.confirm(new URLSearchParams()),/PAYMENTS_DISABLED/);}finally{await f.pool.close();}});
