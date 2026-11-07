import {test} from 'node:test';
import assert from 'node:assert/strict';
import {testFixture} from '../scripts/test-fixture.mjs';
test('public SEO is crawlable, canonical, territorial and excludes personal or private URLs',async()=>{
 const f=await testFixture();try{
 for(const path of ['/','/directorio','/directorio/pa','/directorio/pa/region/'+f.geo.PA.regionId,'/directorio/pa/localidad/'+f.geo.PA.localityId]){
  const r=(await f.request(path,{as:null})).response;assert.equal(r.status,200,path);assert.equal(r.headers.get('x-robots-tag'),'index, follow');const html=await r.text();assert.match(html,new RegExp('rel="canonical" href="'+f.origin+path+'"'));assert.match(html,/og:description/);assert(!html.includes('noindex'));
 }
 for(const path of ['/directorio/xx','/directorio/pa/region/999999999','/directorio/cr/region/'+f.geo.PA.regionId])assert.equal((await f.request(path,{as:null})).status,404);
 await f.pool.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code,url_country,status,review_decision,region_id,locality_id,directory_consent,location_consent) VALUES(gen_random_uuid(),$1,'Private SEO name','seo-person','PA','pa','ACTIVE','APPROVED',$2,$3,true,true)",[f.owner,f.geo.PA.regionId,f.geo.PA.localityId]);
 const populated=await (await f.request('/sitemap.xml',{as:null})).response.text();assert.match(populated,new RegExp('/directorio/pa/region/'+f.geo.PA.regionId));assert.match(populated,new RegExp('/directorio/pa/localidad/'+f.geo.PA.localityId));assert(!populated.includes('seo-person'));assert(!populated.includes('Private SEO name'));
 const listing=await (await f.request('/directorio/pa',{as:null})).response.text();assert.match(listing,/Private SEO name/);
 await f.pool.query('UPDATE micontacto.profiles SET location_consent=false WHERE account_id=$1',[f.owner]);const withdrawn=await (await f.request('/sitemap.xml',{as:null})).response.text();assert(!withdrawn.includes('/region/'));
 const sitemap=await (await f.request('/sitemap.xml',{as:null})).response.text();assert.match(sitemap,/<loc>https:\/\/micontacto.online\/directorio\/pa<\/loc>/);assert(!/acceso|mi-perfil|admin|\/pa\/[a-z]|@/.test(sitemap));
 const robots=await (await f.request('/robots.txt',{as:null})).response.text();assert.match(robots,/Sitemap: https:\/\/micontacto.online\/sitemap.xml/);assert(!robots.includes('Disallow: /directorio'));
 const access=(await f.request('/acceso',{as:null})).response;assert.match(access.headers.get('x-robots-tag'),/noindex/);assert.match(await access.text(),/noindex/);
 }finally{await f.pool.close();}
});
