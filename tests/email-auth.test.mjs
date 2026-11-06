import {test} from 'node:test';
import assert from 'node:assert/strict';
import {testFixture} from '../scripts/test-fixture.mjs';
import {hashPassword,verifyPassword} from '../email-auth.js';
import {authEmailTransport} from '../auth-email-transport.js';

test('contraseñas con sal y límites; transporte desactivado y aislamiento obligatorio',async()=>{
 const a=await hashPassword('synthetic-password-1'),b=await hashPassword('synthetic-password-1');assert.notEqual(a,b);assert(await verifyPassword('synthetic-password-1',a));assert(!await verifyPassword('incorrect',a));assert(!await verifyPassword('x',null));await assert.rejects(hashPassword('short'));
 assert.equal(authEmailTransport({}),null);assert.throws(()=>authEmailTransport({MC_AUTH_EMAIL_ENABLED:'true'}));assert.throws(()=>authEmailTransport({MC_AUTH_EMAIL_ENABLED:'true',MC_EMAIL_ISOLATED:'true',MC_RESEND_API_KEY:'synthetic',MC_EMAIL_FROM:'acceso@mail.micontacto.online',MC_ACCEPTANCE_MODE:'true'}));
 let payload;const transport=authEmailTransport({MC_AUTH_EMAIL_ENABLED:'true',MC_EMAIL_ISOLATED:'true',MC_RESEND_API_KEY:'synthetic',MC_EMAIL_FROM:'acceso@mail.micontacto.online',MC_ACCEPTANCE_MODE:'true',MC_AUTH_EMAIL_RECIPIENTS:'owner@example.test'},{fetch:async(url,options)=>{payload=JSON.parse(options.body);assert.equal(options.redirect,'error');return Response.json({id:'synthetic-message'});}});
 await assert.rejects(transport({to:'other@example.test'}));await transport({to:'owner@example.test',kind:'RESET',url:'https://micontacto.online/acceso#token='+'a'.repeat(43)+'&purpose=RESET',idempotencyKey:'mc-auth-'+'a'.repeat(64),expiresMinutes:30});assert.match(payload.subject,/Mi Contacto/);assert.match(payload.text,/30 minutos/);
});

test('correo: verificación obligatoria, enlaces de un uso, recuperación, cambio y revocación',async t=>{
 let clock=Date.now(),sent=[];const f=await testFixture({now:()=>clock,emailTransport:async message=>sent.push(message)}),pw='synthetic-password-one',next='synthetic-password-two';
 const post=(action,body,options={})=>f.request('/api/auth/email/'+action,{as:null,method:'POST',body,...options});
 const token=()=>new URLSearchParams(new URL(sent.at(-1).url).hash.slice(1)).get('token');
 try{
  await t.test('opciones y página, rechaza origen falso sin enviar',async()=>{assert.equal((await (await f.request('/api/auth-options')).json()).emailEnabled,true);assert.match(await (await f.request('/acceso')).response.text(),/Acceso a Mi Contacto/);assert.equal((await post('register',{email:'new@example.test',password:pw},{headers:{origin:'https://evil.example'}})).status,403);assert.equal(sent.length,0);});
  await t.test('no hay cuenta habilitada ni sesión antes de verificar; contraseña confirma titularidad',async()=>{
   assert.equal((await post('register',{email:'New@Example.test',password:pw})).status,202);assert.equal(sent[0].to,'new@example.test');assert.equal((await post('login',{email:'new@example.test',password:pw})).status,401);
   const raw=token();assert.equal((await post('confirm',{token:raw,password:'wrong-password'})).status,400);assert.equal((await post('confirm',{token:raw,password:pw})).status,200);assert.equal((await post('confirm',{token:raw,password:pw})).status,400);
   const r=await post('login',{email:'new@example.test',password:pw});assert.equal(r.status,204);assert.match(r.response.headers.get('set-cookie'),/HttpOnly/);
   const session=r.response.headers.get('set-cookie').split(';')[0];f.emailSession=session;f.emailUser=(await f.pool.query("SELECT account_id FROM micontacto.email_identities WHERE email='new@example.test'")).rows[0].account_id;
   assert.equal((await f.request('/api/session',{as:null,headers:{cookie:session}})).status,200);
   const rows=(await f.pool.query('SELECT token_hash,password_hash FROM micontacto.auth_email_tokens')).rows;assert(!JSON.stringify(rows).includes(raw));
  });
  await t.test('registro existente no modifica contraseña; respuesta recuperación no enumera',async()=>{
   const before=sent.length;const r=await post('register',{email:'new@example.test',password:next});assert.equal(r.status,202);assert.equal(sent.length,before);
   const known=await post('recover',{email:'new@example.test'}),unknown=await post('recover',{email:'unknown@example.test'});assert.deepEqual(await known.json(),await unknown.json());assert.equal(sent.length,before+1);
   assert.equal((await post('confirm',{token:token(),password:next})).status,200);
   assert.equal((await f.request('/api/session',{as:null,headers:{cookie:f.emailSession}})).status,401);assert.equal((await post('login',{email:'new@example.test',password:pw})).status,401);assert.equal((await post('login',{email:'new@example.test',password:next})).status,204);
  });
  await t.test('cambio exige sesión, CSRF y contraseña actual; revoca todos los dispositivos',async()=>{
   const s=await f.app.auth.issue(f.emailUser),headers={cookie:'mc_session='+s.token,'x-mc-csrf':s.csrf};
   assert.equal((await post('change',{currentPassword:next,password:pw},{headers:{cookie:'mc_session='+s.token}})).status,403);
   assert.equal((await post('change',{currentPassword:'wrong',password:pw},{headers})).status,401);
   assert.equal((await post('change',{currentPassword:next,password:pw},{headers})).status,200);assert.equal((await f.request('/api/session',{as:null,headers:{cookie:'mc_session='+s.token}})).status,401);
  });
  await t.test('enlace vencido no cambia cuenta y límites persistentes detienen abuso',async()=>{
   clock+=3600001;assert.equal((await post('recover',{email:'new@example.test'})).status,202);const raw=token();clock+=1800001;assert.equal((await post('confirm',{token:raw,password:next})).status,400);
   for(let i=0;i<8;i++)assert.equal((await post('login',{email:'limit@example.test',password:pw})).status,401);assert.equal((await post('login',{email:'limit@example.test',password:pw})).status,429);
  });
 }finally{await f.pool.close();}
});

