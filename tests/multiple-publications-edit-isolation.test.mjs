import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dashboard=readFileSync(new URL('../dashboard.js',import.meta.url),'utf8');
const views=readFileSync(new URL('../views.js',import.meta.url),'utf8');
test('si una publicación falla al abrir, nunca se sustituye por otra de la cuenta',()=>{
 const edit=dashboard.slice(dashboard.indexOf('async function edit(p=null,forceEditor=false)'),dashboard.indexOf('renderPhotos(editing)',dashboard.indexOf('async function edit(p=null,forceEditor=false)')));
 assert.match(edit,/editing=await api\('\/api\/profiles\/'\+p\.id\)/);
 assert.doesNotMatch(edit,/fresh\.items\[0\]/);
 assert.match(edit,/No se pudo abrir esta publicación/);
});
test('el navegador recibe una versión nueva del dashboard',()=>{
 assert.match(views,/dashboard\.js\?v=20261116-multipublicaciones-fase1/);
});
