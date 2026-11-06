import {createHash,randomUUID} from 'node:crypto';
import {transaction} from './profile-runtime.js';
export const urlHash=(country,slug)=>createHash('sha256').update(country.toUpperCase()+'/'+slug).digest('hex');
export function erasureRuntime(pool,storage){
 async function cleanup(){const rows=(await pool.query('SELECT d.object_key FROM micontacto.storage_deletions d WHERE NOT EXISTS(SELECT 1 FROM micontacto.photos ph JOIN micontacto.profiles p ON p.id=ph.profile_id WHERE ph.object_key=d.object_key AND p.sensitive_hold) ORDER BY d.created_at LIMIT 100')).rows;let deleted=0;for(const row of rows){try{await storage.delete(row.object_key);await pool.query('DELETE FROM micontacto.storage_deletions WHERE object_key=$1',[row.object_key]);deleted++;}catch{/* Keep durable retry work. No private data in logs. */}}return {deleted,pending:Number((await pool.query('SELECT count(*) AS n FROM micontacto.storage_deletions')).rows[0].n)};}
 async function approve(actor,request,{confirm,reason}={},ownerSelf=false){
  if(confirm!==true||typeof reason!=='string'||reason.trim().length<3||reason.length>500)throw Error('INVALID_ERASURE_CONFIRMATION');
  await transaction(pool,async tx=>{
   if(!ownerSelf&&!(await tx.query("SELECT id FROM micontacto.accounts WHERE id=$1 AND role='ADMIN' AND status='ACTIVE'",[actor])).rows.length)throw Error('FORBIDDEN');
   const r=(await tx.query('SELECT profile_id FROM micontacto.removal_requests WHERE id=$1',[request])).rows[0];if(!r)throw Error('NOT_FOUND');
   const p=(await tx.query('SELECT * FROM micontacto.profiles WHERE id=$1 FOR UPDATE',[r.profile_id])).rows[0];if(!p)throw Error('NOT_FOUND');if(ownerSelf&&p.account_id!==actor)throw Error('FORBIDDEN');if(p.sensitive_hold)throw Error('PROFILE_LOCKED');
   await tx.query("UPDATE micontacto.removal_requests SET state='DELETE_APPROVED',reviewed_at=now(),reviewed_by=$2 WHERE id=$1",[request,actor]);
   await tx.query('INSERT INTO micontacto.deleted_urls(url_hash) VALUES($1) ON CONFLICT DO NOTHING',[urlHash(p.url_country,p.slug)]);
   await tx.query('INSERT INTO micontacto.storage_deletions(object_key) SELECT object_key FROM micontacto.photos WHERE profile_id=$1 ON CONFLICT DO NOTHING',[p.id]);
   await tx.query('UPDATE micontacto.profiles SET photo_verified_id=NULL WHERE id=$1',[p.id]);
   await tx.query("UPDATE micontacto.code_events SET reason='' WHERE code_id IN (SELECT id FROM micontacto.commercial_codes WHERE used_profile_id=$1)",[p.id]);
   await tx.query("UPDATE micontacto.commercial_codes SET customer_reference='',payment_reference='',owner_id=NULL WHERE used_profile_id=$1",[p.id]);
   await tx.query("UPDATE micontacto.code_orders SET receipt_email='',receipt_state='REVIEW' WHERE account_id=$1",[p.account_id]);
   await tx.query('DELETE FROM micontacto.photo_verifications WHERE profile_id=$1',[p.id]);
   await tx.query('DELETE FROM micontacto.payment_orders WHERE profile_id=$1',[p.id]);
   await tx.query('DELETE FROM micontacto.feature_events WHERE term_id IN (SELECT id FROM micontacto.feature_terms WHERE profile_id=$1)',[p.id]);
   for(const table of ['feature_terms','photos','reports','audit','profile_slug_reservations'])await tx.query('DELETE FROM micontacto.'+table+' WHERE profile_id=$1',[p.id]);
   await tx.query('DELETE FROM micontacto.profiles WHERE id=$1',[p.id]);
   // Audit the authorization without retaining the removed person's identifiers or free-text data.
   await tx.query("INSERT INTO micontacto.audit(id,actor_id,action,reason) VALUES($1,$2,'PROFILE_ERASED',$3)",[randomUUID(),actor,ownerSelf?'Eliminación definitiva confirmada por titular':'Solicitud del titular autorizada por ADMIN']);
  });
  const objects=await cleanup();return {ok:true,profileDeleted:true,physicalDeletion:objects.pending===0,objects};
 }
 async function eraseOwner(actor,profileId,{confirm,reason}={}){if(confirm!==true||reason!=='ELIMINAR MI PERFIL')throw Error('INVALID_ERASURE_CONFIRMATION');const r=(await pool.query('SELECT id FROM micontacto.removal_requests WHERE profile_id=$1',[profileId])).rows[0];if(!r)throw Error('NOT_FOUND');return approve(actor,r.id,{confirm:true,reason:'Eliminación definitiva solicitada por titular'},true);}
 return {approve,eraseOwner,cleanup};
}
