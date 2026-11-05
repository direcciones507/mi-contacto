import {test} from 'node:test';
import assert from 'node:assert/strict';
import {acceptanceConfiguration} from '../acceptance-config.js';
import {probePhotos} from '../service-probes.js';
import {memoryPhotoStorage} from '../photo-storage.js';
test('preflight sin secretos: datos ausentes y TLS inválido impiden listo',()=>{
 const empty=acceptanceConfiguration({});assert.equal(empty.readyForDedicatedServer,false);assert.ok(empty.groups.google.missing.includes('MC_GOOGLE_CLIENT_SECRET'));
 const env={MC_ORIGIN:'https://micontacto.online',MC_SESSION_SECRET:'private-secret-'.repeat(4),MC_DATABASE_URL:'postgresql://private:private-password@db.example.test/mi_contacto',MC_DATABASE_ISOLATED:'true',MC_STORAGE:'local',MC_PHOTO_ROOT:'/private/photos',MC_GOOGLE_CLIENT_ID:'exclusive.apps.googleusercontent.com',MC_GOOGLE_CLIENT_SECRET:'private-client-secret'};
 const report=acceptanceConfiguration(env);assert.equal(report.readyForDedicatedServer,false);assert.doesNotMatch(JSON.stringify(report),/private-password|private-client-secret|private-secret/);
 assert.equal(acceptanceConfiguration({...env,MC_DATABASE_TLS:'true'}).readyForDedicatedServer,true);
 assert.ok(acceptanceConfiguration({...env,MC_YAPPY_ENVIRONMENT:'production'}).invalid.includes('MC_YAPPY_ENVIRONMENT'));
});
test('prueba de almacenamiento: reemplaza y retira solo su objeto generado, incluso ante fallo',async()=>{
 const base=memoryPhotoStorage();assert.equal((await probePhotos(base)).testObjectsRemaining,0);
 let key,deleted=false;const faulty={...base,async put(k,b){key=k;await base.put(k,b);},async get(){throw Error('synthetic unavailable');},async delete(k){assert.equal(k,key);deleted=true;await base.delete(k);}};
 await assert.rejects(probePhotos(faulty),/synthetic unavailable/);assert.equal(deleted,true);assert.equal(await base.get(key),null);
});

test('preflight admite acceso por correo exclusivo sin Google y rechaza remitente ajeno sin exponer valores',()=>{
 const env={MC_ORIGIN:'https://micontacto.online',MC_SESSION_SECRET:'exclusive-secret-'.repeat(4),MC_DATABASE_URL:'postgresql://private:private-password@db.example.test/mi_contacto',MC_DATABASE_ISOLATED:'true',MC_DATABASE_TLS:'true',MC_STORAGE:'local',MC_PHOTO_ROOT:'/private/photos',MC_AUTH_EMAIL_ENABLED:'true',MC_EMAIL_ISOLATED:'true',MC_EMAIL_FROM:'acceso@mail.micontacto.online',MC_RESEND_API_KEY:'synthetic-private-key'};
 assert.equal(acceptanceConfiguration(env).readyForDedicatedServer,true);assert.equal(acceptanceConfiguration(env).emailAuthEnabled,true);
 const denied=acceptanceConfiguration({...env,MC_EMAIL_FROM:'foreign@example.test'});assert.equal(denied.readyForDedicatedServer,false);assert.doesNotMatch(JSON.stringify(denied),/synthetic-private-key|private-password/);
});
