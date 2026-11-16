import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dashboard.js',import.meta.url),'utf8');
test('Destacado carga el anuncio pulsado, no la selección compartida anterior',()=>{
 assert.match(source,/button\('Destacar mi perfil',async\(\)=>\{/);
 assert.match(source,/const selected=await api\('\/api\/profiles\/'\+p\.id\)/);
 assert.match(source,/card\.append\(disclosure\);await renderCommercial/);
 assert.match(source,/renderCommercial\(\$\('commercial'\),\{csrf,profile:selected,paymentSandbox/);
 assert.match(source,/const refreshed=await api\('\/api\/profiles\/'\+p\.id\)/);
});
