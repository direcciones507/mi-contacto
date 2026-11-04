import {urlHash} from './erasure.js';
import {normalizeSlug,validateSlug} from "./profile-slug.js";
const countries=new Set(["PA","CR","NI","SV","HN","GT","MX","CO"]);
/** Check for user feedback only; the UNIQUE(country_code,slug) constraint is authoritative at save. */
export async function checkSlugAvailability({country,linkName},db){
 const c=String(country??"").trim().toUpperCase();
 if(!countries.has(c))return {status:400,body:{code:"INVALID_COUNTRY"}};
 const v=validateSlug(normalizeSlug(String(linkName??"")));
 if(!v.ok)return {status:400,body:{code:v.code,message:v.message}};
 if(!db||typeof db.isSlugTaken!=="function")throw Error("SLUG_LOOKUP_NOT_CONFIGURED");
 const taken=await db.isSlugTaken({country:c,slug:v.slug});
 return {status:200,body:{country:c,slug:v.slug,available:!taken,message:taken?"Este nombre de enlace ya existe. Por favor, elige otro nombre para continuar.":"Nombre de enlace disponible en este país."}};
}
/** Use a parameterized read against the isolated Mi Contacto database. */
export function slugLookupPostgres(pool){
 if(!pool||typeof pool.query!=="function")throw Error("POSTGRES_POOL_REQUIRED");
 return {async isSlugTaken({country,slug}){
  const result=await pool.query(
   "SELECT EXISTS(SELECT 1 FROM micontacto.profiles WHERE url_country=$1 AND slug=$2 UNION ALL SELECT 1 FROM micontacto.profile_slug_reservations WHERE country_code=$1 AND slug=$2 UNION ALL SELECT 1 FROM micontacto.deleted_urls WHERE url_hash=$3) AS taken",
   [country,slug,urlHash(country,slug)]);
  return result.rows[0]?.taken===true;
 }};
}
