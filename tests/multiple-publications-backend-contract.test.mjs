import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const runtime=readFileSync(new URL('../profile-runtime.js',import.meta.url),'utf8');
const adapter=readFileSync(new URL('../profile-postgres.js',import.meta.url),'utf8');
const migration=readFileSync(new URL('../db/020_multiple_publications_per_account.sql',import.meta.url),'utf8');
const schema=readFileSync(new URL('../db/001_initial.sql',import.meta.url),'utf8');
const database=readFileSync(new URL('../database.js',import.meta.url),'utf8');
test('perfil individual siempre requiere id y cuenta propietaria',()=>{
 assert.match(runtime,/WHERE id=\$1 AND account_id=\$2 FOR UPDATE/);
 assert.match(runtime,/WHERE id=\$1 AND account_id=\$2/);
 assert.match(runtime,/return createProfile\(input,\{accountId:account/);
});
test('alta conserva cuenta, ID independiente y reserva de enlace transaccional',()=>{
 assert.match(adapter,/const profileId=randomUUID\(\)/);
 assert.match(adapter,/INSERT INTO micontacto\.profiles/);
 assert.match(adapter,/INSERT INTO micontacto\.profile_slug_reservations/);
 assert.match(adapter,/await client\.query\(['\"]COMMIT['\"]\)/);
});
test('migración 020 elimina restricciones de una publicación y mantiene datos',()=>{
 assert.match(migration,/DROP CONSTRAINT IF EXISTS profiles_account_id_key/);
 assert.match(migration,/DROP CONSTRAINT IF EXISTS profiles_account_country_key/);
 assert.match(migration,/profiles_account_publications_idx/);
 assert.match(schema,/created_at timestamptz NOT NULL DEFAULT now\(\)/);
 assert.doesNotMatch(migration,/DELETE FROM|TRUNCATE|DROP TABLE/i);
});
test('el migrador descubre las migraciones SQL ordenadas por nombre',()=>{
 assert.match(database,/readdir\(new URL\('\.\/db\/',import\.meta\.url\)\)/);
 assert.match(database,/\.sort\(\)/);
});
