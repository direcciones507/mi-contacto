import {applyTerritoryCorrections,TERRITORY_CORRECTIONS} from '../territory-corrections.js';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const countries=new Set(['PA','CR','NI','SV','HN','GT','MX','CO']);
export function validateCatalog(data){
 if(!Array.isArray(data.regions)||!Array.isArray(data.localities))throw Error('INVALID_CATALOG');
 const regions=new Set(),localities=new Set();
 for(const r of data.regions){if(!countries.has(r.country)||typeof r.name!=='string'||!r.name.trim()||r.name.length>250||!r.source?.startsWith(r.country+'.')||![1,2].includes(r.level)||regions.has(r.source))throw Error('INVALID_REGION');regions.add(r.source);}
 const definitions=new Map(data.regions.map(r=>[r.source,r]));
 for(const r of data.regions)if(r.level===1&&r.parent||r.level===2&&(!r.parent||!definitions.has(r.parent)||definitions.get(r.parent).level!==1||!r.parent.startsWith(r.country+'.')))throw Error('INVALID_REGION_PARENT');
 for(const l of data.localities){const key=l.country+':'+l.source;if(!countries.has(l.country)||!/^\d+$/.test(l.source)||typeof l.name!=='string'||!l.name.trim()||l.name.length>250||!regions.has(l.region)||!l.region.startsWith(l.country+'.')||localities.has(key))throw Error('INVALID_LOCALITY');localities.add(key);}
 return {regions:regions.size,localities:localities.size};
}
/** Bulk import into the caller's isolated database, never fetches or discovers credentials. */
export async function loadCatalog(pool,{selectedCountries=[...countries],catalogData=null}={}){
 if(selectedCountries.some(c=>!countries.has(c)))throw Error('INVALID_COUNTRY');
 const bytes=readFileSync(new URL('../data/geonames-catalog.json.gz',import.meta.url)),data=catalogData??applyTerritoryCorrections(JSON.parse(gunzipSync(bytes)));validateCatalog(data);
 const regions=data.regions.filter(r=>selectedCountries.includes(r.country)),localities=data.localities.filter(l=>selectedCountries.includes(l.country));
 const client=await pool.connect();try{
  await client.query('BEGIN');
  for(const level of [1,2])await client.query(`INSERT INTO micontacto.geo_regions(country_code,source_id,name,admin_level,parent_id)
   SELECT x.country,x.source,x.name,x.level,p.id FROM jsonb_to_recordset($1::jsonb) AS x(country text,source text,name text,level smallint,parent text)
   LEFT JOIN micontacto.geo_regions p ON p.source_id=x.parent AND p.country_code=x.country
   ON CONFLICT(country_code,source_id) DO UPDATE SET name=EXCLUDED.name`,[JSON.stringify(regions.filter(r=>r.level===level))]);
  for(let i=0;i<localities.length;i+=5000)await client.query(`INSERT INTO micontacto.geo_localities(country_code,region_id,source_id,name)
   SELECT x.country,r.id,x.source,x.name FROM jsonb_to_recordset($1::jsonb) AS x(country text,source text,name text,region text)
   JOIN micontacto.geo_regions r ON r.country_code=x.country AND r.source_id=x.region
   ON CONFLICT(country_code,source_id) DO UPDATE SET name=EXCLUDED.name,region_id=EXCLUDED.region_id`,[JSON.stringify(localities.slice(i,i+5000))]);
  await client.query("INSERT INTO micontacto.catalog_sources(id,source_url,license,sha256,reviewed) VALUES($1,'https://download.geonames.org/export/dump/','CC BY 4.0',$2,false) ON CONFLICT(id) DO NOTHING",[(catalogData?'representative-test-':'geonames-20261031-corrected-'+TERRITORY_CORRECTIONS.version+'-')+selectedCountries.join('-'),createHash('sha256').update(catalogData?JSON.stringify(data):Buffer.concat([bytes,Buffer.from(JSON.stringify(TERRITORY_CORRECTIONS))])).digest('hex')]);
  await client.query('COMMIT');return {regions:regions.length,localities:localities.length,reviewRequired:true};
 }catch(e){if(e.code==='23503'&&e.constraint==='profile_locality_in_selected_region_fk')e.message='GEO_CHANGE_REQUIRES_PROFILE_RECONCILIATION';await client.query('ROLLBACK');throw e;}finally{client.release();}
}
