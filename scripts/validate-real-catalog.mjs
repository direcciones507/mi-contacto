import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localDatabase} from './local-database.mjs';
import {loadCatalog} from './load-catalog.mjs';
const local=await localDatabase();
try{
 await local.migrate();const loaded=await loadCatalog(local.pool);
 const actual=(await local.pool.query('SELECT country_code,count(*)::int AS n FROM micontacto.geo_localities GROUP BY country_code ORDER BY country_code')).rows;
 const expected=JSON.parse(readFileSync(new URL('../data/catalog-provenance.json',import.meta.url),'utf8')).counts;
 assert.equal(actual.length,8);for(const row of actual)assert.equal(row.n,expected[row.country_code]);
 const invalid=(await local.pool.query('SELECT count(*)::int AS n FROM micontacto.geo_localities l LEFT JOIN micontacto.geo_regions r ON r.id=l.region_id AND r.country_code=l.country_code WHERE r.id IS NULL')).rows[0].n;assert.equal(invalid,0);
 console.log(JSON.stringify({engine:'discardable PostgreSQL WASM; not native concurrency',...loaded,actual,invalidParents:invalid,manualTerritorialReviewComplete:false,realProfiles:0},null,2));
}finally{await local.pool.close();}
