// Configuración de presentación de Mi Contacto. Los catálogos territoriales reales se integrarán tras su auditoría.
export const COUNTRIES = Object.freeze([
  {code:"PA",name:"Panamá",dial:"+507",levels:["Provincia o comarca","Distrito","Ciudad o localidad"]},
  {code:"CR",name:"Costa Rica",dial:"+506",levels:["Provincia","Cantón","Ciudad o localidad"]},
  {code:"NI",name:"Nicaragua",dial:"+505",levels:["Departamento / región","Municipio","Sector"]},
  {code:"SV",name:"El Salvador",dial:"+503",levels:["Departamento","Municipio","Ciudad o localidad"]},
  {code:"HN",name:"Honduras",dial:"+504",levels:["Departamento","Municipio","Sector"]},
  {code:"GT",name:"Guatemala",dial:"+502",levels:["Departamento","Municipio","Zona / sector"]},
  {code:"MX",name:"México",dial:"+52",levels:["Entidad federativa","Municipio / alcaldía","Ciudad o localidad"]},
  {code:"CO",name:"Colombia",dial:"+57",levels:["Departamento o distrito capital","Municipio","Ciudad o localidad"]}
]);
export function getCountry(code){return COUNTRIES.find(c=>c.code===code)||null;}
export function normalizeLocationFilters(input){const country=getCountry(input.country);if(!country)return {country:"",region:"",locality:""};return {country:country.code,region:String(input.region||"").trim(),locality:String(input.locality||"").trim()};}
export function buildDirectoryQuery(filters){const f=normalizeLocationFilters(filters);const p=new URLSearchParams();if(f.country)p.set("country",f.country);if(f.region)p.set("region",f.region);if(f.locality)p.set("locality",f.locality);const q=String(filters.keyword||"").trim();if(q)p.set("q",q);return p.toString();}
