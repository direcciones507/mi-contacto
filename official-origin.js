/** Public origin is explicit; never derive session/OAuth URLs from proxy headers. */
export const OFFICIAL_ORIGIN='https://micontacto.online';
export const TECHNICAL_HOST='mi-contacto-acceptance-acceptance.up.railway.app';
export function privateOfficialOriginAllowed({origin,acceptance=false,privateOfficialOrigin=false}){
 return acceptance===true&&privateOfficialOrigin===true&&origin===OFFICIAL_ORIGIN;
}
export function officialRequestPolicy({host,method,url},origin){
 if(origin!==OFFICIAL_ORIGIN)return null;
 const headers={'cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
 if(host==='micontacto.online'||host==='micontacto.online:443')return null;
 const path=(url??'').split('?')[0];
 if(['GET','HEAD'].includes(method)&&['/health','/health/ready'].includes(path))return null;
 if(host!==TECHNICAL_HOST)return new Response('Origen no permitido.',{status:421,headers});
 if(!['GET','HEAD'].includes(method))return new Response('Usa https://micontacto.online para esta operación.',{status:403,headers});
 if(path.startsWith('/auth/google/callback'))return new Response('Inicia el acceso nuevamente desde https://micontacto.online.',{status:400,headers});
 if(typeof url!=='string'||!url.startsWith('/')||url.startsWith('//'))return new Response(null,{status:400,headers});
 return new Response(null,{status:308,headers:{...headers,location:OFFICIAL_ORIGIN+url}});
}
