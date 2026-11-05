import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir,writeFile,utimes,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {testFixture} from '../scripts/test-fixture.mjs';
import {localPhotoStorage} from '../photo-storage-local.js';
import {r2PhotoStorage} from '../photo-storage-r2.js';
import {localDatabase} from '../scripts/local-database.mjs';
import {nativeTestDatabase} from '../scripts/native/test-database.mjs';
import {createApplication} from '../application.js';
const image=()=>sharp({create:{width:48,height:48,channels:3,background:'#176ba3'}}).png().toBuffer();
const create=async f=>(await(await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'lifecycle-'+randomUUID().slice(0,8),displayName:'Synthetic lifecycle'}})).json()).id;
const keyFor=async(f,id)=>(await f.pool.query('SELECT object_key FROM micontacto.photos WHERE id=$1',[id])).rows[0]?.object_key;

test('private volume: main and all four fixed gallery positions replace/remove physically; no historical files',async t=>{
 const root=await mkdtemp(join(tmpdir(),'mc-lifecycle-')),storage=await localPhotoStorage({root,isolated:true,allowDeletion:true}),f=await testFixture({storage,simulation:true});
 try{const evidence={engine:f.local.engine??'PostgreSQL WASM',physicalStorage:'private local filesystem',operations:[]};const id=await create(f),bytes=await image();const upload=async(query='role=MAIN')=>{const r=await f.request('/api/profiles/'+id+'/photos?'+query,{method:'POST',raw:true,body:bytes});assert.equal(r.status,201);return (await r.json()).id;};
 const other=await f.app.profiles.create(f.other,{country:'PA',linkName:'other-'+randomUUID().slice(0,8),displayName:'Other synthetic profile'}),otherPhoto=await f.app.photos.upload(f.other,other.body.id,'MAIN',bytes,'image/png'),otherKey=await keyFor(f,otherPhoto.id);
 await t.test('main replacement verifies new bytes and removes old object and row before returning',async()=>{const a=await upload(),key=await keyFor(f,a),b=await upload();assert.ok(await storage.get(await keyFor(f,b)));assert.equal(await storage.get(key),null);assert.equal(await keyFor(f,a),undefined);assert.equal((await f.request('/media/'+id+'/'+a)).status,404);assert.equal((await readdir(root)).filter(x=>x.endsWith('.webp')).length,2);evidence.operations.push({role:'MAIN',replacedId:a,oldFileExists:false,oldRowExists:false,newFileExists:true,otherProfilePreserved:true});});
 await t.test('main removal physically deletes, protecting the other profile',async()=>{const p=(await f.app.profiles.detail(f.owner,id)).photos[0],key=await keyFor(f,p.id);assert.equal((await f.request('/api/profiles/'+id+'/photos/'+p.id,{method:'DELETE'})).status,200);assert.equal(await storage.get(key),null);assert.equal(await keyFor(f,p.id),undefined);assert.ok(await storage.get(otherKey));evidence.operations.push({role:'MAIN',removedId:p.id,fileExists:false,rowExists:false});});
 await upload();await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED',directory_consent=true WHERE id=$1",[id]);const term=await f.app.features.prepare(f.owner,id,1);await f.app.features.activateSimulation(f.owner,id,term.id,'synthetic-'+randomUUID());
 for(let position=1;position<=4;position++)await t.test('gallery position '+position+' replacement/removal deletes its exact file and preserves other positions',async()=>{
  const a=await upload('role=GALLERY&position='+position),old=await keyFor(f,a),b=await upload('role=GALLERY&position='+position+'&replace='+a),latest=await keyFor(f,b);assert.equal(await storage.get(old),null);assert.equal(await keyFor(f,a),undefined);assert.ok(await storage.get(latest));assert.equal((await f.app.profiles.detail(f.owner,id)).photos.find(p=>p.id===b).position,position);
  assert.equal((await f.request('/api/profiles/'+id+'/photos/'+b,{method:'DELETE',as:'other'})).status,404);assert.ok(await storage.get(latest));assert.equal((await f.request('/api/profiles/'+id+'/photos/'+b,{method:'DELETE'})).status,200);assert.equal(await storage.get(latest),null);assert.ok(await storage.get(otherKey));evidence.operations.push({role:'GALLERY',position,oldFileExists:false,replacementFileExistsAfterRemove:false,otherProfilePreserved:true});
 });
 assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.photo_upload_intents')).rows[0].n,0);assert.equal((await f.app.erasure.cleanup()).pending,0);assert.equal((await readdir(root)).filter(x=>x.endsWith('.webp')).length,2);assert.equal((await readdir(root)).filter(x=>x.startsWith('.pending-')).length,0);evidence.finalFiles=2;evidence.activePhotos=2;evidence.pendingDeletion=0;evidence.uploadIntents=0;evidence.temporaryFiles=0;console.log('PHOTO_PHYSICAL_EVIDENCE '+JSON.stringify(evidence));
 }finally{await f.pool.close();await rm(root,{recursive:true,force:true});}
});

