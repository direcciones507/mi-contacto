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
