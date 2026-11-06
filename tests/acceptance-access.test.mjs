import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createApplication} from '../application.js';
import {testFixture} from '../scripts/test-fixture.mjs';
const code='synthetic-private-code-for-owner-only',origin='https://mi-contacto-acceptance-acceptance.up.railway.app',secret='synthetic-session-'.repeat(4),hash=s=>createHash('sha256').update(s).digest('hex');
test('acceso privado: solo aceptación, código fuerte, CSRF, cuenta fija y caducidad de sesiones',async()=>{
 const f=await testFixture();let time=Date.now();try{
  const owner={accountId:f.admin,codeHash:hash(code),expiresAt:time+48*3600000};
  assert.throws(()=>createApplication({pool:f.pool,origin:'https://micontacto.online',secret,acceptanceOwner:owner}),/PRIVATE_ACCEPTANCE_ONLY/);
  assert.throws(()=>createApplication({pool:f.pool,origin:'https://micontacto.online',secret,acceptance:true,acceptanceOwner:owner}),/PRIVATE_ACCEPTANCE_ONLY/);
  await f.pool.query('UPDATE micontacto.accounts SET google_subject=$2 WHERE id=$1',[f.admin,'acceptance-owner:'+f.admin]);
  const app=createApplication({pool:f.pool,origin,secret,acceptance:true,acceptanceOwner:owner,now:()=>time});
  const page=await app.handle(new Request(origin+'/acceso-pruebas'));assert.equal(page.status,200);assert.equal(page.headers.get('referrer-policy'),'same-origin');const html=await page.text();assert.match(html,/Este acceso temporal no sustituye el inicio normal con Google o correo/);assert.doesNotMatch(html,new RegExp(code));
  const challenge=html.match(/name="challenge" value="([^"]+)"/)[1],cookie=page.headers.getSetCookie()[0].split(';')[0];assert.match(page.headers.getSetCookie()[0],/Secure; SameSite=Strict/);
  const login=(data={},headers={})=>app.handle(new Request(origin+'/acceso-pruebas',{method:'POST',headers:{origin,cookie,'content-type':'application/x-www-form-urlencoded',...headers},body:new URLSearchParams({challenge,code,...data})}));
  assert.equal((await login({},{origin:'https://evil.test'})).status,403);
  for(const badOrigin of ['null','',origin+'.evil.test','http://'+new URL(origin).host])assert.equal((await login({},{origin:badOrigin})).status,403);
  assert.equal((await login({},{'sec-fetch-site':'cross-site'})).status,403);
  assert.equal((await login({},{cookie:''})).status,401);
  assert.equal((await login({challenge:'tampered'})).status,401);assert.equal((await login({code:'wrong'})).status,401);
  const accepted=await login();assert.equal(accepted.status,303);assert.equal(accepted.headers.get('location'),'/mi-perfil');
  const session=accepted.headers.getSetCookie().find(c=>c.startsWith('mc_session=')).split(';')[0];
  const read=await app.handle(new Request(origin+'/api/session',{headers:{cookie:session}}));assert.equal(read.status,200);assert.equal((await read.json()).user.role,'ADMIN');
  time=owner.expiresAt+1;assert.equal((await app.handle(new Request(origin+'/api/session',{headers:{cookie:session}}))).status,401);assert.equal((await app.handle(new Request(origin+'/acceso-pruebas'))).status,404);
 }finally{await f.pool.close();}
});
test('acceso privado: limita intentos y no permite elegir cuenta o activar credenciales inexistentes',async()=>{
 const f=await testFixture();try{
  const app=createApplication({pool:f.pool,origin,secret,acceptance:true,acceptanceOwner:{accountId:f.admin,codeHash:hash(code),expiresAt:Date.now()+3600000}});
  for(let i=0;i<10;i++)assert.equal((await app.handle(new Request(origin+'/acceso-pruebas',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:'code=wrong'}))).status,401);
  assert.equal((await app.handle(new Request(origin+'/acceso-pruebas',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:'code=wrong'}))).status,429);
  assert.equal((await f.app.handle(new Request(f.origin+'/acceso-pruebas'))).status,404);
 }finally{await f.pool.close();}
});