test('vincular correo conserva cuenta y perfil; requiere misma sesión y no fusiona identidades',async()=>{
 const sent=[],f=await testFixture({emailTransport:async message=>sent.push(message)}),pw='synthetic-password-link';
 try{
  const id=f.owner,request=(action,body,as='owner')=>f.request('/api/auth/email/'+action,{as,method:'POST',body});
  assert.equal((await request('link',{email:'linked@example.test',password:pw})).status,202);
  const token=new URLSearchParams(new URL(sent[0].url).hash.slice(1)).get('token');
  assert.equal((await request('confirm',{token,password:pw},'other')).status,400);
  assert.equal((await request('confirm',{token,password:pw})).status,200);
  assert.equal((await f.pool.query("SELECT account_id FROM micontacto.email_identities WHERE email='linked@example.test'")).rows[0].account_id,id);
  const before=(await f.pool.query('SELECT count(*)::int AS n FROM micontacto.accounts')).rows[0].n;
  const login=await request('login',{email:'linked@example.test',password:pw},null);assert.equal(login.status,204);
  assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.accounts')).rows[0].n,before);
  assert.equal((await request('link',{email:'linked@example.test',password:pw},'other')).status,202);assert.equal(sent.length,1);
 }finally{await f.pool.close();}
});

test('Google vinculado explícitamente conserva cuenta; sesión distinta y conflicto no fusionan',async()=>{
 let nonce='',subject='synthetic-google-linked';const f=await testFixture({google:{clientId:'synthetic-client',clientSecret:'synthetic-only'},emailTransport:async()=>{},verifyToken:async()=>({sub:subject,aud:'synthetic-client',iss:'https://accounts.google.com',exp:Math.floor(Date.now()/1000)+300,nonce}),fetch:async()=>Response.json({id_token:'synthetic-token'})});
 try{
  await f.pool.query('UPDATE micontacto.accounts SET google_subject=NULL WHERE id=$1',[f.owner]);await f.pool.query('INSERT INTO micontacto.email_identities(account_id,email,password_hash,verified_at) VALUES($1,$2,$3,now())',[f.owner,'owner@example.test',await hashPassword('synthetic-password-google')]);
  const start=()=>f.request('/auth/google/link',{method:'POST',body:{password:'synthetic-password-google'}});
  const before=(await f.pool.query('SELECT count(*)::int AS n FROM micontacto.accounts')).rows[0].n;
  let r=await start();assert.equal(r.status,200);let state=new URL((await r.json()).url).searchParams.get('state');nonce=(await f.pool.query('SELECT nonce FROM micontacto.oauth_transactions')).rows[0].nonce;
  let result=await f.request('/auth/google/callback?state='+state+'&code=synthetic',{as:'other',headers:{cookie:'mc_oauth='+state+'; mc_session='+f.sessions.other.token}});assert.equal(result.status,400);
  r=await start();assert.equal(r.status,200);state=new URL((await r.json()).url).searchParams.get('state');nonce=(await f.pool.query('SELECT nonce FROM micontacto.oauth_transactions')).rows[0].nonce;
  result=await f.request('/auth/google/callback?state='+state+'&code=synthetic',{headers:{cookie:'mc_oauth='+state+'; mc_session='+f.sessions.owner.token}});assert.equal(result.status,302);
  assert.equal((await f.pool.query('SELECT google_subject FROM micontacto.accounts WHERE id=$1',[f.owner])).rows[0].google_subject,subject);assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.accounts')).rows[0].n,before);assert.equal((await start()).status,409);
  // A separate existing Google account cannot be taken over by another email account.
  await f.pool.query('UPDATE micontacto.accounts SET google_subject=NULL WHERE id=$1',[f.other]);await f.pool.query('INSERT INTO micontacto.email_identities(account_id,email,password_hash,verified_at) VALUES($1,$2,$3,now())',[f.other,'other@example.test',await hashPassword('synthetic-password-google')]);
  r=await f.request('/auth/google/link',{as:'other',method:'POST',body:{password:'synthetic-password-google'}});state=new URL((await r.json()).url).searchParams.get('state');nonce=(await f.pool.query('SELECT nonce FROM micontacto.oauth_transactions')).rows[0].nonce;
  result=await f.request('/auth/google/callback?state='+state+'&code=synthetic',{headers:{cookie:'mc_oauth='+state+'; mc_session='+f.sessions.other.token}});assert.equal(result.status,400);assert.equal((await result.json()).error,'IDENTITY_ALREADY_LINKED');assert.equal((await f.pool.query('SELECT google_subject FROM micontacto.accounts WHERE id=$1',[f.other])).rows[0].google_subject,null);
 }finally{await f.pool.close();}
});

