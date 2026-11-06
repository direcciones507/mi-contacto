import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {randomUUID} from 'node:crypto';
import {testFixture} from '../scripts/test-fixture.mjs';
import {applyTerritoryCorrections,territoryDisplayName,TERRITORY_CORRECTIONS} from '../territory-corrections.js';
import {legalConfig,policyDigest,POLICY_VERSION,PRIVACY_TEXT,TERMS_TEXT} from '../legal.js';
import {loadCatalog} from '../scripts/load-catalog.mjs';
export const fixtureLegal=legalConfig({MC_LEGAL_APPROVED:'true',MC_LEGAL_CONTROLLER:'Responsable sintético',MC_PRIVACY_CONTACT:'privacy@example.invalid',MC_RETENTION_NOTICE:'Solo datos sintéticos del entorno aislado.',MC_PROCESSING_NOTICE:'Entorno local sintético; sin transferencias reales.'},{requireApproval:true});
const sampleIds={PA:'3701117',CO:'3674962',CR:'3621849',GT:'3598132',SV:'3583361',HN:'3600949',NI:'3617763',MX:'4005539'};
function representative(){const original=JSON.parse(gunzipSync(readFileSync(new URL('../data/geonames-catalog.json.gz',import.meta.url))));const corrected=applyTerritoryCorrections(original);const ids=new Set([...Object.values(sampleIds),...TERRITORY_CORRECTIONS.localities.map(l=>l.source)]),localities=corrected.localities.filter(l=>ids.has(l.source));const needed=new Set(localities.map(l=>l.region));for(const r of corrected.regions)if(needed.has(r.source)&&r.parent)needed.add(r.parent);return {original,corrected,subset:{regions:corrected.regions.filter(r=>needed.has(r.source)),localities}};}

test('correcciones territoriales versionadas conservan origen/homónimos y reconocen cantones nuevos',()=>{
 const {original,corrected}=representative();assert.equal(original.localities.find(l=>l.source==='3583361').region,'SV.10');assert.equal(corrected.localities.find(l=>l.source==='3583361').region,'SV.10.12954160');assert.equal(corrected.regions.filter(r=>r.country==='CR'&&r.level===2).length,84);
 assert.equal(corrected.localities.find(l=>l.source==='3622812').region,'CR.06.703');assert.equal(corrected.localities.find(l=>l.source==='3622811').region,'CR.official.612');assert.equal(corrected.localities.length,original.localities.length);assert.deepEqual(applyTerritoryCorrections(corrected),corrected);
 const changed=structuredClone(original);changed.localities.find(l=>l.source==='3583361').region='SV.01';assert.throws(()=>applyTerritoryCorrections(changed),/TERRITORY_PATCH_SOURCE_CHANGED/);
 assert.equal(territoryDisplayName('Veraguas Province'),'Veraguas');assert.equal(territoryDisplayName('Mexico City'),'Ciudad de México');
});

test('directorio funcional representativo de ocho países con IDs reales de catálogo; base WASM, no nativa',async()=>{
 const f=await testFixture({simulation:true}),{subset}=representative(),result=[];
 try{
  await loadCatalog(f.pool,{catalogData:subset});
  for(const [country,source] of Object.entries(sampleIds)){
   const location=(await f.pool.query('SELECT l.id,l.region_id,l.name,r.source_id AS region_source,r.parent_id FROM micontacto.geo_localities l JOIN micontacto.geo_regions r ON r.id=l.region_id WHERE l.country_code=$1 AND l.source_id=$2',[country,source])).rows[0];assert.ok(location);
   const account=randomUUID();await f.pool.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[account,'synthetic-territory-'+account]);const created=await f.app.profiles.create(account,{country,linkName:'territorio-'+country.toLowerCase(),displayName:'Persona sintética '+country,profession:'Prueba'});assert.equal(created.status,201);const id=created.body.id;
   const p=await f.app.profiles.detail(account,id);await f.app.profiles.update(account,id,{version:p.version,displayName:p.displayName,profession:'Prueba',description:'',regionId:location.region_id,localityId:location.id,phone:'',whatsapp:'',latitude:null,longitude:null,directoryConsent:true,contactConsent:false,locationConsent:true});
   await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED' WHERE id=$1",[id]);const term=await f.app.features.prepare(account,id,1);await f.app.features.activateSimulation(account,id,term.id,'synthetic-territory-'+randomUUID());
   const filtered='/api/directory?country='+country+'&regionId='+location.region_id+'&localityId='+location.id;const rows=(await(await f.request(filtered,{as:null})).json()).items;assert.equal(rows.length,1);assert.equal(rows[0].id,id);
   const other=country==='PA'?'CR':'PA';assert.equal((await(await f.request('/api/directory?country='+other+'&regionId='+location.region_id+'&localityId='+location.id,{as:null})).json()).items.length,0);
   const options=(await(await f.request('/api/localities?country='+country+'&regionId='+location.region_id,{as:null})).json()).items;assert.ok(options.find(l=>l.id===location.id)?.region_name);result.push({country,source,region:location.region_source,locality:location.name,correctTerritory:true,wrongCountryExcluded:true});
  }
  writeFileSync(new URL('../docs/evidence/unification-photos-20261105/territory-representative.json',import.meta.url),JSON.stringify({engine:'PostgreSQL WASM; not native',cases:result,fullCatalogRevalidation:false,manualNationalCertification:false},null,2)+'\n');
 }finally{await f.pool.close();}
});

