import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {allowedEmailSender,allowedPhotoBucket} from '../provider-reuse.js';
import {isolatedObjectStorage,memoryPhotoStorage} from '../photo-storage.js';
import {migratingPhotoStorage} from '../storage-migration.js';
import {authEmailTransport} from '../auth-email-transport.js';
test('proveedor compartido exige autorización exacta y bloquea remitentes/buckets ajenos',async()=>{
 assert(!allowedEmailSender('mi-contacto@mail.direcciones507.com'));assert(allowedEmailSender('mi-contacto@mail.direcciones507.com',{reuseExistingSender:true}));assert(!allowedEmailSender('ventas@mail.direcciones507.com',{reuseExistingSender:true}));assert(!allowedEmailSender('Mi Contacto <mi-contacto@mail.direcciones507.com>',{reuseExistingSender:true}));
 assert(!allowedPhotoBucket('direcciones507-media'));assert(allowedPhotoBucket('direcciones507-media',{reuseExistingBucket:true}));assert(!allowedPhotoBucket('foreign-media',{reuseExistingBucket:true}));
 const env={MC_AUTH_EMAIL_ENABLED:'true',MC_EMAIL_ISOLATED:'true',MC_EMAIL_FROM:'mi-contacto@mail.direcciones507.com',MC_RESEND_API_KEY:'synthetic',MC_ACCEPTANCE_MODE:'true',MC_AUTH_EMAIL_RECIPIENTS:'owner@example.test'};
 assert.throws(()=>authEmailTransport(env));let payload;
 const send=authEmailTransport({...env,MC_REUSE_DIRECCIONES_EMAIL:'true'},{fetch:async(url,options)=>{payload=JSON.parse(options.body);return Response.json({id:'synthetic'});}});
 await send({to:'owner@example.test',kind:'REGISTER',url:'https://micontacto.online/acceso#token='+'a'.repeat(43)+'&purpose=REGISTER',idempotencyKey:'mc-auth-'+'b'.repeat(64),expiresMinutes:30});assert.equal(payload.from,'Mi Contacto <mi-contacto@mail.direcciones507.com>');
});
test('bucket existente: jamás consulta, modifica ni elimina claves Direcciones507',async()=>{
 const calls=[],objects=new Map(),client={async putObject(r){calls.push(r.key);objects.set(r.key,r.body);},async getObject(r){calls.push(r.key);return objects.get(r.key)??null;},async deleteObject(r){calls.push(r.key);objects.delete(r.key);}};
 const store=isolatedObjectStorage({client,bucket:'direcciones507-media',isolated:true,reuseExistingBucket:true});
 for(const key of ['addresses/'+randomUUID()+'/logo/a.webp','countries/CR/addresses/a/photo/b.webp','mi-contacto/../addresses/test.webp','mi-contacto/%2e%2e/test']){await assert.rejects(store.get(key));await assert.rejects(store.put(key,Buffer.from('x')));await assert.rejects(store.delete(key));}assert.equal(calls.length,0);
 const key='mi-contacto/'+randomUUID()+'/'+randomUUID()+'.webp';await store.put(key,Buffer.from('private'));assert.equal((await store.get(key)).toString(),'private');await store.delete(key);assert.equal(await store.get(key),null);assert(calls.every(k=>k.startsWith('mi-contacto/')));
});
test('migración conserva fotos previas, lee y copia sin borrar originales, reemplazo y eliminación en ambos destinos',async()=>{
 const old=memoryPhotoStorage(),r2=memoryPhotoStorage(),storage=migratingPhotoStorage(r2,old),key='mi-contacto/'+randomUUID()+'/'+randomUUID()+'.webp';await old.put(key,Buffer.from('original'));
 assert.equal((await storage.get(key)).toString(),'original');assert.equal((await r2.get(key)).toString(),'original');assert.equal((await old.get(key)).toString(),'original');await storage.put(key,Buffer.from('replacement'));assert.equal((await storage.get(key)).toString(),'replacement');await storage.delete(key);assert.equal(await old.get(key),null);assert.equal(await r2.get(key),null);
 await old.put(key,Buffer.from('safe'));const fail=migratingPhotoStorage({...r2,async put(){throw Error('R2 unavailable');}},old);await assert.rejects(fail.get(key));assert.equal((await old.get(key)).toString(),'safe');
});
