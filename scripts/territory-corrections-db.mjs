import {TERRITORY_CORRECTIONS} from '../territory-corrections.js';
import {randomUUID,createHash} from 'node:crypto';
/** Small idempotent overlay. Never moves an existing person's selected territory. */
export async function applyVerifiedTerritories(pool){
 const version='verified-territories-'+TERRITORY_CORRECTIONS.version,tx=await pool.connect();
 try{await tx.query('BEGIN');await tx.query('SELECT pg_advisory_xact_lock(5072027)');if((await tx.query('SELECT id FROM micontacto.catalog_sources WHERE id=$1',[version])).rows.length){await tx.query('COMMIT');return {alreadyApplied:true};}
  const report={createdRegions:0,correctedLocalities:0,preservedProfiles:0,missingReferences:0};
  for(const r of TERRITORY_CORRECTIONS.regions){const parent=(await tx.query('SELECT id FROM micontacto.geo_regions WHERE country_code=$1 AND source_id=$2',[r.country,r.parent])).rows[0];if(!parent){report.missingReferences++;continue;}const inserted=await tx.query('INSERT INTO micontacto.geo_regions(country_code,source_id,name,admin_level,parent_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(country_code,source_id) DO NOTHING RETURNING id',[r.country,r.source,r.name,r.level,parent.id]);report.createdRegions+=inserted.rows.length;}
  for(const change of TERRITORY_CORRECTIONS.localities){const row=(await tx.query('SELECT l.id,l.name,l.region_id,r.source_id FROM micontacto.geo_localities l JOIN micontacto.geo_regions r ON r.id=l.region_id WHERE l.country_code=$1 AND l.source_id=$2 FOR UPDATE OF l',[change.country,change.source])).rows[0],target=(await tx.query('SELECT id FROM micontacto.geo_regions WHERE country_code=$1 AND source_id=$2',[change.country,change.to])).rows[0];if(!row||!target){report.missingReferences++;continue;}if(row.source_id===change.to)continue;if(row.name!==change.expectedName||row.source_id!==change.from){report.missingReferences++;continue;}
   if((await tx.query('SELECT id FROM micontacto.profiles WHERE locality_id=$1',[row.id])).rows.length){report.preservedProfiles++;continue;}
   await tx.query('UPDATE micontacto.geo_localities SET region_id=$2 WHERE id=$1',[row.id,target.id]);report.correctedLocalities++;
  }
  // If any referenced/missing item is pending, a later approved reconciliation may retry.
  if(!report.missingReferences&&!report.preservedProfiles)await tx.query("INSERT INTO micontacto.catalog_sources(id,source_url,license,sha256,reviewed) VALUES($1,$2,$3,$4,false)",[version,'https://www.geonames.org/','GeoNames CC BY 4.0; corrections cite official sources',createHash('sha256').update(JSON.stringify(TERRITORY_CORRECTIONS)).digest('hex')]);
  await tx.query('COMMIT');return report;
 }catch(e){await tx.query('ROLLBACK');throw e;}finally{tx.release();}
}
