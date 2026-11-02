import {randomUUID} from 'node:crypto';
import {transaction} from './profile-runtime.js';
import {featureQuote} from './feature-policy.js';
export const featureExistsSQL="EXISTS(SELECT 1 FROM micontacto.feature_terms f WHERE f.profile_id=p.id AND f.state='ACTIVE' AND micontacto.feature_remaining(f,micontacto.feature_now())>0)";
export function featureRuntime(pool,{simulation=false}={}){
 async function clock(tx){return (await tx.query('SELECT micontacto.feature_now() AS at')).rows[0].at;}
 async function profile(tx,id,actor,admin=false){
  const p=(await tx.query('SELECT p.*,a.status AS account_status,cs.enabled AS country_enabled FROM micontacto.profiles p JOIN micontacto.accounts a ON a.id=p.account_id JOIN micontacto.country_settings cs ON cs.code=p.country_code WHERE p.id=$1 FOR UPDATE OF p',[id])).rows[0];
  if(!p||!admin&&p.account_id!==actor)throw Error('NOT_FOUND');return p;
 }
 function eligible(p){if(p.privacy_hidden||p.status!=='ACTIVE'||p.review_decision!=='APPROVED'||!p.directory_consent||p.account_status!=='ACTIVE'||!p.country_enabled)throw Error('PROFILE_LOCKED');}
 async function event(tx,actor,t,action,at,reason=''){
  await tx.query('INSERT INTO micontacto.feature_events(id,term_id,actor_id,action,remaining_ms,happened_at,reason) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),t.id,actor,action,t.remaining_ms,at,reason]);
  await tx.query('INSERT INTO micontacto.audit(id,actor_id,profile_id,action,reason) VALUES($1,$2,$3,$4,$5)',[randomUUID(),actor,t.profile_id,'FEATURE_'+action,reason]);
 }
 async function settle(tx,id,actor,at){
  const old=(await tx.query('SELECT *,micontacto.feature_remaining(f,$2) AS effective FROM micontacto.feature_terms f WHERE profile_id=$1 FOR UPDATE',[id,at])).rows;
  for(const t of old)if(t.state==='ACTIVE'){
   const expired=Number(t.effective)===0;
   await tx.query("UPDATE micontacto.feature_terms SET remaining_ms=$2,observed_at=$3,anchor_at=CASE WHEN $4 THEN NULL ELSE $3::timestamptz END,state=CASE WHEN $4 THEN 'EXPIRED' ELSE state END,expires_at=CASE WHEN $4 THEN anchor_at+remaining_ms*interval '1 millisecond' ELSE $3::timestamptz+$2::bigint*interval '1 millisecond' END WHERE id=$1",[t.id,t.effective,at,expired]);
   if(expired)await event(tx,actor,{...t,remaining_ms:0},'EXPIRED',at);
  }
  return (await tx.query('SELECT * FROM micontacto.feature_terms WHERE profile_id=$1 ORDER BY starts_at NULLS LAST,id',[id])).rows;
 }
 async function snapshot(id){return transaction(pool,async tx=>{const p=await profile(tx,id,null,true),at=await clock(tx);const terms=await settle(tx,id,p.account_id,at);
  const events=(await tx.query('SELECT e.term_id,e.action,e.remaining_ms,e.happened_at,e.reason FROM micontacto.feature_events e JOIN micontacto.feature_terms t ON t.id=e.term_id WHERE t.profile_id=$1 ORDER BY e.happened_at,e.id',[id])).rows;
  return {terms,events};
 });}
 async function prepare(actor,id,days){const q=featureQuote(days);return transaction(pool,async tx=>{
  const p=await profile(tx,id,actor);if(['BLOCKED','DELETED'].includes(p.status))throw Error('PROFILE_LOCKED');
  const at=await clock(tx),terms=await settle(tx,id,actor,at);
  if(terms.some(t=>['ACTIVE','PAUSED'].includes(t.state)))throw Error('FEATURE_CONFLICT');
  const existing=terms.find(t=>t.state==='PREPARED'&&t.days===days);if(existing)return {id:existing.id,...q,state:'PREPARED'};
  const term={id:randomUUID(),profile_id:id,remaining_ms:days*86400000};
  await tx.query("INSERT INTO micontacto.feature_terms(id,profile_id,days,amount_cents,state,remaining_ms,observed_at) VALUES($1,$2,$3,$4,'PREPARED',$5,$6)",[term.id,id,days,q.amountCents,term.remaining_ms,at]);
  await event(tx,actor,term,'PREPARED',at);return {id:term.id,...q,state:'PREPARED'};
 });}
 // In-process synthetic harness only. There is deliberately no HTTP activation/payment endpoint.
 async function activateSimulation(actor,id,termId,key){
  if(!simulation)throw Error('SIMULATION_DISABLED');if(typeof key!=='string'||!/^synthetic-[a-zA-Z0-9-]{8,100}$/.test(key))throw Error('INVALID_CONFIRMATION');
  return transaction(pool,async tx=>{const p=await profile(tx,id,actor);eligible(p);const at=await clock(tx);await settle(tx,id,actor,at);
   const t=(await tx.query('SELECT * FROM micontacto.feature_terms WHERE id=$1 AND profile_id=$2 FOR UPDATE',[termId,id])).rows[0];if(!t)throw Error('NOT_FOUND');
   if(t.confirmation_key===key)return {ok:true,id:t.id,replayed:true};
   if(t.state!=='PREPARED'||(await tx.query("SELECT id FROM micontacto.feature_terms WHERE profile_id=$1 AND state IN ('ACTIVE','PAUSED')",[id])).rows.length)throw Error('FEATURE_CONFLICT');
   await tx.query("UPDATE micontacto.feature_terms SET state='ACTIVE',starts_at=$2,anchor_at=$2,observed_at=$2,expires_at=$2::timestamptz+remaining_ms*interval '1 millisecond',confirmation_key=$3 WHERE id=$1",[t.id,at,key]);
   await event(tx,actor,t,'ACTIVATED_SIMULATION',at);return {ok:true,id:t.id};
  });
 }
 async function toggle(actor,id,resume=false){return transaction(pool,async tx=>{
  const p=await profile(tx,id,actor);if(['BLOCKED','DELETED'].includes(p.status)||p.account_status!=='ACTIVE')throw Error('PROFILE_LOCKED');
  const at=await clock(tx),terms=await settle(tx,id,actor,at),t=terms.find(t=>['ACTIVE','PAUSED'].includes(t.state));
  if(!t)throw Error('FEATURE_CONFLICT');if(resume)eligible(p);
  const state=resume?'ACTIVE':'PAUSED';if(t.state===state)return {ok:true,state,replayed:true};
  await tx.query('UPDATE micontacto.feature_terms SET state=$2,anchor_at=$3,observed_at=$4,expires_at=CASE WHEN $3::timestamptz IS NULL THEN NULL ELSE $3::timestamptz+remaining_ms*interval \'1 millisecond\' END WHERE id=$1',[t.id,state,resume?at:null,at]);
  await event(tx,actor,t,resume?'RESUMED':'PAUSED',at);return {ok:true,state};
 });}
 // Caller already holds the profile lock. Moderation/editing never burns hidden time.
 async function suspend(tx,id,actor,reason){
  if(!(await tx.query("SELECT id FROM micontacto.feature_terms WHERE profile_id=$1 AND state='ACTIVE'",[id])).rows.length)return;
  const at=await clock(tx),terms=await settle(tx,id,actor,at),t=terms.find(t=>t.state==='ACTIVE');if(!t)return;
  await tx.query("UPDATE micontacto.feature_terms SET state='PAUSED',anchor_at=NULL,expires_at=NULL,observed_at=$2 WHERE id=$1",[t.id,at]);await event(tx,actor,t,'AUTO_PAUSED',at,reason);
 }
 async function cancel(actor,termId,reason){return transaction(pool,async tx=>{
  if(!(await tx.query("SELECT id FROM micontacto.accounts WHERE id=$1 AND role='ADMIN' AND status='ACTIVE'",[actor])).rows.length)throw Error('FORBIDDEN');
  const ref=(await tx.query('SELECT profile_id FROM micontacto.feature_terms WHERE id=$1',[termId])).rows[0];if(!ref)throw Error('NOT_FOUND');
  await profile(tx,ref.profile_id,actor,true);const at=await clock(tx);const terms=await settle(tx,ref.profile_id,actor,at),t=terms.find(t=>t.id===termId);
  if(t.state==='CANCELLED')return {ok:true,replayed:true};
  await tx.query("UPDATE micontacto.feature_terms SET state='CANCELLED',anchor_at=NULL,observed_at=$2 WHERE id=$1",[termId,at]);await event(tx,actor,t,'CANCELLED',at,reason);return {ok:true};
 });}
 return {snapshot,prepare,activateSimulation,toggle,cancel,suspend};
}