test('storage failures: read-back validation, partial writes, durable retries, active references and legal hold',async t=>{
 const root=await mkdtemp(join(tmpdir(),'mc-failures-')),base=await localPhotoStorage({root,isolated:true,allowDeletion:true});let corrupt=false,partial=false,failDelete=false,ignoreDelete=false;
 const storage={...base,async put(k,b){await base.put(k,b);if(partial)throw Error('SYNTHETIC_PARTIAL_FAILURE');},async get(k){const b=await base.get(k);return b&&corrupt?Buffer.from('corrupted'):b;},async delete(k){if(failDelete)throw Error('SYNTHETIC_DELETE_FAILURE');if(!ignoreDelete)await base.delete(k);}};
 const f=await testFixture({storage});try{const id=await create(f),bytes=await image(),upload=()=>f.app.photos.upload(f.owner,id,'MAIN',bytes,'image/png'),first=await upload(),key=await keyFor(f,first.id);
 await t.test('failed or corrupt upload preserves active old image and removes the failed new file',async()=>{corrupt=true;await assert.rejects(upload(),/NOT_VERIFIED/);corrupt=false;assert.ok(await base.get(key));partial=true;await assert.rejects(upload(),/PARTIAL_FAILURE/);partial=false;assert.ok(await base.get(key));assert.equal((await readdir(root)).filter(x=>x.endsWith('.webp')).length,1);});
 let retired;
 await t.test('delete success without actual removal is rejected and durable retries finish it',async()=>{ignoreDelete=true;const r=await upload();retired=key;assert.ok(await base.get(retired));assert.ok(await base.get(await keyFor(f,r.id)));const work=(await f.pool.query('SELECT attempts FROM micontacto.storage_deletions WHERE object_key=$1',[retired])).rows[0];assert.ok(work.attempts>0);ignoreDelete=false;await f.pool.query('UPDATE micontacto.storage_deletions SET next_attempt_at=now()');if(f.local.restart)await f.local.restart();const reopened=createApplication({pool:f.pool,secret:'synthetic-restarted-cleanup'.repeat(3),storage});assert.equal((await reopened.erasure.cleanup()).pending,0);assert.equal(await base.get(retired),null);});
 await t.test('an active reference prevents deletion even when wrongly queued',async()=>{const p=(await f.app.profiles.detail(f.owner,id)).photos[0],key=await keyFor(f,p.id);await f.pool.query('INSERT INTO micontacto.storage_deletions(object_key) VALUES($1)',[key]);assert.equal((await f.app.erasure.cleanup()).deleted,0);assert.ok(await base.get(key));await f.pool.query('DELETE FROM micontacto.storage_deletions WHERE object_key=$1',[key]);});
 await t.test('failed deletion remains queued; legal hold retains only until explicitly released',async()=>{const p=(await f.app.profiles.detail(f.owner,id)).photos[0],key=await keyFor(f,p.id);failDelete=true;await f.app.photos.remove(f.owner,id,p.id);assert.ok(await base.get(key));await f.pool.query('UPDATE micontacto.profiles SET sensitive_hold=true WHERE id=$1',[id]);failDelete=false;await f.pool.query('UPDATE micontacto.storage_deletions SET next_attempt_at=now()');assert.equal((await f.app.erasure.cleanup()).deleted,0);assert.ok(await base.get(key));await f.pool.query('UPDATE micontacto.profiles SET sensitive_hold=false WHERE id=$1',[id]);await f.pool.query('UPDATE micontacto.storage_deletions SET next_attempt_at=now()');assert.equal((await f.app.erasure.cleanup()).pending,0);assert.equal(await base.get(key),null);});
 }finally{await f.pool.close();await rm(root,{recursive:true,force:true});}
});

