import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dashboard=readFileSync(new URL('../dashboard.js',import.meta.url),'utf8');
const migration=readFileSync(new URL('../db/020_multiple_publications_per_account.sql',import.meta.url),'utf8');
test('nueva publicación abre el formulario existente',()=>{
 assert.match(dashboard,/\$\('newProfile'\)\.onclick=\(\)=>\{return edit\(\);\}/);
 assert.match(dashboard,/\$\('newProfile'\)\.hidden=false/);
 assert.match(dashboard,/async function edit\(p=null,forceEditor=false\)/);
 assert.match(dashboard,/form\.reset\(\)/);
});
test('cada publicación se edita por identificador y título',()=>{
 assert.match(dashboard,/publicationTitle\.onclick=\(\)=>edit\(p,true\)/);
 assert.match(dashboard,/api\('\/api\/profiles\/'\+p\.id\)/);
});
test('migración no destructiva conserva unicidad de enlace',()=>{
 assert.match(migration,/DROP CONSTRAINT IF EXISTS profiles_account_id_key/);
 assert.match(migration,/DROP CONSTRAINT IF EXISTS profiles_account_country_key/);
 assert.doesNotMatch(migration,/DROP TABLE|DELETE FROM|TRUNCATE|DROP CONSTRAINT IF EXISTS profiles_country_slug_key/i);
});
