import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {resendTestTransport} from '../receipt-resend.js';
const config={apiKey:'re_synthetic_exclusive',from:'comprobantes@mail.micontacto.online',allowedRecipients:['synthetic@example.test'],isolated:true,enabled:true};
const message={to:'synthetic@example.test',subject:'Comprobante de prueba',text:'COMPROBANTE DE PRUEBA. Sin cobro real.',idempotencyKey:'mc-receipt-test-'+randomUUID()};
test('transporte Resend de pruebas: aislamiento, destinatario y clave estables',async()=>{
 assert.throws(()=>resendTestTransport({...config,enabled:false}),/CONFIGURATION/);assert.throws(()=>resendTestTransport({...config,from:'ventas@mail.direcciones507.com'}),/CONFIGURATION/);
 let calls=0;const send=resendTestTransport(config,async(url,options)=>{calls++;assert.equal(url,'https://api.resend.com/emails');assert.equal(options.headers['idempotency-key'],message.idempotencyKey);assert.equal(JSON.parse(options.body).to[0],message.to);assert.equal(options.redirect,'error');return Response.json({id:'synthetic-provider-id'});});
 await assert.rejects(send({...message,to:'unauthorized@example.test'}),e=>e.permanent===true);assert.equal(calls,0);
 assert.equal((await send(message)).id,'synthetic-provider-id');assert.equal((await send(message)).id,'synthetic-provider-id');assert.equal(calls,2);
});
test('transporte de correo: errores permanentes, transitorios e inciertos no filtran respuestas',async()=>{
 for(const status of [401,422,429,500]){const send=resendTestTransport(config,async()=>new Response('private-token',{status}));await assert.rejects(send(message),e=>e.message==='EMAIL_PROVIDER_REJECTED'&&e.permanent===[401,422].includes(status));}
 const uncertain=resendTestTransport(config,async()=>{throw Error('private-key');});await assert.rejects(uncertain(message),/^Error: EMAIL_UNCONFIRMED$/);
});
