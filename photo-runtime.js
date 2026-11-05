import {photoCleanup} from './photo-cleanup.js';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {transaction} from './profile-runtime.js';
import {preparePhoto} from './photo-storage.js';
export function photoRuntime(pool,profiles,storage,{now=()=>Date.now()}={}){
 const {cleanup}=photoCleanup(pool,storage);
 const drain=keys=>keys.length?cleanup({keys}).catch(()=>null):Promise.resolve(null);
 async function invalidate(tx,id,main,actor){await profiles.features.suspend(tx,id,actor,'Fotografía pendiente de nueva aprobación');await tx.query('UPDATE micontacto.profiles SET photo_verified_id=CASE WHEN $2 THEN NULL ELSE photo_verified_id END,review_decision=NULL,status=CASE WHEN status=\'PAUSED\' THEN \'PAUSED\' ELSE \'DRAFT\' END,version=version+1 WHERE id=$1',[id,main]);if(main)await tx.query("UPDATE micontacto.photo_verifications SET state='REVOKED' WHERE profile_id=$1 AND state IN ('PENDING','APPROVED')",[id]);}
 return {
  async upload(account,id,role,bytes,mime,replace=null,position=null){
   if(!['MAIN','GALLERY'].includes(role))throw Error('INVALID_PHOTO_ROLE');
   if(position!==null&&(role!=='GALLERY'||! /^[1-4]$/.test(String(position))))throw Error('INVALID_PHOTO_POSITION');
   const prepared=await preparePhoto(bytes,mime),photo=randomUUID(),key='mi-contacto/'+id+'/'+photo+'.webp';
   // Commit an intent before touching storage so process death and ambiguous COMMIT are recoverable.
   await transaction(pool,async tx=>{const p=await profiles.owned(tx,account,id);profiles.writable(p);await tx.query('INSERT INTO micontacto.photo_upload_intents(object_key,profile_id) VALUES($1,$2)',[key,id]);});
   let retiredKeys=[],result;try{result=await transaction(pool,async tx=>{
    const p=await profiles.owned(tx,account,id);profiles.writable(p);
    const current=(await tx.query("SELECT * FROM micontacto.photos WHERE profile_id=$1 AND state='ACTIVE'",[id])).rows;
    const hasFeature=(await tx.query("SELECT EXISTS(SELECT 1 FROM micontacto.feature_terms f WHERE f.profile_id=$1 AND f.state IN ('ACTIVE','PAUSED') AND micontacto.feature_remaining(f,micontacto.feature_now())>0) AS active",[id])).rows[0].active;
    if(replace&&(role!=='GALLERY'||!current.some(x=>x.id===replace&&x.role==='GALLERY')))throw Error('NOT_FOUND');
    if(role==='GALLERY'&&(!hasFeature||current.filter(x=>x.role==='GALLERY'&&x.id!==replace).length>=4))throw Error('GALLERY_NOT_AVAILABLE');
    const previous=replace?current.find(p=>p.id===replace):null;
    const galleryPosition=role==='GALLERY'?(previous?.gallery_position??(position===null?[1,2,3,4].find(n=>!current.some(p=>p.role==='GALLERY'&&p.gallery_position===n)):Number(position))):null;
    if(role==='GALLERY'&&current.some(p=>p.id!==replace&&p.role==='GALLERY'&&p.gallery_position===galleryPosition))throw Error('GALLERY_NOT_AVAILABLE');
    if(!(await tx.query('SELECT object_key FROM micontacto.photo_upload_intents WHERE object_key=$1 FOR UPDATE',[key])).rows.length)throw Error('UPLOAD_INTENT_EXPIRED');
    await storage.put(key,prepared);
    const stored=await storage.get(key),hash=b=>createHash('sha256').update(b).digest('hex');
    if(!stored||hash(stored)!==hash(prepared))throw Error('PHOTO_UPLOAD_NOT_VERIFIED');
    const retired=current.filter(p=>role==='MAIN'?p.role==='MAIN':p.id===replace);retiredKeys=retired.map(p=>p.object_key);
    if(replace)await tx.query("UPDATE micontacto.photos SET state='DELETED' WHERE id=$1 AND profile_id=$2",[replace,id]);
    if(role==='MAIN')await tx.query("UPDATE micontacto.photos SET state='DELETED' WHERE profile_id=$1 AND role='MAIN' AND state='ACTIVE'",[id]);
    await tx.query("INSERT INTO micontacto.photos(id,profile_id,object_key,role,mime,bytes,gallery_position) VALUES($1,$2,$3,$4,'image/webp',$5,$6)",[photo,id,key,role,prepared.length,galleryPosition]);
    for(const old of retired)await tx.query('INSERT INTO micontacto.storage_deletions(object_key) VALUES($1) ON CONFLICT(object_key) DO UPDATE SET next_attempt_at=now()',[old.object_key]);
    await tx.query('DELETE FROM micontacto.photo_upload_intents WHERE object_key=$1',[key]);
    await invalidate(tx,id,role==='MAIN',account);await profiles.audit(tx,account,id,'PHOTO_UPLOADED');
    return {ok:true,id:photo};
   });}catch(e){
    // Reconcile against committed references under the profile lock, never delete blindly.
    await pool.query('UPDATE micontacto.photo_upload_intents SET expires_at=now() WHERE object_key=$1',[key]).catch(()=>{});await drain([key]);throw e;
   }
   await drain(retiredKeys);return result;
  },
  async remove(account,id,photo){let removedKey;const result=await transaction(pool,async tx=>{const p=await profiles.owned(tx,account,id);profiles.writable(p);
   const row=(await tx.query("SELECT * FROM micontacto.photos WHERE id=$1 AND profile_id=$2 AND state='ACTIVE' FOR UPDATE",[photo,id])).rows[0];if(!row)throw Error('NOT_FOUND');
   removedKey=row.object_key;await tx.query("UPDATE micontacto.photos SET state='DELETED' WHERE id=$1",[photo]);await tx.query('INSERT INTO micontacto.storage_deletions(object_key) VALUES($1) ON CONFLICT(object_key) DO UPDATE SET next_attempt_at=now()',[row.object_key]);await invalidate(tx,id,row.role==='MAIN',account);await profiles.audit(tx,account,id,'PHOTO_REMOVED');return {ok:true};
  });await drain([removedKey]);return result;},
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
