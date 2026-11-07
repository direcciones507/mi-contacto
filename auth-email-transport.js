import {allowedEmailSender} from './provider-reuse.js';
import {authenticationEmail,confirmedEmailResponse} from './transactional-email.js';
/** Verified sender for all valid recipients. No messages are sent on startup. */
export function authEmailTransport(env,{fetch:network=fetch}={}){
 if(env.MC_AUTH_EMAIL_ENABLED!=='true')return null;
 if(env.MC_EMAIL_ISOLATED!=='true'||!env.MC_RESEND_API_KEY||!allowedEmailSender(env.MC_EMAIL_FROM,{reuseExistingSender:env.MC_REUSE_DIRECCIONES_EMAIL==='true'}))throw Error('AUTH_EMAIL_CONFIGURATION_REQUIRED');
 const origin=new URL(env.MC_ORIGIN??'https://micontacto.online').origin;
 return async({to,kind,url,idempotencyKey,expiresMinutes})=>{
  if(typeof to!=='string'||! /^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/.test(to))throw Error('AUTH_EMAIL_RECIPIENT_NOT_ALLOWED');
  if(new URL(url).origin!==origin||! /^mc-auth-[a-f0-9]{64}$/.test(idempotencyKey??''))throw Error('INVALID_AUTH_EMAIL');
  const template=authenticationEmail({kind,url,expiresMinutes});
  const response=await network('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{authorization:'Bearer '+env.MC_RESEND_API_KEY,'content-type':'application/json','idempotency-key':idempotencyKey},body:JSON.stringify({from:'Mi Contacto <'+env.MC_EMAIL_FROM+'>',to:[to],...template})});
  return confirmedEmailResponse(response);
 };
}