test('corregir territorio referenciado exige reconciliar perfil y revierte sin cambiar datos existentes',async()=>{
 const f=await testFixture();try{
  const {subset}=representative();await loadCatalog(f.pool,{catalogData:subset});const loc=(await f.pool.query("SELECT id,region_id FROM micontacto.geo_localities WHERE source_id='3583361' AND country_code='SV'")).rows[0];const id=(await f.app.profiles.create(f.owner,{country:'SV',linkName:'no-mover-datos',displayName:'Persona sintética'})).body.id;
  await f.pool.query('UPDATE micontacto.profiles SET region_id=$2,locality_id=$3 WHERE id=$1',[id,loc.region_id,loc.id]);
  const changed=structuredClone(subset),top=changed.regions.find(r=>r.source==='SV.10');changed.localities.find(l=>l.source==='3583361').region=top.source;
  await assert.rejects(loadCatalog(f.pool,{catalogData:changed}),/GEO_CHANGE_REQUIRES_PROFILE_RECONCILIATION/);assert.equal((await f.pool.query('SELECT region_id FROM micontacto.geo_localities WHERE id=$1',[loc.id])).rows[0].region_id,loc.region_id);
 }finally{await f.pool.close();}
});

test('privacidad y términos: borrador explícito, configuración productiva bloqueada hasta aprobación',async()=>{
 assert.throws(()=>legalConfig({},{requireApproval:true}),/LEGAL_REVIEW_AND_CONTROLLER/);assert.throws(()=>legalConfig({MC_LEGAL_APPROVED:'true'},{requireApproval:true}),/LEGAL_REVIEW_AND_CONTROLLER/);assert.ok(PRIVACY_TEXT.length>5&&TERMS_TEXT.length>5);
 const f=await testFixture();try{for(const path of ['/privacidad','/terminos']){const r=await f.request(path,{as:null});assert.equal(r.status,200);assert.match(await r.response.text(),/Borrador pendiente/);}}finally{await f.pool.close();}
});

test('aceptación legal por cuenta: explícita, versionada, CSRF, idempotente y previa a crear/publicar',async()=>{
 const f=await testFixture({legal:fixtureLegal});try{
  const info=await(await f.request('/api/legal',{as:null})).json();assert.equal(info.approved,true);assert.equal(info.version,POLICY_VERSION);assert.equal(info.policyDigest,policyDigest(fixtureLegal));const create=()=>f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'consentimiento',displayName:'Persona sintética'}});
  assert.equal((await create()).status,201);const draftId=(await f.pool.query('SELECT id FROM micontacto.profiles WHERE account_id=$1',[f.owner])).rows[0].id;assert.equal((await f.request('/api/profiles/'+draftId+'/publish',{method:'POST'})).status,428);const acceptance={acceptTerms:true,acceptPrivacy:true,adult:true,version:info.version,policyDigest:info.policyDigest};
  assert.equal((await f.request('/api/legal-consent',{method:'POST',csrf:false,body:acceptance})).status,403);assert.equal((await f.request('/api/legal-consent',{method:'POST',body:{...acceptance,adult:false}})).status,400);assert.equal((await f.request('/api/legal-consent',{method:'POST',body:{...acceptance,policyDigest:'0'.repeat(64)}})).status,400);
  for(let i=0;i<2;i++)assert.equal((await f.request('/api/legal-consent',{method:'POST',body:acceptance})).status,200);assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.legal_consents')).rows[0].n,1);assert.equal((await(await f.request('/api/legal-consent',{as:'other'})).json()).accepted,false);assert.equal((await create()).status,409);
  const {createApplication}=await import('../application.js');const changed=createApplication({pool:f.pool,secret:'synthetic-secret'.repeat(4),legal:{...fixtureLegal,retention:'Aviso materialmente distinto'}});assert.equal((await changed.handle(new Request(f.origin+'/api/legal'))).status,200);const {consentRuntime}=await import('../legal.js');assert.equal(await consentRuntime(f.pool,{...fixtureLegal,retention:'Aviso materialmente distinto'}).accepted(f.owner),false);
 }finally{await f.pool.close();}
});