test('titular privado vincula Google después de verificar correo y contraseña, sin perder perfil ni ADMIN',async()=>{
 const {createAuth}=await import('../auth-runtime.js');const f=await testFixture();let nonce='';try{
  const id=(await(await f.request('/api/profiles',{as:'admin',method:'POST',body:{country:'PA',linkName:'bootstrap-link',displayName:'Titular sintético'}})).json()).id;
  const pw='synthetic-bootstrap-owner-password';await f.pool.query('UPDATE micontacto.accounts SET google_subject=$2 WHERE id=$1',[f.admin,'acceptance-owner:'+f.admin]);await f.pool.query('INSERT INTO micontacto.email_identities(account_id,email,password_hash,verified_at) VALUES($1,$2,$3,now())',[f.admin,'bootstrap@example.test',await hashPassword(pw)]);
  const options={secret:'synthetic-bootstrap-secret'.repeat(3),origin:f.origin,acceptance:true,acceptanceOwner:{accountId:f.admin,expiresAt:Date.now()+3600000},google:{clientId:'synthetic-client',clientSecret:'synthetic-only'},verifyToken:async()=>({sub:'synthetic-real-google-subject',aud:'synthetic-client',iss:'https://accounts.google.com',exp:Math.floor(Date.now()/1000)+300,nonce}),fetch:async()=>Response.json({id_token:'synthetic-token'})};const auth=createAuth(f.pool,options),session=await auth.issue(f.admin);
  const request=(password,instance=auth)=>instance.handle(new Request(f.origin+'/auth/google/link',{method:'POST',headers:{cookie:'mc_session='+session.token,origin:f.origin,'x-mc-csrf':session.csrf,'content-type':'application/json'},body:JSON.stringify({password})}));
  assert.equal((await request('wrong-password')).status,401);const ordinary=createAuth(f.pool,{...options,acceptanceOwner:null});assert.equal((await request(pw,ordinary)).status,409);
  const start=await request(pw);assert.equal(start.status,200);const state=new URL((await start.json()).url).searchParams.get('state');nonce=(await f.pool.query('SELECT nonce FROM micontacto.oauth_transactions')).rows[0].nonce;
  const response=await auth.handle(new Request(f.origin+'/auth/google/callback?code=synthetic&state='+state,{headers:{cookie:'mc_session='+session.token+'; mc_oauth='+state}}));assert.equal(response.status,302);
  assert.equal((await f.pool.query('SELECT account_id FROM micontacto.profiles WHERE id=$1',[id])).rows[0].account_id,f.admin);const a=(await f.pool.query('SELECT role,google_subject FROM micontacto.accounts WHERE id=$1',[f.admin])).rows[0];assert.equal(a.role,'ADMIN');assert.equal(a.google_subject,'synthetic-real-google-subject');assert.equal((await f.pool.query("SELECT count(*)::int AS n FROM micontacto.audit WHERE actor_id=$1 AND action='GOOGLE_IDENTITY_LINKED'",[f.admin])).rows[0].n,1);assert.equal((await request(pw)).status,409);
 }finally{await f.pool.close();}
});