test('controlled orphan recovery cleans expired new intents and stale temp files; never scans historical photo objects',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mc-orphans-')),storage=await localPhotoStorage({root,isolated:true,allowDeletion:true}),f=await testFixture({storage});try{const id=await create(f),key='mi-contacto/'+id+'/'+randomUUID()+'.webp',historical='mi-contacto/'+id+'/'+randomUUID()+'.webp',bytes=await sharp(await image()).webp().toBuffer();await storage.put(key,bytes);await storage.put(historical,bytes);await f.pool.query("INSERT INTO micontacto.photo_upload_intents(object_key,profile_id,expires_at) VALUES($1,$2,now()-interval '1 second')",[key,id]);const temp=join(root,'.pending-'+randomUUID()),fresh=join(root,'.pending-'+randomUUID());await writeFile(temp,'incomplete',{mode:0o600});await writeFile(fresh,'in progress',{mode:0o600});await utimes(temp,new Date(0),new Date(0));await f.app.erasure.cleanup();assert.equal(await storage.get(key),null);assert.ok(await storage.get(historical));assert.ok(!(await readdir(root)).includes(temp.split('/').at(-1)));assert.ok((await readdir(root)).includes(fresh.split('/').at(-1)));assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.photo_upload_intents')).rows[0].n,0);
 }finally{await f.pool.close();await rm(root,{recursive:true,force:true});}
});

test('concurrent main replacements leave one live object; committed-but-unacknowledged upload is never deleted',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mc-concurrent-')),storage=await localPhotoStorage({root,isolated:true,allowDeletion:true}),f=await testFixture({storage});try{const id=await create(f),bytes=await image();await Promise.all([f.app.photos.upload(f.owner,id,'MAIN',bytes,'image/png'),f.app.photos.upload(f.owner,id,'MAIN',bytes,'image/png')]);await f.app.erasure.cleanup();assert.equal((await readdir(root)).filter(x=>x.endsWith('.webp')).length,1);
 let uncertain=true;const pool={query:(...args)=>f.pool.query(...args),async connect(){const client=await f.pool.connect();let photoInserted=false;return {release:()=>client.release(),async query(sql,...rest){if(sql.startsWith('INSERT INTO micontacto.photos('))photoInserted=true;const result=await client.query(sql,...rest);if(sql==='COMMIT'&&photoInserted&&uncertain){uncertain=false;throw Error('SYNTHETIC_COMMIT_ACK_LOST');}return result;}};}};const app=createApplication({pool,secret:'synthetic-uncertain-photo-commit'.repeat(2),storage});await assert.rejects(app.photos.upload(f.owner,id,'MAIN',bytes,'image/png'),/ACK_LOST/);await app.erasure.cleanup();const rows=(await f.pool.query("SELECT object_key FROM micontacto.photos WHERE profile_id=$1 AND state='ACTIVE'",[id])).rows;assert.equal(rows.length,1);assert.ok(await storage.get(rows[0].object_key));assert.equal((await readdir(root)).filter(x=>x.endsWith('.webp')).length,1);
 }finally{await f.pool.close();await rm(root,{recursive:true,force:true});}
});

test('R2 SDK adapter: verified put, automatic exact-key deletion, retries and four positions with isolated fake bucket',async()=>{
 const objects=new Map(),deleted=[];let failures=0;
 const storage=r2PhotoStorage({accountId:'a'.repeat(32),accessKeyId:'synthetic',secretAccessKey:'synthetic',bucket:'mi-contacto-synthetic-cleanup',isolated:true,client:{async send(cmd){const key=cmd.input.Key;assert.equal(cmd.input.Bucket,'mi-contacto-synthetic-cleanup');if(cmd.constructor.name==='PutObjectCommand'){objects.set(key,Buffer.from(cmd.input.Body));return {};}if(cmd.constructor.name==='GetObjectCommand'){const b=objects.get(key);if(!b){const e=Error('missing');e.name='NoSuchKey';throw e;}return {ContentLength:b.length,Body:(async function*(){yield b;})()};}if(failures-->0)throw Error('SYNTHETIC_DELETE_FAILURE');deleted.push(key);objects.delete(key);return {};}}});
 const f=await testFixture({storage,simulation:true});try{const id=await create(f),bytes=await image(),upload=(role='MAIN',replace=null,position=null)=>f.app.photos.upload(f.owner,id,role,bytes,'image/png',replace,position),a=await upload(),old=await keyFor(f,a.id);failures=1;await upload();assert.ok(objects.has(old));await f.pool.query('UPDATE micontacto.storage_deletions SET next_attempt_at=now()');await f.app.erasure.cleanup();assert.ok(!objects.has(old));assert.ok(deleted.includes(old));await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED',directory_consent=true WHERE id=$1",[id]);const term=await f.app.features.prepare(f.owner,id,1);await f.app.features.activateSimulation(f.owner,id,term.id,'synthetic-'+randomUUID());for(let position=1;position<=4;position++){const a=await upload('GALLERY',null,position),old=await keyFor(f,a.id),b=await upload('GALLERY',a.id,position);assert.ok(!objects.has(old));const key=await keyFor(f,b.id);await f.app.photos.remove(f.owner,id,b.id);assert.ok(!objects.has(key));}assert.equal(objects.size,1);assert.equal((await f.app.erasure.cleanup()).pending,0);
 }finally{await f.pool.close();}
});


