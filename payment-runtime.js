import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {transaction} from './profile-runtime.js';
import {featureQuote} from './feature-policy.js';
const emailPattern=/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
export function paymentRuntime(pool,{provider=null}={}){
 if(provider&&provider.environment!=='test')throw Error('INVALID_PAYMENT_CONFIGURATION');
 const enabled=()=>{if(!provider)throw Error('PAYMENTS_DISABLED');};
 async function own(tx,actor,id){const p=(await tx.query("SELECT p.*,a.status AS account_status FROM micontacto.profiles p JOIN micontacto.accounts a ON a.id=p.account_id WHERE p.id=$1 AND p.account_id=$2 FOR UPDATE OF p",[id,actor])).rows[0];if(!p)throw Error('NOT_FOUND');if(p.account_status!=='ACTIVE'||['BLOCKED','DELETED'].includes(p.status))throw Error('PROFILE_LOCKED');return p;}
 const safe=o=>({id:o.id,profileId:o.profile_id,termId:o.term_id,provider:o.provider,environment:o.environment,amountCents:o.amount_cents,currency:o.currency,status:o.status,confirmedAt:o.confirmed_at,initialized:!!o.provider_reference});
 async function prepare(actor,id,{termId,key,email,...extra}){
  enabled();if(Object.keys(extra).length||typeof key!=='string'||!/^[A-Za-z0-9_-]{16,128}$/.test(key)||typeof email!=='string'||email.length>254||!emailPattern.test(email))throw Error('INVALID_PAYMENT_REQUEST');
  return transaction(pool,async tx=>{
   const p=await own(tx,actor,id);if(p.country_code!=='PA')throw Error('INVALID_PAYMENT_COUNTRY');
   const t=(await tx.query('SELECT * FROM micontacto.feature_terms WHERE id=$1 AND profile_id=$2 FOR UPDATE',[termId,id])).rows[0];if(!t)throw Error('NOT_FOUND');const q=featureQuote(t.days);
   if(q.amountCents!==t.amount_cents)throw Error('INVALID_PAYMENT_AMOUNT');
   const operation=createHash('sha256').update('micontacto:yappy:test:'+actor+':'+id+':'+key).digest('hex');
   const previous=(await tx.query('SELECT * FROM micontacto.payment_orders WHERE operation_key=$1 OR term_id=$2',[operation,t.id])).rows[0];
   if(previous){if(previous.term_id!==t.id||previous.receipt_email!==email)throw Error('PAYMENT_CONFLICT');return safe(previous);}
   if((await tx.query("SELECT id FROM micontacto.payment_orders WHERE profile_id=$1 AND status<>'PAID'",[id])).rows.length)throw Error('PAYMENT_CONFLICT');
   if(t.state!=='PREPARED'||(await tx.query("SELECT id FROM micontacto.feature_terms WHERE profile_id=$1 AND state IN ('ACTIVE','PAUSED')",[id])).rows.length)throw Error('FEATURE_CONFLICT');
   const order=(await tx.query("INSERT INTO micontacto.payment_orders(id,profile_id,account_id,term_id,provider,environment,provider_order_id,operation_key,amount_cents,receipt_email) VALUES($1,$2,$3,$4,'YAPPY','test',$5,$6,$7,$8) RETURNING *",[randomUUID(),id,actor,t.id,randomBytes(7).toString('hex'),operation,q.amountCents,email])).rows[0];return safe(order);
  });
 }
 async function initialize(actor,id,alias){
  enabled();if(!/^6[0-9]{7}$/.test(alias??''))throw Error('INVALID_YAPPY_ORDER');
  const o=await transaction(pool,async tx=>{
   const ref=(await tx.query('SELECT profile_id FROM micontacto.payment_orders WHERE id=$1 AND account_id=$2',[id,actor])).rows[0];if(!ref)throw Error('NOT_FOUND');const p=await own(tx,actor,ref.profile_id);if(p.country_code!=='PA')throw Error('INVALID_PAYMENT_COUNTRY');
   const o=(await tx.query('SELECT * FROM micontacto.payment_orders WHERE id=$1 FOR UPDATE',[id])).rows[0];
   if(o.status!=='PENDING'||o.provider_reference)throw Error('PAYMENT_CONFLICT');
   await tx.query("UPDATE micontacto.payment_orders SET provider_reference='INITIALIZING:'||provider_order_id WHERE id=$1",[id]);return o;
  });
  // Leave marker committed on ambiguous network failure: never issue a second debit.
  const result=await provider.createOrder(o,alias);
  const r=await pool.query("UPDATE micontacto.payment_orders SET provider_reference=$2 WHERE id=$1 AND provider_reference='INITIALIZING:'||provider_order_id RETURNING id",[id,result.transactionId]);
  if(!r.rows.length)throw Error('PAYMENT_CONFLICT');return {orderId:id,...result};
 }
 async function confirm(query){
  enabled();const proof=provider.verify(query);
  return transaction(pool,async tx=>{
   const ref=(await tx.query('SELECT profile_id FROM micontacto.payment_orders WHERE provider_order_id=$1',[proof.orderId])).rows[0];if(!ref)throw Error('NOT_FOUND');
   // Profile-first lock order matches moderation, edits, deletion and purchases.
   const p=(await tx.query('SELECT p.*,a.status AS account_status,cs.enabled AS country_enabled FROM micontacto.profiles p JOIN micontacto.accounts a ON a.id=p.account_id JOIN micontacto.country_settings cs ON cs.code=p.country_code WHERE p.id=$1 FOR UPDATE OF p',[ref.profile_id])).rows[0];if(!p)throw Error('NOT_FOUND');
   const o=(await tx.query('SELECT * FROM micontacto.payment_orders WHERE provider_order_id=$1 FOR UPDATE',[proof.orderId])).rows[0];
   if(!o.provider_reference||o.provider_reference.startsWith('INITIALIZING:'))throw Error('PAYMENT_UNCONFIRMED');
   const t=(await tx.query('SELECT * FROM micontacto.feature_terms WHERE id=$1 FOR UPDATE',[o.term_id])).rows[0];
   if(o.amount_cents!==t.amount_cents||o.currency!=='USD')throw Error('INVALID_PAYMENT_AMOUNT');
   if(o.status==='PAID'||o.status===proof.status)return {id:o.id,status:o.status,replayed:true};
   if(o.status!=='PENDING'&&proof.status!=='PAID')return {id:o.id,status:o.status,replayed:true};
   if(proof.status==='PAID'){
    if(t.state!=='PREPARED')throw Error('FEATURE_CONFLICT');
    if((await tx.query("SELECT id FROM micontacto.feature_terms WHERE profile_id=$1 AND state IN ('ACTIVE','PAUSED')",[p.id])).rows.length)throw Error('FEATURE_CONFLICT');
    const at=(await tx.query('SELECT micontacto.feature_now() AS at')).rows[0].at;
    const active=!p.privacy_hidden&&p.status==='ACTIVE'&&p.review_decision==='APPROVED'&&p.directory_consent&&p.account_status==='ACTIVE'&&p.country_enabled;
    await tx.query("UPDATE micontacto.feature_terms SET state=$2,starts_at=$3,observed_at=$3,anchor_at=CASE WHEN $2='ACTIVE' THEN $3::timestamptz END,expires_at=CASE WHEN $2='ACTIVE' THEN $3::timestamptz+remaining_ms*interval '1 millisecond' END,confirmation_key=$4 WHERE id=$1",[t.id,active?'ACTIVE':'PAUSED',at,'micontacto:yappy:test:'+o.provider_order_id]);
    await tx.query("INSERT INTO micontacto.feature_events(id,term_id,actor_id,action,remaining_ms,happened_at,reason) VALUES($1,$2,$3,'PAYMENT_CONFIRMED_TEST',$4,$5,$6)",[randomUUID(),t.id,o.account_id,t.remaining_ms,at,active?'Confirmación de prueba':'Confirmación de prueba; pendiente de elegibilidad']);
    await tx.query('INSERT INTO micontacto.payment_receipts(order_id) VALUES($1) ON CONFLICT DO NOTHING',[o.id]);
   }
   await tx.query("UPDATE micontacto.payment_orders SET status=$2,confirmed_at=CASE WHEN $2='PAID' THEN now() ELSE NULL END WHERE id=$1",[o.id,proof.status]);
   await tx.query("INSERT INTO micontacto.audit(id,actor_id,profile_id,action,reason) VALUES($1,$2,$3,'PAYMENT_'||$4::text,'Yappy test; sin cobro real')",[randomUUID(),o.account_id,p.id,proof.status]);
   return {id:o.id,status:proof.status};
  });
 }
 async function read(actor,id){const o=(await pool.query('SELECT o.* FROM micontacto.payment_orders o JOIN micontacto.accounts a ON a.id=o.account_id WHERE o.id=$1 AND o.account_id=$2 AND a.status=\'ACTIVE\'',[id,actor])).rows[0];if(!o)throw Error('NOT_FOUND');return safe(o);}
 async function list(actor,id){await transaction(pool,tx=>own(tx,actor,id));return (await pool.query('SELECT * FROM micontacto.payment_orders WHERE profile_id=$1 AND account_id=$2 ORDER BY created_at DESC',[id,actor])).rows.map(safe);}
 return {enabled:!!provider,prepare,initialize,confirm,read,list};
}
// Transport is explicit and injected; no automatic real email calls or credentials.
export function receiptWorker(pool,transport){
 return async function deliver(){
  if(!transport)throw Error('EMAIL_DISABLED');
  const r=await transaction(pool,async tx=>{
   const row=(await tx.query("SELECT r.*,o.receipt_email,o.provider,o.environment,o.amount_cents,t.days FROM micontacto.payment_receipts r JOIN micontacto.payment_orders o ON o.id=r.order_id JOIN micontacto.feature_terms t ON t.id=o.term_id WHERE r.state='PENDING' AND r.next_attempt_at<=now() ORDER BY r.next_attempt_at FOR UPDATE OF r SKIP LOCKED LIMIT 1")).rows[0];
   if(!row)return null;
   if(row.first_attempt_at&&Date.now()-Date.parse(row.first_attempt_at)>23*3600000){await tx.query("UPDATE micontacto.payment_receipts SET state='REVIEW' WHERE order_id=$1",[row.order_id]);return {review:true};}
   // Commit the first attempt and a lease before sending, including on process death.
   await tx.query("UPDATE micontacto.payment_receipts SET attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()),next_attempt_at=now()+interval '5 minutes' WHERE order_id=$1",[row.order_id]);return row;
  });
  if(!r)return {processed:false};if(r.review)return r;
  const text=`Mi Contacto — COMPROBANTE DE PRUEBA. Sin cobro real.\nOrden: ${r.order_id}\nPaquete Destacado: ${r.days} días\nImporte de prueba: USD ${(r.amount_cents/100).toFixed(2)}\nMétodo: ${r.provider} (${r.environment})\nEl tiempo se activa solo con aprobación y consentimiento. Este comprobante no es factura fiscal.`;
  try{
   const sent=await transport({to:r.receipt_email,subject:'Mi Contacto · Comprobante de prueba',text,idempotencyKey:'mc-receipt-test-'+r.order_id});
   if(typeof sent?.id!=='string'||!sent.id)throw Error('EMAIL_UNCONFIRMED');
   await pool.query("UPDATE micontacto.payment_receipts SET state='SENT',provider_message_id=$2,sent_at=now() WHERE order_id=$1 AND state='PENDING' AND attempts=$3",[r.order_id,sent.id,r.attempts+1]);return {sent:true};
  }catch(e){
   await pool.query("UPDATE micontacto.payment_receipts SET state=$2,next_attempt_at=now()+$3::int*interval '1 second' WHERE order_id=$1 AND state='PENDING' AND attempts=$4",[r.order_id,e.permanent?'REVIEW':'PENDING',Math.min(3600,30*2**Math.min(r.attempts,7)),r.attempts+1]);return {sent:false};
  }
 };
}
