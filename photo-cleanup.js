import {transaction} from './profile-runtime.js';
import {validPhotoKey} from './photo-storage.js';
/** Only explicit deletion work and new upload intents. Never list/purge stored photos. */
export function photoCleanup(pool,storage){
 async function recoverIntents(keys){
  const rows=(await pool.query('SELECT object_key,profile_id FROM micontacto.photo_upload_intents WHERE expires_at<=now() AND ($1::text[] IS NULL OR object_key=ANY($1)) ORDER BY created_at LIMIT 50',[keys??null])).rows;
  for(const row of rows)await transaction(pool,async tx=>{
   await tx.query('SELECT id FROM micontacto.profiles WHERE id=$1 FOR UPDATE',[row.profile_id]);
   const intent=(await tx.query('SELECT object_key FROM micontacto.photo_upload_intents WHERE object_key=$1 AND expires_at<=now() FOR UPDATE',[row.object_key])).rows[0];if(!intent)return;
   const active=(await tx.query("SELECT id FROM micontacto.photos WHERE object_key=$1 AND state='ACTIVE'",[row.object_key])).rows.length;
   if(!active)await tx.query('INSERT INTO micontacto.storage_deletions(object_key) VALUES($1) ON CONFLICT DO NOTHING',[row.object_key]);
   await tx.query('DELETE FROM micontacto.photo_upload_intents WHERE object_key=$1',[row.object_key]);
  });
 }
 async function run({keys=null}={}){
  await recoverIntents(keys);let deleted=0,retained=0;
  const rows=(await pool.query('SELECT object_key FROM micontacto.storage_deletions WHERE next_attempt_at<=now() AND ($1::text[] IS NULL OR object_key=ANY($1)) ORDER BY created_at LIMIT 100',[keys])).rows;
  for(const {object_key:key}of rows){if(!validPhotoKey(key)){await pool.query("UPDATE micontacto.storage_deletions SET next_attempt_at=now()+interval '1 hour' WHERE object_key=$1",[key]);continue;}const profile=key.split('/')[1];
   try{await transaction(pool,async tx=>{
    // Same lock order as uploads and moderation. No deletion while a commit is uncertain.
    await tx.query('SELECT id FROM micontacto.profiles WHERE id=$1 FOR UPDATE',[profile]);
    const work=(await tx.query('SELECT object_key FROM micontacto.storage_deletions WHERE object_key=$1 AND next_attempt_at<=now() FOR UPDATE',[key])).rows[0];if(!work)return;
    const held=(await tx.query('SELECT 1 FROM micontacto.profiles WHERE id=$2 AND sensitive_hold UNION ALL SELECT 1 FROM micontacto.photos ph JOIN micontacto.profiles p ON p.id=ph.profile_id WHERE ph.object_key=$1 AND p.sensitive_hold',[key,profile])).rows.length;
    if(held){await tx.query("UPDATE micontacto.storage_deletions SET next_attempt_at=now()+interval '1 hour' WHERE object_key=$1",[key]);retained++;return;}
    const referenced=(await tx.query("SELECT 1 FROM micontacto.photos WHERE object_key=$1 AND state='ACTIVE' UNION ALL SELECT 1 FROM micontacto.photo_upload_intents WHERE object_key=$1 UNION ALL SELECT 1 FROM micontacto.profiles p JOIN micontacto.photos ph ON ph.id=p.photo_verified_id WHERE ph.object_key=$1",[key])).rows.length;
    if(referenced){await tx.query("UPDATE micontacto.storage_deletions SET next_attempt_at=now()+interval '1 hour' WHERE object_key=$1",[key]);retained++;return;}
    await storage.delete(key);
    if(await storage.get(key)!==null)throw Error('PHOTO_DELETE_NOT_CONFIRMED');
    await tx.query("DELETE FROM micontacto.photo_verifications WHERE photo_id IN (SELECT id FROM micontacto.photos WHERE object_key=$1 AND state='DELETED')",[key]);
    await tx.query("DELETE FROM micontacto.photos WHERE object_key=$1 AND state='DELETED'",[key]);
    await tx.query('DELETE FROM micontacto.storage_deletions WHERE object_key=$1',[key]);deleted++;
   });}catch{
    await pool.query("UPDATE micontacto.storage_deletions SET attempts=LEAST(attempts+1,30),next_attempt_at=now()+LEAST(3600,5*power(2,LEAST(attempts,10))) * interval '1 second' WHERE object_key=$1",[key]).catch(()=>{});
   }
  }
  const temporary=!keys&&storage.cleanupTemporary?await storage.cleanupTemporary({before:Date.now()-3600000,limit:50}).catch(()=>({deleted:0,pending:true})):null;
  return {deleted,retained,pending:Number((await pool.query('SELECT count(*) AS n FROM micontacto.storage_deletions')).rows[0].n),temporary};
 }
 let running=null;
 async function cleanup(options={}){if(options.keys)return run(options);if(running)return running;running=run();try{return await running;}finally{running=null;}}
 return {cleanup};
}
