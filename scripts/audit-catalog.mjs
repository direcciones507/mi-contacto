import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {validateCatalog} from './load-catalog.mjs';
const bytes=readFileSync(new URL('../data/geonames-catalog.json.gz',import.meta.url)),data=JSON.parse(gunzipSync(bytes));
const provenance=JSON.parse(readFileSync(new URL('../data/catalog-provenance.json',import.meta.url)));validateCatalog(data);
const normalize=s=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('es');
const parents=new Map(data.regions.map(r=>[r.source,r]));
const result=[],globalIds=new Map(),crossCountryIds=[];for(const l of data.localities){if(globalIds.has(l.source)&&globalIds.get(l.source)!==l.country)crossCountryIds.push({source:l.source,countries:[globalIds.get(l.source),l.country]});globalIds.set(l.source,l.country);}
for(const country of ['PA','CO','CR','GT','SV','HN','NI','MX']){
 const regions=data.regions.filter(x=>x.country===country),localities=data.localities.filter(x=>x.country===country),groups=new Map();
 for(const l of localities){const key=l.region+'|'+normalize(l.name);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(l);}
 const duplicates=[...groups.values()].filter(v=>v.length>1);const regionGroups=new Map();for(const r of regions){const key=(r.parent??country)+'|'+normalize(r.name);if(!regionGroups.has(key))regionGroups.set(key,[]);regionGroups.get(key).push(r);}const regionDuplicates=[...regionGroups.values()].filter(v=>v.length>1);
 if(localities.length!==provenance.counts[country])throw Error('CATALOG_COUNT_MISMATCH_'+country);
 result.push({country,regions:regions.length,level1:regions.filter(x=>x.level===1).length,level2:regions.filter(x=>x.level===2).length,localities:localities.length,localitiesWithOnlyLevel1:localities.filter(x=>parents.get(x.region).level===1).length,duplicateNameGroupsWithinSameRegion:duplicates.length,duplicateRegionNameGroupsWithinSameParent:regionDuplicates.length,regionExamples:regionDuplicates.slice(0,5).map(g=>({name:g[0].name,parent:g[0].parent??country,sourceIds:g.map(x=>x.source)})),examples:duplicates.slice(0,10).map(g=>({name:g[0].name,region:g[0].region,sourceIds:g.map(x=>x.source)})),quarantinedWithoutRegion:provenance.quarantinedWithoutRegion[country]});
}
console.log(JSON.stringify({source:'existing GeoNames snapshot 2026-10-31, CC BY 4.0',sha256:createHash('sha256').update(bytes).digest('hex'),structuralValidation:'PASS',invalidParents:0,duplicateSourceIds:0,crossCountrySourceIdConflicts:crossCountryIds,countries:result,nationalReviewComplete:false,changesToCatalog:0,notes:['Homonyms are review candidates, not proof of erroneous or duplicate settlements. Never merge by name.','Level-1-only rows lack a verified municipal relation; no invented municipality.','National names, codes, boundaries and version dates require independent review before launch.']},null,2));
