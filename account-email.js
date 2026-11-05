// Adapted from core/runtime/account-email.ts at direcciones507/direcciones507
// 3576029d97e1d1699b6213451e7eee9a556e1590. Configuration belongs only to Mi Contacto.
// Keep identity, allowlists and consent policy in auth-email-transport.js.
export function createAccountMailer(env, request=fetch){
 const from=env.MC_EMAIL_FROM?.trim()??'';
 const resendKey=env.MC_RESEND_API_KEY?.trim()??'';
 const configured=!!resendKey&&!!from;
 async function send(mail){
  if(!configured)return {sent:false,reason:'EMAIL_NOT_CONFIGURED'};
  const response=await request('https://api.resend.com/emails',{
   method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+resendKey,...(mail.idempotencyKey?{'idempotency-key':mail.idempotencyKey}:{})},
   body:JSON.stringify({from,to:[mail.to],subject:mail.subject,text:mail.text}),
   signal:AbortSignal.timeout(10000),redirect:'error'
  });
  if(!response.ok)throw Error('EMAIL_DELIVERY_FAILED');
  return {sent:true};
 }
 return {configured,send};
}
