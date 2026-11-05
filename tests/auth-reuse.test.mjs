import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAccountMailer} from '../account-email.js';
import {authEmailTransport} from '../auth-email-transport.js';
import {readCookie} from '../auth-cookies.js';

test('adaptador reutilizado: sin configuración no envía ni usa variables ajenas',async()=>{
 let calls=0;
 const mailer=createAccountMailer({RESEND_API_KEY:'synthetic-other-project',EMAIL_FROM:'other@example.test'},async()=>{calls++;throw Error('not expected');});
 assert.equal(mailer.configured,false);
 assert.deepEqual(await mailer.send({to:'synthetic@example.test',subject:'Mi Contacto',text:'test'}),{sent:false,reason:'EMAIL_NOT_CONFIGURED'});
 assert.equal(calls,0);
});

test('adaptador reutilizado: contrato Resend, idempotencia y fallo cerrado',async()=>{
 const calls=[];
 const mailer=createAccountMailer({MC_RESEND_API_KEY:'synthetic-exclusive',MC_EMAIL_FROM:'Mi Contacto <acceso@mail.micontacto.online>'},async(url,options)=>{
  calls.push({url,...options});return Response.json({id:'synthetic'});
 });
 const mail={to:'synthetic@example.test',subject:'Mi Contacto',text:'Texto sintético',idempotencyKey:'synthetic-idempotency'};
 assert.deepEqual(await mailer.send(mail),{sent:true});
 assert.equal(calls[0].url,'https://api.resend.com/emails');
 assert.equal(calls[0].redirect,'error');
 assert.equal(calls[0].headers['idempotency-key'],mail.idempotencyKey);
 assert.deepEqual(JSON.parse(calls[0].body),{from:'Mi Contacto <acceso@mail.micontacto.online>',to:[mail.to],subject:mail.subject,text:mail.text});
 const rejected=createAccountMailer({MC_RESEND_API_KEY:'synthetic',MC_EMAIL_FROM:'synthetic'},async()=>new Response('',{status:403}));
 await assert.rejects(rejected.send(mail),/EMAIL_DELIVERY_FAILED/);
});

test('verificación recuperación y vinculación usan exclusivamente identidad Mi Contacto',async()=>{
 const payloads=[];
 const env={MC_AUTH_EMAIL_ENABLED:'true',MC_EMAIL_ISOLATED:'true',MC_RESEND_API_KEY:'synthetic',MC_EMAIL_FROM:'acceso@mail.micontacto.online',MC_ACCEPTANCE_MODE:'true',MC_AUTH_EMAIL_RECIPIENTS:'synthetic@example.test'};
 const send=authEmailTransport(env,{fetch:async(url,options)=>{payloads.push(JSON.parse(options.body));return Response.json({id:'synthetic'});}});
 for(const kind of ['REGISTER','RESET','LINK'])await send({to:'synthetic@example.test',kind,url:'https://micontacto.online/acceso#token=synthetic',idempotencyKey:'synthetic-'+kind,expiresMinutes:30});
 assert.equal(payloads.length,3);
 for(const payload of payloads){assert.match(payload.from,/^Mi Contacto </);assert.match(payload.subject,/Mi Contacto/);assert.match(payload.text,/Mi Contacto/);assert.doesNotMatch(JSON.stringify(payload),/Direcciones507|Direcciones LATAM|Empleos/i);}
 await assert.rejects(authEmailTransport(env,{fetch:async()=>{throw Error('private provider details');}})({to:'synthetic@example.test',kind:'RESET'}),/^Error: AUTH_EMAIL_SEND_FAILED$/);
});

test('lector reutilizado: cookies Mi Contacto independientes, duplicados y codificación inválida',()=>{
 const req=value=>new Request('https://micontacto.online',{headers:{cookie:value}});
 assert.equal(readCookie(req('ad507_session=source; mc_session=destination'),'mc_session'),'destination');
 assert.equal(readCookie(req('ad507_session=source'),'mc_session'),null);
 assert.equal(readCookie(req('mc_session=one; mc_session=two'),'mc_session'),null);
 assert.equal(readCookie(req('mc_session=%E0%A4%A'),'mc_session'),null);
 assert.equal(readCookie(req('mc_session=value%2Dencoded'),'mc_session'),'value-encoded');
});
