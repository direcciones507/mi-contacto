import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {testFixture} from '../scripts/test-fixture.mjs';
import {directoryQuery} from '../directory-query.js';
test('pagination placeholders bind every supplied value',()=>{
 for(const filters of [{country:'PA'},{country:'PA',keyword:'Persona',regionId:1,localityId:2,categoryId:'00000000-0000-0000-0000-000000000001',limit:1,offset:1}]){
 const q=directoryQuery(filters);const refs=[...q.sql.matchAll(/\$(\d+)/g)].map(m=>Number(m[1]));assert.equal(Math.max(...refs),q.params.length);assert.match(q.sql,/LIMIT \$\d+ OFFSET \$\d+$/);
 }
});
test('self publication, directory filters and persistent unique browser views',async()=>{
 const f=await testFixture({simulation:true});
 try {
 const r=await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'prueba-publicacion',displayName:'Persona prueba',profession:'Ingeniero'}});assert.equal(r.status,201);const {id}=await r.json();
 let p=await(await f.request('/api/profiles/'+id)).json();
 assert.equal((await f.request('/api/profiles/'+id,{method:'PATCH',body:{version:p.version,displayName:'Persona prueba',profession:'Ingeniero',description:'Prueba',...f.geo.PA,categoryId:f.category,directoryConsent:true,contactConsent:true,locationConsent:true}})).status,200);
 assert.equal((await f.request('/api/profiles/'+id+'/publish',{method:'POST'})).status,400);
 const image=await sharp({create:{width:600,height:600,channels:3,background:'#336699'}}).png().toBuffer();assert.equal((await f.request('/api/profiles/'+id+'/photos',{method:'POST',raw:true,body:image})).status,201);
 assert.equal((await f.request('/api/profiles/'+id+'/publish',{method:'POST'})).status,202);
 p=await(await f.request('/api/profiles/'+id)).json();assert.equal(p.status,'ACTIVE');
 for(const extra of ['', '&keyword=Ingeniero','&regionId='+f.geo.PA.regionId+'&localityId='+f.geo.PA.localityId+'&categoryId='+f.category]){
 const response=await f.request('/api/directory?country=PA&limit=1&offset=0'+extra,{as:null});assert.equal(response.status,200);const data=await response.json();assert.equal(data.total,1);assert.equal(data.items[0].id,id);
 }
 assert.equal((await(await f.request('/api/directory?country=PA&limit=1&offset=1',{as:null})).json()).items.length,0);
 assert.equal((await(await f.request('/api/directory?country=PA&keyword=ausente',{as:null})).json()).items.length,0);
 const count=async()=>Number((await f.pool.query('SELECT count(*) AS n FROM micontacto.profile_unique_views WHERE profile_id=$1',[id])).rows[0].n);
 assert.equal((await f.request('/pa/prueba-publicacion')).status,200);assert.equal(await count(),0);
 const first=await f.request('/pa/prueba-publicacion',{as:null});assert.equal(first.status,200);assert.match(await first.response.text(),/1 vistas/);const cookie=first.response.headers.get('set-cookie').split(';')[0];
 await Promise.all(Array.from({length:5},()=>f.request('/pa/prueba-publicacion',{as:null,headers:{cookie}})));assert.equal(await count(),1);
 await f.request('/pa/prueba-publicacion',{as:'other'});assert.equal(await count(),2);
 await f.request('/pa/prueba-publicacion',{headers:{cookie:'mc_session='+f.sessions.owner.token+'; '+cookie}});assert.equal(await count(),2);
 assert.equal((await f.request('/pa/prueba-publicacion/qr.svg',{as:null})).status,200);assert.equal(await count(),2);
 }finally{await f.local.pool.close();}
});
