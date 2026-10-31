import {test} from "node:test";
import {strict as assert} from "node:assert";
import {requestCountryPublication} from "../publication-service.js";
const input={country:"CR",linkName:"Ana Sofía",regionId:1,localityId:2};
test("avisa al publicar si nombre ya existe en Costa Rica",async()=>{
 const db={requestPublication:async()=>{throw Object.assign(Error("duplicate"),{code:"23505",constraint:"profiles_country_slug_key"});}};
 const r=await requestCountryPublication(input,{accountId:"account",db});
 assert.equal(r.status,409);
 assert.equal(r.body.field,"linkName");
 assert.equal(r.body.country,"CR");
 assert.match(r.body.message,/ya existe/);
});
test("solicita revisión con enlace del país y datos geográficos",async()=>{
 const db={requestPublication:async p=>{assert.equal(p.country,"CR");assert.equal(p.slug,"ana-sofia");assert.equal(p.regionId,1);return {id:"profile"};}};
 const r=await requestCountryPublication(input,{accountId:"account",db});
 assert.equal(r.status,202);
 assert.equal(r.body.url,"https://micontacto.online/cr/ana-sofia");
});
test("no permite publicar sin localidad",async()=>{
 const db={requestPublication:async()=>{throw Error("should not run");}};
 const r=await requestCountryPublication({...input,localityId:null},{accountId:"account",db});
 assert.equal(r.status,400);
});
test("enlace ya publicado no cambia de país",async()=>{
 const db={requestPublication:async()=>{throw Object.assign(Error("published"),{code:"ALREADY_PUBLISHED"});}};
 const r=await requestCountryPublication(input,{accountId:"account",db});
 assert.equal(r.status,409);
 assert.equal(r.body.code,"ALREADY_PUBLISHED");
});
