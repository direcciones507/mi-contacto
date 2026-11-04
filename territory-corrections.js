import {readFileSync} from 'node:fs';
export const TERRITORY_CORRECTIONS=JSON.parse(readFileSync(new URL('./data/territory-corrections.json',import.meta.url),'utf8'));
/** Copy-on-write, stable source IDs; never infer ancestry from a homonymous name. */
export function applyTerritoryCorrections(data,patch=TERRITORY_CORRECTIONS){
 const regions=data.regions.map(r=>({...r})),localities=data.localities.map(l=>({...l}));
 const byRegion=new Map(regions.map(r=>[r.source,r])),byLocality=new Map(localities.map(l=>[l.country+':'+l.source,l]));
 for(const r of patch.regions){const old=byRegion.get(r.source);if(old){if(old.country!==r.country||old.parent!==r.parent||old.name!==r.name)throw Error('TERRITORY_PATCH_CONFLICT');continue;}if(!byRegion.has(r.parent))throw Error('TERRITORY_PATCH_PARENT_MISSING');const row={country:r.country,source:r.source,name:r.name,level:r.level,parent:r.parent};regions.push(row);byRegion.set(r.source,row);}
 for(const change of patch.localities){const row=byLocality.get(change.country+':'+change.source);if(!row||row.name!==change.expectedName||![change.from,change.to].includes(row.region))throw Error('TERRITORY_PATCH_SOURCE_CHANGED');if(byRegion.get(change.to)?.country!==change.country)throw Error('TERRITORY_PATCH_PARENT_MISSING');row.region=change.to;}
 return {regions,localities};
}
export const territoryDisplayName=name=>String(name??'').replace(/ (?:Department|Province)$/,'').replace(/^Mexico City$/,'Ciudad de México');
