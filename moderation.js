import {randomUUID,createHash} from 'node:crypto';
import {transaction} from './profile-runtime.js';
import {REPORT_REASONS} from './protection-policy.js';
const reasonOK=(v,max=500)=>typeof v==='string'&&v.trim().length>=3&&v.length<=max;
export function moderationRuntime(pool,profiles){
 async function admin(tx,id){if(!(await tx.query("SELECT id FROM micontacto.accounts WHERE id=$1 AND role='ADMIN' AND status='ACTIVE'",[id])).rows.length)throw Error('FORBIDDEN');}
 async function event(tx,actor,pid,rid,action,reason){await tx.query('INSERT INTO micontacto.moderation_events(id,actor_id,profile_id,report_id,action,reason) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),actor,pid,rid,action,reason.trim()]);await profiles.audit(tx,actor,pid,'MODERATION_'+action,reason.trim());}
 async function report({profileId,category='OTHER',reason,evidence=''},key,reporter=null){
  if(!/^[a-f0-9-]{36}$/.test(profileId??'')||!Object.hasOwn(REPORT_REASONS,category)||!reasonOK(reason,1000)||typeof evidence!=='string'||evidence.length>1000)throw Error('INVALID_REPORT');
  const reporterKey=createHash('sha256').update(key).digest('hex');
  return transaction(pool,async tx=>{
   // Serialize public submissions so concurrent clients cannot evade durable limits.
   const p=(await tx.query("SELECT p.id FROM micontacto.profiles p JOIN micontacto.accounts a ON a.id=p.account_id WHERE p.id=$1 AND NOT p.privacy_hidden AND NOT p.moderation_restricted AND p.status='ACTIVE' AND p.review_decision='APPROVED' AND a.status='ACTIVE' FOR KEY SHARE OF p",[profileId])).rows[0];if(!p)throw Error('NOT_FOUND');
   await tx.query('LOCK TABLE micontacto.reports IN SHARE ROW EXCLUSIVE MODE');
   const old=(await tx.query("SELECT id FROM micontacto.reports WHERE profile_id=$1 AND reporter_key=$2 AND created_at>now()-interval '24 hours'",[profileId,reporterKey])).rows[0];if(old)return {id:old.id,received:true};
   const counts=(await tx.query("SELECT count(*) AS total,count(*) FILTER(WHERE reporter_key=$1) AS own FROM micontacto.reports WHERE created_at>now()-interval '1 hour'",[reporterKey])).rows[0];if(Number(counts.total)>=100||Number(counts.own)>=5)throw Error('REPORT_RATE_LIMITED');
   const id=randomUUID();await tx.query('INSERT INTO micontacto.reports(id,profile_id,reporter_id,reporter_key,category,reason,evidence) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,profileId,reporter,reporterKey,category,reason.trim(),evidence.trim()]);return {id,received:true};
  });
 }
 async function act(actor,reportId,{action,reason,confirm=false}={}){
  if(!['DISMISS','HIDE','SUSPEND','CORRECTION','DELETE','SENSITIVE_HOLD','BLOCK'].includes(action)||!reasonOK(reason))throw Error('INVALID_MODERATION_ACTION');
  if(action==='DELETE'&&confirm!==true)throw Error('INVALID_ERASURE_CONFIRMATION');
  return transaction(pool,async tx=>{await admin(tx,actor);
   const ref=(await tx.query('SELECT profile_id FROM micontacto.reports WHERE id=$1',[reportId])).rows[0];if(!ref)throw Error('NOT_FOUND');
   const p=(await tx.query('SELECT * FROM micontacto.profiles WHERE id=$1 FOR UPDATE',[ref.profile_id])).rows[0];if(!p)throw Error('NOT_FOUND');
   const r=(await tx.query('SELECT state FROM micontacto.reports WHERE id=$1 FOR UPDATE',[reportId])).rows[0];if(r.state!=='OPEN')throw Error('EDIT_CONFLICT');
   if(action!=='DISMISS'){
    if(p.status==='DELETED')throw Error('PROFILE_LOCKED');
    await profiles.features.suspend(tx,p.id,actor,'Moderación: '+reason.trim());
    const status=action==='DELETE'?'DELETED':action==='CORRECTION'?'DRAFT':'BLOCKED';
    await tx.query("UPDATE micontacto.profiles SET status=$2,moderation_restricted=true,sensitive_hold=sensitive_hold OR $3,review_decision='REJECTED',review_reason=$4,version=version+1,updated_at=now() WHERE id=$1",[p.id,status,action==='SENSITIVE_HOLD',reason.trim()]);
    if(['SUSPEND','BLOCK'].includes(action)){if(p.account_id===actor||(await tx.query("SELECT role FROM micontacto.accounts WHERE id=$1",[p.account_id])).rows[0].role==='ADMIN')throw Error('FORBIDDEN');await tx.query("UPDATE micontacto.accounts SET status=$2 WHERE id=$1",[p.account_id,action==='BLOCK'?'BLOCKED':'SUSPENDED']);await tx.query('DELETE FROM micontacto.sessions WHERE account_id=$1',[p.account_id]);}
   }
   await tx.query("UPDATE micontacto.reports SET investigation_state='RESOLVED',investigation_version=investigation_version+1,state=$2,reviewed_at=now(),reviewed_by=$3 WHERE id=$1",[reportId,action==='DISMISS'?'DISMISSED':'ACTIONED',actor]);await event(tx,actor,p.id,reportId,action,reason);return {ok:true,status:action};
  });
 }
 async function investigate(actor,id,{state,contactedAt=null,responseDueAt=null,notes,version,...extra}={}){
  if(Object.keys(extra).length||!['CONTACT_PENDING','WAITING','VERIFIED','UNVERIFIED'].includes(state)||!reasonOK(notes)||/https?:|data:|blob:/i.test(notes)||!Number.isInteger(version))throw Error('INVALID_INVESTIGATION');
  const contact=contactedAt===null?null:new Date(contactedAt),due=responseDueAt===null?null:new Date(responseDueAt);
  if(contact&&(!Number.isFinite(+contact)||+contact>Date.now()+60000)||due&&(!Number.isFinite(+due)||contact&&+due<+contact)||state!=='CONTACT_PENDING'&&!contact)throw Error('INVALID_INVESTIGATION');
  return transaction(pool,async tx=>{await admin(tx,actor);const ref=(await tx.query('SELECT profile_id FROM micontacto.reports WHERE id=$1',[id])).rows[0];if(!ref)throw Error('NOT_FOUND');await tx.query('SELECT id FROM micontacto.profiles WHERE id=$1 FOR UPDATE',[ref.profile_id]);const r=(await tx.query("UPDATE micontacto.reports SET investigation_state=$2,contacted_at=$3,response_due_at=$4,investigation_notes=$5,investigation_version=investigation_version+1 WHERE id=$1 AND state='OPEN' AND investigation_version=$6 RETURNING profile_id,investigation_version",[id,state,contact,due,notes.trim(),version])).rows[0];if(!r)throw Error('EDIT_CONFLICT');await event(tx,actor,r.profile_id,id,'INVESTIGATION_'+state,notes);return {ok:true,version:r.investigation_version};});
 }
 async function accountAction(actor,target,{action,reason,...extra}={}){if(Object.keys(extra).length||!['SUSPEND','BLOCK','RESTORE'].includes(action)||!reasonOK(reason))throw Error('INVALID_MODERATION_ACTION');return transaction(pool,async tx=>{await admin(tx,actor);const p=(await tx.query('SELECT * FROM micontacto.profiles WHERE account_id=$1 FOR UPDATE',[target])).rows[0];const account=(await tx.query('SELECT id,role FROM micontacto.accounts WHERE id=$1 FOR UPDATE',[target])).rows[0];if(!account)throw Error('NOT_FOUND');if(account.role==='ADMIN'||target===actor)throw Error('FORBIDDEN');if(p?.sensitive_hold&&action==='RESTORE')throw Error('PROFILE_LOCKED');if(p){await profiles.features.suspend(tx,p.id,actor,reason);await tx.query("UPDATE micontacto.profiles SET status=$2,moderation_restricted=$3,review_decision=NULL,review_reason=$4,version=version+1 WHERE id=$1",[p.id,action==='RESTORE'?'DRAFT':'BLOCKED',action!=='RESTORE',reason]);}await tx.query('UPDATE micontacto.accounts SET status=$2 WHERE id=$1',[target,action==='RESTORE'?'ACTIVE':action==='BLOCK'?'BLOCKED':'SUSPENDED']);await tx.query('DELETE FROM micontacto.sessions WHERE account_id=$1',[target]);await event(tx,actor,p?.id??null,null,'ACCOUNT_'+action,reason);return {ok:true};});}
 async function appeal(account,id,{reason}={}){if(!reasonOK(reason,1000))throw Error('INVALID_APPEAL');return transaction(pool,async tx=>{const p=await profiles.owned(tx,account,id);if(!p.moderation_restricted)throw Error('INVALID_APPEAL');const existing=(await tx.query("SELECT id FROM micontacto.appeals WHERE profile_id=$1 AND state='OPEN'",[id])).rows[0];if(existing)return existing;const request=randomUUID();await tx.query('INSERT INTO micontacto.appeals(id,profile_id,account_id,reason) VALUES($1,$2,$3,$4)',[request,id,account,reason.trim()]);await profiles.audit(tx,account,id,'APPEAL_SUBMITTED');return {id:request};});}
 async function reviewAppeal(actor,id,{accepted,reason}={}){if(typeof accepted!=='boolean'||!reasonOK(reason))throw Error('INVALID_APPEAL');return transaction(pool,async tx=>{await admin(tx,actor);const ref=(await tx.query('SELECT profile_id FROM micontacto.appeals WHERE id=$1',[id])).rows[0];if(!ref)throw Error('NOT_FOUND');const p=(await tx.query('SELECT * FROM micontacto.profiles WHERE id=$1 FOR UPDATE',[ref.profile_id])).rows[0];const a=(await tx.query("SELECT id FROM micontacto.appeals WHERE id=$1 AND state='OPEN' FOR UPDATE",[id])).rows[0];if(!a)throw Error('EDIT_CONFLICT');if(accepted){await tx.query("UPDATE micontacto.profiles SET status='DRAFT',moderation_restricted=false,sensitive_hold=false,review_decision=NULL,review_reason=$2,version=version+1 WHERE id=$1",[p.id,reason.trim()]);await tx.query("UPDATE micontacto.accounts SET status='ACTIVE' WHERE id=$1",[p.account_id]);}await tx.query('UPDATE micontacto.appeals SET state=$2,reviewed_at=now(),reviewed_by=$3,decision=$4 WHERE id=$1',[id,accepted?'ACCEPTED':'REJECTED',actor,reason.trim()]);await event(tx,actor,p.id,null,accepted?'APPEAL_ACCEPTED':'APPEAL_REJECTED',reason);return {ok:true};});}
 return {report,act,investigate,accountAction,appeal,reviewAppeal};
}
