import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {layout} from './views.js';
import {NOTICE_TITLE,COMMUNITY,DECLARATIONS} from './protection-policy.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function protectionGate({secret,origin,digest,now=()=>Date.now()}){
 const cookieName='mc_notice',secure=new URL(origin).protocol==='https:';
 const sign=s=>createHmac('sha256',secret).update(s).digest('base64url');
 const cookie=req=>{const c=(req.headers.get('cookie')??'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(cookieName+'='));return c.length===1?c[0].slice(cookieName.length+1):'';};
 function verify(token){try{const [value,mac]=token.split('.');if(!mac||mac.length!==43||!timingSafeEqual(Buffer.from(mac),Buffer.from(sign(value))))return false;const d=JSON.parse(Buffer.from(value,'base64url'));return d.digest===digest&&d.expires>now()&&d.expires<=now()+3600000;}catch{return false;}}
 const accepted=req=>verify(cookie(req));
 function noticeMarkup(){
  const value=Buffer.from(JSON.stringify({digest,expires:now()+3600000,nonce:randomBytes(24).toString('base64url')})).toString('base64url'),token=value+'.'+sign(value);
  const items=COMMUNITY.map(([heading,body])=>'<section><h3>'+esc(heading)+'</h3><p>'+esc(body)+'</p></section>').join('');
  return '<div class="mc-notice-backdrop" role="presentation"><section class="mc-notice-dialog" role="dialog" aria-modal="true" aria-labelledby="mc-notice-heading"><h2 id="mc-notice-heading">'+esc(NOTICE_TITLE)+'</h2><div class="mc-notice-scroll"><p><strong>Mi Contacto es exclusivamente para mayores de 18 años.</strong></p><p>Lee nuestras normas antes de acceder. Las autorizaciones específicas de tu perfil se solicitan por separado antes de publicar.</p>'+items+'<p>Al aceptar confirmas que eres mayor de edad y que cumplirás las condiciones generales de acceso.</p><nav aria-label="Documentos legales"><a href="/terminos" target="_blank" rel="noopener">Términos y condiciones</a> · <a href="/privacidad" target="_blank" rel="noopener">Privacidad</a> · <a href="/comunidad" target="_blank" rel="noopener">Normas de la comunidad</a></nav></div><form class="mc-notice-actions" method="post" action="/aviso"><input type="hidden" name="token" value="'+token+'"><a href="/rechazar-aviso" class="mc-notice-decline">No acepto</a><button type="submit">Acepto y continuar</button></form></section></div>';
 }
 function decorateHome(html){

  return html.replace('</body>',noticeMarkup()+'</body>');
 }
 function page(){return layout(NOTICE_TITLE,noticeMarkup(),{script:null});}

 async function handle(req){const path=new URL(req.url).pathname;if(path==='/rechazar-aviso'&&req.method==='GET')return new Response(null,{status:303,headers:{location:'/entrada-no-aceptada','set-cookie':cookieName+'=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'+(secure?'; Secure':'')}});if(path!=='/aviso')return null;if(req.method==='GET')return new Response(page(),{headers:{'content-type':'text/html; charset=utf-8'}});if(req.method!=='POST')return new Response(null,{status:405});if(req.headers.get('origin')!==origin||req.headers.get('sec-fetch-site')==='cross-site')return new Response('Solicitud no autorizada',{status:403});const raw=await req.text();if(raw.length>2048)return new Response(null,{status:413});const f=new URLSearchParams(raw);if(!verify(f.get('token')??''))return new Response('La confirmación venció. Recarga la página e inténtalo de nuevo.',{status:400});return new Response(null,{status:303,headers:{location:'/','set-cookie':cookieName+'='+f.get('token')+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600'+(secure?'; Secure':'')}});}
 return {accepted,handle,decorateHome};
}
