import {test} from "node:test";
import {strict as assert} from "node:assert";
import {createProfile,validateProfileDraft} from "../profile-service.js";
const data={displayName:"María Sofía",linkName:"María Sofía",country:"PA",profession:"Docente"};
test("valida y normaliza el enlace",()=>assert.equal(validateProfileDraft(data).slug,"maria-sofia"));
test("rechaza países fuera del lanzamiento",()=>assert.throws(()=>validateProfileDraft({...data,country:"ZZ"}),/INVALID_COUNTRY/));
test("requiere almacenamiento configurado",async()=>await assert.rejects(createProfile(data,{accountId:"x"}),/PROFILE_STORAGE_NOT_CONFIGURED/));
test("crea perfil en borrador usando adaptador",async()=>{
 const r=await createProfile(data,{accountId:"google-subject",db:{createProfile:async x=>{assert.equal(x.status,"DRAFT");return {id:"profile-1"};}}});
 assert.deepEqual(r,{status:201,body:{id:"profile-1",slug:"maria-sofia",country:"PA",url:"https://micontacto.online/pa/maria-sofia"}});
});
test("duplicado devuelve 409 con mensaje aprobado",async()=>{
 const db={createProfile:async()=>{throw Object.assign(new Error("duplicate"),{code:"23505",constraint:"profiles_country_slug_key"});}};
 const r=await createProfile(data,{accountId:"account",db});
 assert.equal(r.status,409);assert.match(r.body.message,/ya existe/);
});
test("una cuenta no puede crear otro perfil en el mismo país",async()=>{
 const db={createProfile:async()=>{throw Object.assign(new Error("duplicate"),{code:"23505",constraint:"profiles_account_country_key"});}};
 const r=await createProfile(data,{accountId:"account",db});
 assert.equal(r.status,409);assert.equal(r.body.code,"ACCOUNT_PROFILE_EXISTS");
});