test('016 migration preserves existing five active photos and assigns stable gallery positions without deleting data',async()=>{
 const db=process.env.MC_TEST_NATIVE_POSTGRES_BIN?await nativeTestDatabase({bin:process.env.MC_TEST_NATIVE_POSTGRES_BIN}):await localDatabase();const pool=db.pool;
 try{
  for(const name of (await readdir(new URL('../db/',import.meta.url))).filter(n=>/^\d{3}_.*\.sql$/.test(n)&&n<'016_').sort())await pool.query(await readFile(new URL('../db/'+name,import.meta.url),'utf8'));
  const account=randomUUID();await pool.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[account,'synthetic-migration']);const app=createApplication({pool,secret:'synthetic-migration-sixteen'.repeat(2)}),created=await app.profiles.create(account,{country:'PA',linkName:'migration-sixteen',displayName:'Synthetic migration'}),profile=created.body.id;
  for(let i=0;i<5;i++){const id=randomUUID();await pool.query("INSERT INTO micontacto.photos(id,profile_id,object_key,role,mime,bytes) VALUES($1,$2,$3,$4,'image/webp',100)",[id,profile,'mi-contacto/'+profile+'/'+id+'.webp',i?'GALLERY':'MAIN']);}
  const query="SELECT id,profile_id,object_key,role,state FROM micontacto.photos ORDER BY id",before=(await pool.query(query)).rows;
  await pool.query(await readFile(new URL('../db/016_photo_lifecycle.sql',import.meta.url),'utf8'));assert.deepEqual((await pool.query(query)).rows,before);assert.deepEqual((await pool.query("SELECT gallery_position FROM micontacto.photos WHERE role='GALLERY' ORDER BY gallery_position")).rows.map(x=>x.gallery_position),[1,2,3,4]);
 }finally{await pool.close();}
});


test('concurrent gallery writes and replacements cannot exceed four positions or remove another active slot',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mc-gallery-race-')),storage=await localPhotoStorage({root,isolated:true,allowDeletion:true}),f=await testFixture({storage,simulation:true});try{
  if(f.local.engine){const a=await f.pool.connect(),b=await f.pool.connect();try{assert.notEqual((await a.query('SELECT pg_backend_pid() AS id')).rows[0].id,(await b.query('SELECT pg_backend_pid() AS id')).rows[0].id);}finally{a.release();b.release();}}
  const id=await create(f),bytes=await image();await f.app.photos.upload(f.owner,id,'MAIN',bytes,'image/png');await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED',directory_consent=true WHERE id=$1",[id]);const term=await f.app.features.prepare(f.owner,id,1);await f.app.features.activateSimulation(f.owner,id,term.id,'synthetic-race-'+randomUUID());
  const upload=(position,replace=null)=>f.app.photos.upload(f.owner,id,'GALLERY',bytes,'image/png',replace,position);
  for(let i=1;i<=3;i++)await upload(i);
  const race=await Promise.allSettled([upload(4),upload(4)]);assert.equal(race.filter(r=>r.status==='fulfilled').length,1);assert.equal(race.filter(r=>r.status==='rejected').length,1);
  const old=race.find(r=>r.status==='fulfilled').value.id,oldKey=await keyFor(f,old),again=await Promise.allSettled([upload(4,old),upload(4,old)]);assert.equal(again.filter(r=>r.status==='fulfilled').length,1);assert.equal(again.filter(r=>r.status==='rejected').length,1);await f.app.erasure.cleanup();assert.equal(await storage.get(oldKey),null);
  const photos=(await f.app.profiles.detail(f.owner,id)).photos;assert.equal(photos.length,5);assert.deepEqual(photos.filter(p=>p.role==='GALLERY').map(p=>p.position).sort(),[1,2,3,4]);assert.equal((await readdir(root)).filter(p=>p.endsWith('.webp')).length,5);assert.equal((await f.app.erasure.cleanup()).pending,0);
 }finally{await f.pool.close();await rm(root,{recursive:true,force:true});}
});