test('readiness HTTP comprueba base; privacidad, seguridad de transporte y consentimiento no exponen secretos',async()=>{
 const f=await testFixture({legal:fixtureLegal});try{
  assert.equal((await f.request('/health/live',{as:null})).status,200);assert.equal((await f.request('/health/ready',{as:null})).status,200);const page=await f.request('/privacidad',{as:null});const html=await page.response.text();assert.match(html,/Responsable sintético/);assert.match(html,/privacy@example.invalid/);assert.doesNotMatch(html,/Borrador pendiente/);assert.match(page.response.headers.get('strict-transport-security'),/31536000/);
  assert.equal((await f.request('/api/legal-consent',{as:null})).status,401);const result=await(await f.request('/api/legal',{as:null})).json();assert.deepEqual(Object.keys(result).sort(),['approved','policyDigest','privacyUrl','termsUrl','version']);
 }finally{await f.pool.close();}
});

test('arranque persistente verifica todas las migraciones y rechaza registro parcial o alterado sin modificarlo',async()=>{
 const f=await testFixture();try{
  const {assertDatabaseReady}=await import('../database.js'),{readdirSync}=await import('node:fs'),{createHash}=await import('node:crypto');await assert.rejects(assertDatabaseReady(f.pool),/DATABASE_MIGRATIONS_REQUIRED/);
  await f.pool.query('CREATE TABLE micontacto.schema_migrations(name text PRIMARY KEY,sha256 text NOT NULL)');for(const name of readdirSync(new URL('../db/',import.meta.url)).filter(n=>/^\d{3}_.*\.sql$/.test(n)))await f.pool.query('INSERT INTO micontacto.schema_migrations VALUES($1,$2)',[name,createHash('sha256').update(readFileSync(new URL('../db/'+name,import.meta.url))).digest('hex')]);assert.equal((await assertDatabaseReady(f.pool)).migrations,17);
  await f.pool.query("UPDATE micontacto.schema_migrations SET sha256='alterado' WHERE name='013_legal_consent.sql'");await assert.rejects(assertDatabaseReady(f.pool),/MIGRATION_CHECKSUM_MISMATCH/);assert.equal((await f.pool.query("SELECT sha256 FROM micontacto.schema_migrations WHERE name='013_legal_consent.sql'")).rows[0].sha256,'alterado');
 }finally{await f.pool.close();}
});

test('URL PostgreSQL inválida produce error redactado y no imprime el valor recibido',async()=>{
 const {databaseConfig}=await import('../database.js');try{databaseConfig({MC_DATABASE_ISOLATED:'true',MC_DATABASE_URL:'invalid credential-like input'});assert.fail('must reject');}catch(e){assert.equal(e.message,'INVALID_DATABASE_URL');assert.equal('input' in e,false);assert.doesNotMatch(String(e),/credential-like/);}
});

test('overlay selectivo en base existente crea cantones y preserva un perfil con territorio previo',async()=>{
 const f=await testFixture();try{
  const {original}=representative(),ids=new Set([...Object.values(sampleIds),...TERRITORY_CORRECTIONS.localities.map(l=>l.source)]),localities=original.localities.filter(l=>ids.has(l.source)),needed=new Set([...localities.map(l=>l.region),...TERRITORY_CORRECTIONS.localities.map(l=>l.to)]);for(const r of original.regions)if(needed.has(r.source)&&r.parent)needed.add(r.parent);
  await loadCatalog(f.pool,{catalogData:{regions:original.regions.filter(r=>needed.has(r.source)),localities}});
  const loc=(await f.pool.query("SELECT id,region_id FROM micontacto.geo_localities WHERE country_code='SV' AND source_id='3583361'")).rows[0],profile=(await f.app.profiles.create(f.owner,{country:'SV',linkName:'preservar-seleccion',displayName:'Perfil sintético conservado'})).body.id;
  await f.pool.query('UPDATE micontacto.profiles SET region_id=$2,locality_id=$3 WHERE id=$1',[profile,loc.region_id,loc.id]);const before=(await f.pool.query('SELECT to_jsonb(p) AS data FROM micontacto.profiles p WHERE id=$1',[profile])).rows[0].data;
  const {applyVerifiedTerritories}=await import('../scripts/territory-corrections-db.mjs');const result=await applyVerifiedTerritories(f.pool);assert.equal(result.createdRegions,2);assert.equal(result.correctedLocalities,4);assert.equal(result.preservedProfiles,1);assert.deepEqual((await f.pool.query('SELECT to_jsonb(p) AS data FROM micontacto.profiles p WHERE id=$1',[profile])).rows[0].data,before);
  const repeat=await applyVerifiedTerritories(f.pool);assert.equal(repeat.createdRegions,0);assert.equal(repeat.correctedLocalities,0);assert.equal(repeat.preservedProfiles,1);
 }finally{await f.pool.close();}
});
