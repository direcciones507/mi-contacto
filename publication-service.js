import {normalizeSlug,validateSlug,DUPLICATE_SLUG_MESSAGE,profileUrl} from "./profile-slug.js";
const countries=new Set(["PA","CR","NI","SV","HN","GT","MX","CO"]);
/**
 * Publishing in another country is a new registration, not a silent relocation
 * of an existing published URL. An existing published URL/QR remains unchanged.
 * The adapter must atomically reserve (country,slug) and publish only after
 * all required geographic and moderation checks succeed.
 */
export async function requestCountryPublication(input,{accountId,db}){
 if(!accountId||!db||typeof db.requestPublication!=="function")
  throw Error("PUBLICATION_STORAGE_NOT_CONFIGURED");
 const country=String(input?.country??"").trim().toUpperCase();
 if(!countries.has(country))return {status:400,body:{code:"INVALID_COUNTRY",message:"Selecciona un país válido."}};
 const v=validateSlug(normalizeSlug(String(input?.linkName??"")));
 if(!v.ok)return {status:400,body:{code:v.code,message:v.message}};
 const regionId=Number(input?.regionId),localityId=Number(input?.localityId);
 if(!Number.isSafeInteger(regionId)||regionId<1||!Number.isSafeInteger(localityId)||localityId<1)
  return {status:400,body:{code:"LOCATION_REQUIRED",message:"Selecciona la provincia o región y la localidad."}};
 try{
  const result=await db.requestPublication({accountId,country,slug:v.slug,regionId,localityId});
  return {status:202,body:{code:"PENDING_REVIEW",message:"Solicitud enviada para revisión.",url:profileUrl(country,v.slug),id:result.id}};
 }catch(error){
  if(error?.code==="23505"&&["profiles_country_slug_key","profile_slug_reservations_pkey"].includes(error?.constraint))
   return {status:409,body:{code:"SLUG_TAKEN",field:"linkName",country,message:DUPLICATE_SLUG_MESSAGE}};
  if(error?.code==="INVALID_GEO_SELECTION")
   return {status:400,body:{code:"INVALID_GEO_SELECTION",message:"La localidad no corresponde a la región y país seleccionados."}};
  if(error?.code==="ALREADY_PUBLISHED")
   return {status:409,body:{code:"ALREADY_PUBLISHED",message:"El enlace publicado no puede cambiar de país. Crea una solicitud independiente."}};
  throw error;
 }
}
