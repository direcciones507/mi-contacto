import {privateOfficialOriginAllowed} from './official-origin.js';
import {randomBytes,createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {layout} from './views.js';
import {applicationOrigin} from './origin-policy.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function acceptanceAccess(pool,auth,{secret,origin,acceptance=false,privateOfficialOrigin=false,config=null,onEvent=()=>{},now=()=>Date.now()}){
 if(config&&(!acceptance||new URL(origin).hostname==='micontacto.online'&&!privateOfficialOriginAllowed({origin,acceptance,privateOfficialOrigin})))throw Error('PRIVATE_ACCEPTANCE_ONLY');
 if(config&&(!/^[a-f0-9-]{36}$/.test(config.accountId??'')||!/^[a-f0-9]{64}$/.test(config.codeHash??'')||!Number.isFinite(config.expiresAt)))throw Error('INVALID_ACCEPTANCE_ACCESS');
 // Compare with the configured public origin, never the proxy Host/X-Forwarded-* headers.
 const publicOrigin=applicationOrigin(origin,{acceptance}).origin;
 const enabled=()=>!!config&&now()<config.expiresAt;
 const sign=s=>createHmac('sha256',secret).update('mc-acceptance:'+s).digest('hex');
 const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
 const event=reason=>{try{onEvent({event:'PRIVATE_ACCESS',reason});}catch{}};
 const cookie=value=>'mc_acceptance_challenge='+value+'; Path=/acceso-pruebas; HttpOnly; Secure; SameSite=Strict; Max-Age='+(value?'600':'0');
 let minute=-1,attempts=0;
 function challenge(){const value=randomBytes(24).toString('hex')+'.'+Math.floor(now()/1000+600);return value+'.'+sign(value);}
 function valid(value){if(typeof value!=='string'||!/^([a-f0-9]{48})\.([0-9]{10})\.([a-f0-9]{64})$/.test(value))return false;const parts=value.split('.');return parts.length===3&&Number(parts[1])*1000>now()&&Number(parts[1])*1000<=now()+600000&&same(parts[2],sign(parts[0]+'.'+parts[1]));}
 const html=(status,body,headers={})=>new Response(layout('Acceso privado de pruebas',body,{script:null}),{status,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store',...headers}});
 async function handle(req){
  if(new URL(req.url).pathname!=='/acceso-pruebas')return null;
  if(!enabled()){event('UNAVAILABLE');return new Response('Acceso de pruebas no disponible.',{status:404});}
  if(req.method==='GET'){
   const signedIn=await auth.current(req);if(signedIn?.id===config.accountId&&signedIn.role==='ADMIN'&&signedIn.status==='ACTIVE')return new Response(null,{status:303,headers:{location:'/mi-perfil','cache-control':'no-store'}});
   const existing=(req.headers.get('cookie')??'').split(';').map(s=>s.trim()).filter(s=>s.startsWith('mc_acceptance_challenge='));
   // Keep unexpired browser/form binding stable across refreshes and concurrent tabs.
   const candidate=existing.length===1?existing[0].slice('mc_acceptance_challenge='.length):null;
   const token=valid(candidate)?candidate:challenge();return html(200,'<section class="contact-card"><p>Acceso temporal de aceptación. Este acceso temporal no sustituye el inicio normal con Google o correo. Usa solamente datos de prueba.</p><form method="post" action="/acceso-pruebas"><input type="hidden" name="challenge" value="'+token+'"><label>Código privado<input type="password" name="code" autocapitalize="none" autocorrect="off" spellcheck="false" minlength="20" maxlength="128" autocomplete="current-password" required></label><button type="submit">Entrar a pruebas</button></form></section>',{'set-cookie':cookie(token)});
  }
  if(req.method!=='POST')return new Response(null,{status:405});
  if(req.headers.get('origin')!==publicOrigin||req.headers.get('sec-fetch-site')==='cross-site'){event('ORIGIN_REJECTED');return new Response('Solicitud no permitida.',{status:403});}
  const current=Math.floor(now()/60000);if(minute!==current){minute=current;attempts=0;}if(++attempts>10){event('RATE_LIMITED');return new Response('Espera un minuto antes de reintentar.',{status:429});}
  if(!req.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))return new Response(null,{status:400});
  let size=0;const chunks=[];for await(const part of req.body??[]){size+=part.length;if(size>4096)return new Response(null,{status:413});chunks.push(Buffer.from(part));}
  const data=new URLSearchParams(Buffer.concat(chunks).toString()),values=(req.headers.get('cookie')??'').split(';').map(s=>s.trim()).filter(s=>s.startsWith('mc_acceptance_challenge='));
  const token=values.length===1?values[0].slice('mc_acceptance_challenge='.length):null;
  const code=data.get('code');
  let rejection=null;
  if(data.getAll('code').length!==1||data.getAll('challenge').length!==1)rejection='FORM_INVALID';
  else if(values.length===0)rejection='COOKIE_MISSING';
  else if(values.length!==1)rejection='COOKIE_AMBIGUOUS';
  else if(!valid(token))rejection='CHALLENGE_INVALID_OR_EXPIRED';
  else if(!same(token,data.get('challenge')))rejection='CHALLENGE_MISMATCH';
  else if(typeof code!=='string'||code.length>128||!same(hash(code),config.codeHash))rejection='CODE_REJECTED';
  if(rejection){
   event(rejection);
   const explanation=['COOKIE_MISSING','COOKIE_AMBIGUOUS'].includes(rejection)?'El navegador no conservó la cookie de acceso. Permite las cookies de este sitio y vuelve a abrir el formulario.':rejection==='CHALLENGE_INVALID_OR_EXPIRED'||rejection==='CHALLENGE_MISMATCH'?'La sesión del formulario venció o cambió. Abre de nuevo el acceso e inténtalo otra vez.':'No se pudo verificar el acceso.';
   // A mistyped code must not invalidate another still-valid tab. Other failures reset only this challenge.
   return html(401,'<p role="alert">'+explanation+'</p><a href="/acceso-pruebas">Volver a intentarlo</a>',rejection==='CODE_REJECTED'?{}:{'set-cookie':cookie('')});
  }
  const account=(await pool.query("SELECT id FROM micontacto.accounts WHERE id=$1 AND google_subject=$2 AND role='ADMIN' AND status='ACTIVE'",[config.accountId,'acceptance-owner:'+config.accountId])).rows[0];if(!account){event('ACCOUNT_UNAVAILABLE');return new Response('Acceso no disponible.',{status:403});}
  const session=await auth.issue(account.id);event('ACCEPTED');const headers=new Headers({location:'/mi-perfil','cache-control':'no-store'});headers.append('set-cookie',session.cookie);headers.append('set-cookie',cookie(''));return new Response(null,{status:303,headers});
 }
 return {handle,enabled};
}
