import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {officialRequestPolicy,privateOfficialOriginAllowed,OFFICIAL_ORIGIN,TECHNICAL_HOST} from '../official-origin.js';
import {createApplication} from '../application.js';
import {testFixture} from '../scripts/test-fixture.mjs';
test('dominio oficial: redirección de navegación y acceso técnico limitado sin confiar en hosts ajenos',()=>{
 const req={host:TECHNICAL_HOST,method:'GET',url:'/mi-perfil?view=owner'};
 const redirected=officialRequestPolicy(req,OFFICIAL_ORIGIN);assert.equal(redirected.status,308);assert.equal(redirected.headers.get('location'),OFFICIAL_ORIGIN+req.url);
 assert.equal(officialRequestPolicy({...req,url:'/health/ready'},OFFICIAL_ORIGIN),null);assert.equal(officialRequestPolicy({...req,host:'healthcheck.railway.app',url:'/health/ready'},OFFICIAL_ORIGIN),null);
 assert.equal(officialRequestPolicy({...req,method:'POST'},OFFICIAL_ORIGIN).status,403);
 assert.equal(officialRequestPolicy({...req,url:'/auth/google/callback?code=private'},OFFICIAL_ORIGIN).status,400);
 assert.equal(officialRequestPolicy({...req,url:'//external.invalid'},OFFICIAL_ORIGIN).status,400);
 for(const host of ['external.invalid','micontacto.online.external.invalid',undefined,'micontacto.online:3000'])assert.equal(officialRequestPolicy({...req,host},OFFICIAL_ORIGIN).status,421);
 assert.equal(officialRequestPolicy({...req,host:'micontacto.online'},OFFICIAL_ORIGIN),null);
 assert.equal(privateOfficialOriginAllowed({origin:OFFICIAL_ORIGIN,privateOfficialOrigin:true}),false);
});
test('acceso privado en dominio oficial requiere doble opción y conserva cookies/origen/CSRF',async()=>{
 const f=await testFixture();try{
 const secret='synthetic-session-secret'.repeat(3),code='synthetic-private-official-domain-code';
 const owner={accountId:f.admin,codeHash:createHash('sha256').update(code).digest('hex'),expiresAt:Date.now()+60000};
 await f.pool.query('UPDATE micontacto.accounts SET google_subject=$2 WHERE id=$1',[f.admin,'acceptance-owner:'+f.admin]);
 assert.throws(()=>createApplication({pool:f.pool,secret,origin:OFFICIAL_ORIGIN,privateOfficialOrigin:true,acceptanceOwner:owner}),/PRIVATE_ACCEPTANCE_ONLY/);
 const app=createApplication({pool:f.pool,secret,origin:OFFICIAL_ORIGIN,acceptance:true,privateOfficialOrigin:true,acceptanceOwner:owner});
 const page=await app.handle(new Request(OFFICIAL_ORIGIN+'/acceso-pruebas'));assert.equal(page.status,200);const html=await page.text(),challenge=html.match(/name="challenge" value="([^"]+)"/)[1],cookie=page.headers.getSetCookie()[0].split(';')[0];
 const login=origin=>app.handle(new Request(OFFICIAL_ORIGIN+'/acceso-pruebas',{method:'POST',headers:{origin,cookie,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,challenge})}));
 assert.equal((await login('https://'+TECHNICAL_HOST)).status,403);const signed=await login(OFFICIAL_ORIGIN);assert.equal(signed.status,303);assert.equal(signed.headers.get('location'),'/mi-perfil');
 const session=signed.headers.getSetCookie().find(x=>x.startsWith('mc_session='));assert.match(session,/Secure/);assert.match(session,/HttpOnly/);assert(!session.includes('Domain='));
 const response=await app.handle(new Request(OFFICIAL_ORIGIN+'/api/session',{headers:{cookie:session.split(';')[0]}}));assert.equal(response.status,200);
 }finally{await f.pool.close();}
});
