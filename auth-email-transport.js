/** Explicit, isolated transactional email only. No account or sender is provisioned. */
export function authEmailTransport(env,{fetch:network=fetch}={}){
 if(env.MC_AUTH_EMAIL_ENABLED!=='true')return null;
 if(env.MC_EMAIL_ISOLATED!=='true'||!env.MC_RESEND_API_KEY||! /^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/.test(env.MC_EMAIL_FROM??''))throw Error('AUTH_EMAIL_CONFIGURATION_REQUIRED');
 const recipients=(env.MC_AUTH_EMAIL_RECIPIENTS??'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(env.MC_ACCEPTANCE_MODE==='true'&&!recipients.length)throw Error('AUTH_EMAIL_TEST_ALLOWLIST_REQUIRED');
 return async({to,kind,url,idempotencyKey,expiresMinutes})=>{
  if(recipients.length&&!recipients.includes(to))throw Error('AUTH_EMAIL_RECIPIENT_NOT_ALLOWED');
  const title=kind==='RESET'?'Restablece tu contraseña de Mi Contacto':'Confirma tu correo en Mi Contacto';
  const response=await network('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{authorization:'Bearer '+env.MC_RESEND_API_KEY,'content-type':'application/json','idempotency-key':idempotencyKey},body:JSON.stringify({from:'Mi Contacto <'+env.MC_EMAIL_FROM+'>',to:[to],subject:title,text:title+'\n\nAbre el enlace y escribe '+(kind==='RESET'?'tu nueva contraseña':'la contraseña que elegiste en Mi Contacto')+':\n'+url+'\n\nEl enlace vence en '+expiresMinutes+' minutos y solo puede usarse una vez. Si no lo solicitaste, ignora este mensaje.'})});
  if(!response.ok)throw Error('AUTH_EMAIL_SEND_FAILED');
 };
}
