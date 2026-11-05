import {allowedEmailSender} from './provider-reuse.js';
import {emailDocument} from './transactional-email.js';
/** Explicit test-only transport. Never sends during construction. */
export function resendTestTransport({apiKey,from,allowedRecipients,isolated=false,enabled=false,reuseExistingSender=false}={},http=fetch){
 const email=/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
 if(!enabled||!isolated||typeof apiKey!=='string'||!apiKey.startsWith('re_')||typeof from!=='string'||!email.test(from)||!allowedEmailSender(from,{reuseExistingSender}))throw Error('EXCLUSIVE_TEST_EMAIL_CONFIGURATION_REQUIRED');
 if(!Array.isArray(allowedRecipients)||!allowedRecipients.length||allowedRecipients.length>10||allowedRecipients.some(v=>typeof v!=='string'||!email.test(v)))throw Error('EXPLICIT_TEST_RECIPIENTS_REQUIRED');
 const allow=new Set(allowedRecipients);
 return async function send({to,subject,text,idempotencyKey}){
  if(!allow.has(to)||typeof subject!=='string'||!subject.includes('prueba')||typeof text!=='string'||!text.includes('COMPROBANTE DE PRUEBA')||!/^mc-receipt-test-[a-f0-9-]{36}$/.test(idempotencyKey??''))throw Object.assign(Error('INVALID_TEST_EMAIL'),{permanent:true});
  let r;try{r=await http('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{authorization:'Bearer '+apiKey,'content-type':'application/json','idempotency-key':idempotencyKey},body:JSON.stringify({from:'Mi Contacto <'+from+'>',to:[to],subject,text,html:emailDocument({subject,text})})});}catch{throw Error('EMAIL_UNCONFIRMED');}
  if(!r.ok)throw Object.assign(Error('EMAIL_PROVIDER_REJECTED'),{permanent:r.status>=400&&r.status<500&&![408,429].includes(r.status)});
  let body;try{const reader=r.body?.getReader();if(!reader)throw Error();const parts=[];let n=0;try{while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>16384){await reader.cancel();throw Error();}parts.push(value);}}finally{reader.releaseLock();}body=JSON.parse(Buffer.concat(parts).toString());}catch{throw Error('EMAIL_UNCONFIRMED');}
  if(typeof body.id!=='string'||!body.id||body.id.length>200)throw Error('EMAIL_UNCONFIRMED');return {id:body.id};
 };
}
