import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authenticationEmail,emailDocument,confirmedEmailResponse} from '../transactional-email.js';
import {authEmailTransport} from '../auth-email-transport.js';
import {passwordWork} from '../password-work.js';
const url=kind=>'https://micontacto.online/acceso#token='+'a'.repeat(43)+'&purpose='+kind;
test('plantillas de registro, vinculación y recuperación: identidad, texto, HTML accesible y enlace de un uso',()=>{
 for(const kind of ['REGISTER','LINK','RESET']){const t=authenticationEmail({kind,url:url(kind),expiresMinutes:30});assert.match(t.subject,/Mi Contacto/);assert.match(t.html,/lang="es"/);assert.match(t.text,/una vez/);assert.match(t.text,/30 minutos/);assert(!t.html.includes('Direcciones507'));}
 const escaped=emailDocument({subject:'<script>',text:'<img src=x onerror=alert(1)>'});assert(!escaped.includes('<img'));assert.match(escaped,/&lt;img/);
 assert.throws(()=>authenticationEmail({kind:'UNKNOWN',url:url('RESET'),expiresMinutes:30}));
});
test('transporte exclusivo: origen e identidad, rechazo antes del envío, confirmación acotada',async()=>{
 let calls=0;const env={MC_AUTH_EMAIL_ENABLED:'true',MC_EMAIL_ISOLATED:'true',MC_RESEND_API_KEY:'synthetic',MC_EMAIL_FROM:'acceso@mail.micontacto.online',MC_ORIGIN:'https://micontacto.online',MC_ACCEPTANCE_MODE:'true',MC_AUTH_EMAIL_RECIPIENTS:'owner@example.test'};
 assert.throws(()=>authEmailTransport({...env,MC_EMAIL_FROM:'soporte@mail.direcciones507.com'}));
 const send=authEmailTransport(env,{fetch:async()=>{calls++;return Response.json({id:'synthetic-message'});}}),data={to:'owner@example.test',kind:'LINK',url:url('LINK'),expiresMinutes:30,idempotencyKey:'mc-auth-'+'b'.repeat(64)};
 await assert.rejects(send({...data,url:data.url.replace('micontacto.online','evil.example')}));await assert.rejects(send({...data,to:'unknown@example.test'}));await assert.rejects(send({...data,idempotencyKey:'bad'}));assert.equal(calls,0);assert.equal((await send(data)).id,'synthetic-message');
 await assert.rejects(confirmedEmailResponse(Response.json({})));await assert.rejects(confirmedEmailResponse(new Response('x'.repeat(17000))));await assert.rejects(confirmedEmailResponse(new Response('{}',{status:429})));
});
test('hashing: cupo concurrente y cola limitados, liberación tras fallo y sobrecarga rechazada',async()=>{
 const run=passwordWork({parallel:2,waiting:1});let active=0,peak=0;const releases=[];
 const task=()=>run(async()=>{peak=Math.max(peak,++active);try{await new Promise(r=>releases.push(r));}finally{active--;}});
 const a=task(),b=task(),c=task();await assert.rejects(task(),/AUTH_BUSY/);assert.equal(peak,2);releases.shift()();await a;releases.shift()();await b;releases.shift()();await c;assert.equal(active,0);
 await assert.rejects(run(()=>{throw Error('failure');}));assert.equal(await run(()=>7),7);
});
