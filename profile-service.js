import {normalizeSlug,validateSlug,DUPLICATE_SLUG_MESSAGE,profileUrl} from "./profile-slug.js";
export const PROFILE_STATUSES=Object.freeze(["DRAFT","PENDING_REVIEW","ACTIVE","PAUSED","BLOCKED","DELETED"]);
export function validateProfileDraft(input){
 if(!input||typeof input!=="object")throw Error("INVALID_PROFILE");
 const displayName=String(input.displayName??"").trim();
 if(displayName.length<2||displayName.length>120)throw Error("INVALID_DISPLAY_NAME");
 const candidate=normalizeSlug(String(input.linkName??""));
 const validation=validateSlug(candidate);
 if(!validation.ok)throw Error(validation.code);
 const country=String(input.country??"").toUpperCase();
 if(!["PA","CR","NI","SV","HN","GT","MX","CO"].includes(country))throw Error("INVALID_COUNTRY");
 const profession=String(input.profession??"").trim().slice(0,120);
 const description=String(input.description??"").trim().slice(0,1000);
 return {displayName,slug:validation.slug,country,profession,description};
}
export function slugConflictResponse(){
 return {status:409,body:{code:"SLUG_TAKEN",message:DUPLICATE_SLUG_MESSAGE}};
}
/** Application logic, requires an isolated DB adapter with an atomic transaction.
 * Adapter.createProfile must enforce UNIQUE(slug), UNIQUE(account_id), and reserve
 * slug in the same transaction. Never use a preflight check as the final authority.
 */
export async function createProfile(input,{accountId,db}){
 if(!accountId||!db||typeof db.createProfile!=="function")throw Error("PROFILE_STORAGE_NOT_CONFIGURED");
 const draft=validateProfileDraft(input);
 try {
  const created=await db.createProfile({...draft,accountId,status:"DRAFT"});
  return {status:201,body:{id:created.id,slug:draft.slug,country:draft.country,url:profileUrl(draft.country,draft.slug)}};
 }catch(error){
  if(error?.code==="23505"&&["profiles_country_slug_key","profiles_slug_key"].includes(error?.constraint))return slugConflictResponse();
  if(error?.code==="23505"&&error?.constraint==="profile_slug_reservations_pkey")return slugConflictResponse();
  if(error?.code==="23505"&&error?.constraint==="profiles_account_id_key")
   return {status:409,body:{code:"ACCOUNT_PROFILE_EXISTS",message:"Esta cuenta ya tiene un perfil."}};
  throw error;
 }
}
