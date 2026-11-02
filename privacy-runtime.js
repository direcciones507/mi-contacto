import {randomUUID} from 'node:crypto';
import {transaction} from './profile-runtime.js';
export function privacyRuntime(pool,profiles){
 async function visibility(actor,id,input){
  if(!input||Object.keys(input).some(k=>k!=='hidden')||typeof input.hidden!=='boolean')throw Error('INVALID_PRIVACY_FIELDS');
  return transaction(pool,async tx=>{const p=await profiles.owned(tx,actor,id);
   if(!input.hidden){profiles.writable(p);if((await tx.query('SELECT id FROM micontacto.removal_requests WHERE profile_id=$1',[id])).rows.length)throw Error('REMOVAL_PENDING');}
   if(p.privacy_hidden===input.hidden)return {ok:true,hidden:input.hidden,replayed:true};
   if(input.hidden)await profiles.features.suspend(tx,id,actor,'Ocultación solicitada por propietario');
   await tx.query('UPDATE micontacto.profiles SET privacy_hidden=$2,version=version+1 WHERE id=$1',[id,input.hidden]);
   await profiles.audit(tx,actor,id,input.hidden?'PRIVACY_HIDDEN':'PRIVACY_UNHIDDEN');return {ok:true,hidden:input.hidden};
  });
 }
 async function requestRemoval(actor,id,input){
  if(!input||input.confirm!==true||Object.keys(input).some(k=>k!=='confirm'))throw Error('INVALID_REMOVAL_CONFIRMATION');
  return transaction(pool,async tx=>{await profiles.owned(tx,actor,id);const old=(await tx.query('SELECT id,state FROM micontacto.removal_requests WHERE profile_id=$1',[id])).rows[0];if(old)return {...old,hidden:true,physicalDeletion:false,replayed:true};
   await profiles.features.suspend(tx,id,actor,'Solicitud de eliminación pendiente de política aprobada');
   await tx.query('UPDATE micontacto.profiles SET privacy_hidden=true,version=version+1 WHERE id=$1',[id]);const request=randomUUID();
   await tx.query('INSERT INTO micontacto.removal_requests(id,profile_id) VALUES($1,$2)',[request,id]);await profiles.audit(tx,actor,id,'REMOVAL_REQUESTED');return {id:request,state:'OPEN',hidden:true,physicalDeletion:false};
  });
 }
 async function acknowledge(actor,id,input){
  if(typeof input?.reason!=='string'||input.reason.trim().length<3||input.reason.length>500||Object.keys(input).some(k=>k!=='reason'))throw Error('REASON_REQUIRED');
  return transaction(pool,async tx=>{
   if(!(await tx.query("SELECT id FROM micontacto.accounts WHERE id=$1 AND role='ADMIN' AND status='ACTIVE'",[actor])).rows.length)throw Error('FORBIDDEN');
   const ref=(await tx.query('SELECT profile_id FROM micontacto.removal_requests WHERE id=$1',[id])).rows[0];if(!ref)throw Error('NOT_FOUND');
   await tx.query('SELECT id FROM micontacto.profiles WHERE id=$1 FOR UPDATE',[ref.profile_id]);
   const r=(await tx.query('SELECT * FROM micontacto.removal_requests WHERE id=$1 FOR UPDATE',[id])).rows[0];if(r.state==='ACKNOWLEDGED')return {ok:true,state:r.state,physicalDeletion:false,replayed:true};
   await tx.query("UPDATE micontacto.removal_requests SET state='ACKNOWLEDGED',reviewed_by=$2,reviewed_at=now() WHERE id=$1",[id,actor]);await profiles.audit(tx,actor,ref.profile_id,'REMOVAL_ACKNOWLEDGED',input.reason.trim());return {ok:true,state:'ACKNOWLEDGED',physicalDeletion:false};
  });
 }
 return {visibility,requestRemoval,acknowledge};
}
