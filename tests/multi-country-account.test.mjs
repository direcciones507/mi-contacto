import {test} from "node:test";
import {strict as assert} from "node:assert";
import {createProfile} from "../profile-service.js";
const base={displayName:"Ana Sofía",linkName:"Ana Sofía",profession:"Docente"};
test("misma cuenta puede registrar un perfil por país",async()=>{
 const countries=[];
 const db={createProfile:async x=>{countries.push(x.country);return {id:x.country};}};
 const pa=await createProfile({...base,country:"PA"},{accountId:"account",db});
 const cr=await createProfile({...base,country:"CR"},{accountId:"account",db});
 assert.equal(pa.status,201);
 assert.equal(cr.status,201);
 assert.equal(pa.body.url,"https://micontacto.online/pa/ana-sofia");
 assert.equal(cr.body.url,"https://micontacto.online/cr/ana-sofia");
 assert.deepEqual(countries,["PA","CR"]);
});
