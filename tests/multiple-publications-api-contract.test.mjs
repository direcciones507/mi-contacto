import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../application.js',import.meta.url),'utf8');
test('Mis publicaciones devuelve todos los IDs del propietario en orden estable',()=>{
 assert.match(app,/SELECT id FROM micontacto\.profiles WHERE account_id=\$1 ORDER BY created_at DESC,id DESC/);
 assert.match(app,/items\.map\(x=>profiles\.detail\(user\.id,x\.id\)\)/);
});
test('creación de anuncios usa el usuario autenticado y no acepta accountId externo',()=>{
 assert.match(app,/if\(path==='\/api\/profiles'&&req\.method==='POST'\)/);
 assert.match(app,/profiles\.create\(user\.id,data\)/);
 assert.match(app,/!\['country','linkName','displayName','profession','description'\]\.includes\(k\)/);
});
