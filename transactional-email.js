const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function emailDocument({subject,text}){
 if(typeof subject!=='string'||typeof text!=='string'||subject.length>200||text.length>20000)throw Error('INVALID_EMAIL_TEMPLATE');
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>'+escape(subject)+'</title></head><body style="font-family:Arial,sans-serif;background:#f2f6fb;color:#162844;margin:0;padding:24px"><main style="max-width:600px;margin:auto;background:white;padding:24px;border-radius:12px"><p style="font-size:22px;color:#0a438f"><strong>Mi Contacto</strong></p><h1 style="font-size:22px">'+escape(subject)+'</h1><div style="white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6">'+escape(text)+'</div></main></body></html>';
}
export function authenticationEmail({kind,url,expiresMinutes}){
 const titles={REGISTER:'Confirma tu correo en Mi Contacto',LINK:'Vincula tu correo a Mi Contacto',RESET:'Restablece tu contraseña de Mi Contacto'};
 const subject=titles[kind];if(!subject||!Number.isInteger(expiresMinutes)||expiresMinutes<1||expiresMinutes>60)throw Error('INVALID_AUTH_EMAIL');
 const target=new URL(url);if(target.username||target.password||target.pathname!=='/acceso'||target.search||target.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(target.hostname))throw Error('INVALID_AUTH_EMAIL');
 const fragment=new URLSearchParams(target.hash.slice(1));if(fragment.get('purpose')!==kind||! /^[A-Za-z0-9_-]{43}$/.test(fragment.get('token')??''))throw Error('INVALID_AUTH_EMAIL');
 const text=subject+'\n\nAbre este enlace en Mi Contacto y escribe '+(kind==='RESET'?'tu nueva contraseña':'la contraseña que elegiste en Mi Contacto')+':\n'+target.href+'\n\nEl enlace vence en '+expiresMinutes+' minutos y solo puede usarse una vez. Si no lo solicitaste, ignora este mensaje. Mi Contacto nunca te pedirá tu contraseña por correo.';
 return {subject,text,html:emailDocument({subject,text})};
}
export async function confirmedEmailResponse(response){
 if(!response.ok)throw Error('EMAIL_PROVIDER_REJECTED');
 const reader=response.body?.getReader();if(!reader)throw Error('EMAIL_UNCONFIRMED');const chunks=[];let length=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>16384){await reader.cancel();throw Error('EMAIL_UNCONFIRMED');}chunks.push(value);}}finally{reader.releaseLock();}
 let result;try{result=JSON.parse(Buffer.concat(chunks).toString());}catch{throw Error('EMAIL_UNCONFIRMED');}
 if(typeof result.id!=='string'||!result.id||result.id.length>200)throw Error('EMAIL_UNCONFIRMED');return {id:result.id};
}
