import {randomUUID,randomBytes} from 'node:crypto';
import {transaction} from './profile-runtime.js';
import {preparePhoto} from './photo-storage.js';
export function photoRuntime(pool,profiles,storage,{now=()=>Date.now()}={}){
 async function invalidate(tx,id,main,actor){await profiles.features.suspend(tx,id,actor,'Fotografía pendiente de nueva aprobación');await tx.query('UPDATE micontacto.profiles SET photo_verified_id=CASE WHEN $2 THEN NULL ELSE photo_verified_id END,review_decision=NULL,status=CASE WHEN status=\'PAUSED\' THEN \'PAUSED\' ELSE \'DRAFT\' END,version=version+1 WHERE id=$1',[id,main]);if(main)await tx.query("UPDATE micontacto.photo_verifications SET state='REVOKED' WHERE profile_id=$1 AND state IN ('PENDING','APPROVED')",[id]);}
 return {
  async upload(account,id,role,bytes,mime){
   if(!['MAIN','GALLERY'].includes(role))throw Error('INVALID_PHOTO_ROLE');
   const prepared=await preparePhoto(bytes,mime),photo=randomUUID(),key='mi-contacto/'+id+'/'+photo+'.webp';
   return transaction(pool,async tx=>{
    const p=await profiles.owned(tx,account,id);profiles.writable(p);
    const current=(await tx.query("SELECT * FROM micontacto.photos WHERE profile_id=$1 AND state='ACTIVE'",[id])).rows;
    const hasFeature=(await tx.query("SELECT EXISTS(SELECT 1 FROM micontacto.feature_terms f WHERE f.profile_id=$1 AND f.state IN ('ACTIVE','PAUSED') AND micontacto.feature_remaining(f,micontacto.feature_now())>0) AS active",[id])).rows[0].active;
    if(role==='GALLERY'&&(!hasFeature||current.filter(x=>x.role==='GALLERY').length>=4))throw Error('GALLERY_NOT_AVAILABLE');
    await storage.put(key,prepared);
    if(role==='MAIN')await tx.query("UPDATE micontacto.photos SET state='DELETED' WHERE profile_id=$1 AND role='MAIN' AND state='ACTIVE'",[id]);
    await tx.query("INSERT INTO micontacto.photos(id,profile_id,object_key,role,mime,bytes) VALUES($1,$2,$3,$4,'image/webp',$5)",[photo,id,key,role,prepared.length]);
    await tx.query("INSERT INTO micontacto.storage_deletions(object_key) SELECT object_key FROM micontacto.photos WHERE profile_id=$1 AND state='DELETED' ON CONFLICT DO NOTHING",[id]);
    await invalidate(tx,id,role==='MAIN',account);await profiles.audit(tx,account,id,'PHOTO_UPLOADED');
    return {ok:true,id:photo};
   }); // Retain a private orphan on uncertain commit; never delete a possibly committed photo.
  },
  async remove(account,id,photo){return transaction(pool,async tx=>{const p=await profiles.owned(tx,account,id);profiles.writable(p);
   const row=(await tx.query("SELECT * FROM micontacto.photos WHERE id=$1 AND profile_id=$2 AND state='ACTIVE' FOR UPDATE",[photo,id])).rows[0];if(!row)throw Error('NOT_FOUND');
   await tx.query("UPDATE micontacto.photos SET state='DELETED' WHERE id=$1",[photo]);await tx.query('INSERT INTO micontacto.storage_deletions(object_key) VALUES($1) ON CONFLICT DO NOTHING',[row.object_key]);await invalidate(tx,id,row.role==='MAIN',account);await profiles.audit(tx,account,id,'PHOTO_REMOVED');return {ok:true};
  });},
  async requestVerification(account,id){return transaction(pool,async tx=>{
   const p=await profiles.owned(tx,account,id);profiles.writable(p);
   const photo=(await tx.query("SELECT id FROM micontacto.photos WHERE profile_id=$1 AND role='MAIN' AND state='ACTIVE'",[id])).rows[0];if(!photo)throw Error('PHOTO_REQUIRED');
   const old=(await tx.query("SELECT id,code FROM micontacto.photo_verifications WHERE profile_id=$1 AND state='PENDING'",[id])).rows[0];if(old)return old;
   const request=randomUUID(),code=randomBytes(9).toString('base64url').toUpperCase();
   await tx.query("INSERT INTO micontacto.photo_verifications(id,profile_id,photo_id,code,state) VALUES($1,$2,$3,$4,'PENDING')",[request,id,photo.id,code]);await profiles.audit(tx,account,id,'PHOTO_VERIFICATION_REQUESTED');return {id:request,code,channelConfigured:false};
  });},
  async reviewVerification(actor,request,{approved,evidenceReviewed,reason}){return transaction(pool,async tx=>{
   if(!(await tx.query("SELECT id FROM micontacto.accounts WHERE id=$1 AND role='ADMIN' AND status='ACTIVE'",[actor])).rows.length)throw Error('FORBIDDEN');
   if(typeof approved!=='boolean'||evidenceReviewed!==true||typeof reason!=='string'||reason.trim().length<3||reason.length>500)throw Error('VERIFICATION_REVIEW_REQUIRED');
   const reference=(await tx.query('SELECT profile_id FROM micontacto.photo_verifications WHERE id=$1',[request])).rows[0];if(!reference)throw Error('NOT_FOUND');
   // Match uploads/removals: lock profile before verification to avoid inverse lock order.
   const p=(await tx.query('SELECT * FROM micontacto.profiles WHERE id=$1 FOR UPDATE',[reference.profile_id])).rows[0];
   const entry=(await tx.query('SELECT * FROM micontacto.photo_verifications WHERE id=$1 FOR UPDATE',[request])).rows[0];if(!p||!entry||entry.profile_id!==p.id)throw Error('NOT_FOUND');
   if(entry.state!=='PENDING'||['BLOCKED','DELETED'].includes(p.status)||!(await tx.query("SELECT id FROM micontacto.photos WHERE id=$1 AND profile_id=$2 AND role='MAIN' AND state='ACTIVE'",[entry.photo_id,p.id])).rows.length)throw Error('VERIFICATION_STALE');
   await tx.query('UPDATE micontacto.photo_verifications SET state=$2,reviewed_by=$3 WHERE id=$1',[request,approved?'APPROVED':'REJECTED',actor]);
   if(approved)await tx.query('UPDATE micontacto.profiles SET photo_verified_id=$2 WHERE id=$1',[p.id,entry.photo_id]);
   await profiles.audit(tx,actor,p.id,approved?'PHOTO_VERIFIED':'PHOTO_VERIFICATION_REJECTED',reason);return {ok:true};
  });}
 };
}
