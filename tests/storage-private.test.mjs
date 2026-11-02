import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir,lstat,writeFile,symlink,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {localPhotoStorage} from '../photo-storage-local.js';
import {isolatedObjectStorage,preparePhoto} from '../photo-storage.js';
import {testFixture} from '../scripts/test-fixture.mjs';
import {createApplication} from '../application.js';

test('almacenamiento privado persistente: reapertura, inmutabilidad y rutas',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mi-contacto-storage-test-')),key='mi-contacto/'+randomUUID()+'/'+randomUUID()+'.webp';
 try{
  const s=await localPhotoStorage({root,isolated:true}),image=await preparePhoto(await sharp({create:{width:20,height:30,channels:3,background:'blue'}}).png().toBuffer(),'image/png');
  await s.put(key,image);await assert.rejects(s.delete(key),/PHYSICAL_DELETION_DISABLED/);const reopened=await localPhotoStorage({root,isolated:true});assert.deepEqual(await reopened.get(key),image);
  await assert.rejects(reopened.put(key,Buffer.from('replacement')),e=>e.code==='EEXIST');assert.deepEqual(await s.get(key),image);
  await assert.rejects(s.get('../other-project'),/INVALID_OBJECT_KEY/);assert.equal(await s.get('mi-contacto/'+randomUUID()+'/'+randomUUID()+'.webp'),null);
  const objects=(await readdir(root)).filter(x=>x.endsWith('.webp'));assert.equal(objects.length,1);assert.equal((await lstat(join(root,objects[0]))).mode&0o077,0);assert.equal((await readdir(root)).some(x=>x.startsWith('.pending-')),false);
 }finally{await rm(root,{recursive:true});}
});

test('almacenamiento rechaza raíz ajena, enlaces simbólicos, permisos y respuestas URL',async()=>{
 const parent=await mkdtemp(join(tmpdir(),'mi-contacto-invalid-storage-'));
 try{
  await assert.rejects(localPhotoStorage({root:parent}),/ISOLATED_STORAGE_REQUIRED/);
  await writeFile(join(parent,'other-project.txt'),'synthetic');await assert.rejects(localPhotoStorage({root:parent,isolated:true}),/STORAGE_NOT_EMPTY/);
  const link=parent+'-link';await symlink(parent,link);try{await assert.rejects(localPhotoStorage({root:link,isolated:true}),/PRIVATE_STORAGE_REQUIRED/);}finally{await rm(link);}
  await chmod(parent,0o755);await assert.rejects(localPhotoStorage({root:parent,isolated:true}),/PRIVATE_STORAGE_REQUIRED/);
  assert.throws(()=>isolatedObjectStorage({isolated:true,bucket:'foreign-bucket',client:{putObject(){},getObject(){},deleteObject(){}}}),/ISOLATED_STORAGE_REQUIRED/);
  const store=isolatedObjectStorage({isolated:true,bucket:'mi-contacto-synthetic-only',client:{putObject(){},getObject(){return 'https://foreign.example/private.webp';},deleteObject(){}}});await assert.rejects(store.get('mi-contacto/'+randomUUID()+'/'+randomUUID()+'.webp'),/INVALID_STORED_PHOTO/);
 }finally{await rm(parent,{recursive:true});}
});

test('fotos persistidas: privadas, reapertura HTTP, reemplazo y revocación sin borrar originales',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mi-contacto-http-storage-'));let f;
 try{
  const storage=await localPhotoStorage({root,isolated:true});f=await testFixture({storage});
  const created=await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'foto-persistente',displayName:'Persona sintética'}});const id=(await created.json()).id;
  const bytes=await sharp({create:{width:40,height:40,channels:3,background:'blue'}}).jpeg().toBuffer();
  const upload=await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:bytes,headers:{'content-type':'image/jpeg'}});assert.equal(upload.status,201);const photo=(await upload.json()).id;
  assert.equal((await f.request('/media/'+id+'/'+photo,{as:null})).status,404);assert.equal((await f.request('/media/'+id+'/'+photo,{as:'other'})).status,404);
  await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED' WHERE id=$1",[id]);
  const app2=createApplication({pool:f.pool,secret:'synthetic-reopened-'+randomUUID(),storage:await localPhotoStorage({root,isolated:true})});
  const image=await app2.handle(new Request(f.origin+'/media/'+id+'/'+photo));assert.equal(image.status,200);assert.match(image.headers.get('cache-control'),/no-store/);assert.equal((await sharp(Buffer.from(await image.arrayBuffer())).metadata()).exif,undefined);
  const replaced=await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:bytes,headers:{'content-type':'image/jpeg'}});assert.equal(replaced.status,201);assert.equal((await f.request('/media/'+id+'/'+photo)).status,404);
  assert.equal((await readdir(root)).filter(x=>x.endsWith('.webp')).length,2);assert.equal((await app2.handle(new Request(f.origin+'/media/'+id+'/'+(await replaced.json()).id))).status,404);
 }finally{if(f)await f.pool.close();await rm(root,{recursive:true});}
});

test('bucket exclusivo simulado: fallo SQL no revoca foto anterior ni borra un posible objeto confirmado',async()=>{
 const objects=new Map(),deleted=[];let failPut=false;
 const storage=isolatedObjectStorage({isolated:true,bucket:'mi-contacto-synthetic-only',client:{async putObject({bucket,key,body,contentType,public:visible}){assert.equal(bucket,'mi-contacto-synthetic-only');assert.equal(contentType,'image/webp');assert.equal(visible,false);if(failPut)throw Error('SYNTHETIC_STORAGE_FAILURE');objects.set(key,Buffer.from(body));},async getObject({key}){return objects.get(key)??null;},async deleteObject({key}){deleted.push(key);objects.delete(key);}}});
 const f=await testFixture({storage});
 try{
  const id=(await(await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'foto-fallo',displayName:'Persona sintética'}})).json()).id;
  const bytes=await sharp({create:{width:20,height:20,channels:3,background:'blue'}}).png().toBuffer();
  const first=await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:bytes});assert.equal(first.status,201);const photo=(await first.json()).id;
  await f.pool.query("CREATE FUNCTION micontacto.synthetic_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='PHOTO_UPLOADED' THEN RAISE EXCEPTION 'SYNTHETIC_AUDIT_FAILURE'; END IF; RETURN NEW; END $$; CREATE TRIGGER synthetic_audit_failure BEFORE INSERT ON micontacto.audit FOR EACH ROW EXECUTE FUNCTION micontacto.synthetic_audit_failure()");
  const failed=await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:bytes});assert.equal(failed.status,503);assert.deepEqual(await failed.json(),{error:'OPERATION_UNAVAILABLE'});
  assert.equal((await f.request('/media/'+id+'/'+photo)).status,200);assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.photos WHERE profile_id=$1',[id])).rows[0].n,1);
  assert.equal(objects.size,2);assert.deepEqual(deleted,[]);const orphan=[...objects.keys()].find(k=>!k.endsWith('/'+photo+'.webp')).split('/').at(-1).replace('.webp','');assert.equal((await f.request('/media/'+id+'/'+orphan)).status,404);
  failPut=true;assert.equal((await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:bytes})).status,503);assert.equal(objects.size,2);assert.equal((await f.request('/media/'+id+'/'+photo)).status,200);
 }finally{await f.pool.close();}
});
