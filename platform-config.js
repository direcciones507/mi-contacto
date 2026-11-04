export const PLATFORM={origin:"https://micontacto.online",schema:"micontacto",cookie:"mc_session",countries:["PA","CR","NI","SV","HN","GT","MX","CO"]};
export function checkPlatformConfig(config){
 const errors=[];
 if(config?.origin!==PLATFORM.origin)errors.push("INVALID_ORIGIN");
 if(config?.schema!==PLATFORM.schema)errors.push("INVALID_SCHEMA");
 if(config?.cookie!==PLATFORM.cookie)errors.push("INVALID_COOKIE");
 if(!String(config?.storagePrefix??"").startsWith("mi-contacto/"))errors.push("INVALID_STORAGE_PREFIX");
 if(!config?.databaseUrl)errors.push("MISSING_DATABASE");
 return {ok:errors.length===0,errors};
}
/** Exact, controlled origins only. Staging opt-in cannot authorize other project domains. */
export function validateApplicationOrigin(value,{stage='production'}={}){
 let url;try{url=new URL(value);}catch{throw Error('INVALID_ORIGIN');}
 if(url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('INVALID_ORIGIN');
 const local=url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname);
 const production=url.origin===PLATFORM.origin;
 const staging=stage==='staging'&&url.protocol==='https:'&&!url.port&&(/^(staging|pruebas)\.micontacto\.online$/.test(url.hostname)||/^mi-contacto-[a-z0-9-]+\.up\.railway\.app$/.test(url.hostname));
 if(!local&&!production&&!staging)throw Error('INVALID_ORIGIN');return url.origin;
}
