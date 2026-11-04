import {test} from "node:test";
import {strict as assert} from "node:assert";
import {profilePostgresAdapter} from "../profile-postgres.js";
const draft={accountId:"account-uuid",displayName:"Ana",slug:"ana-507",country:"PA",profession:"Docente",description:""};
test("inserta perfil y reserva slug en una transacción",async()=>{
 const calls=[],client={query:async(sql,args)=>{calls.push({sql,args});if(sql.startsWith('SELECT'))return {rows:[]};return {rows:[{id:"profile-id",slug:"ana-507"}]};},release:()=>calls.push({sql:"RELEASE"})};
 const r=await profilePostgresAdapter({connect:async()=>client}).createProfile(draft);
 assert.equal(r.slug,"ana-507");
 assert.deepEqual(calls.map(c=>c.sql.match(/^(BEGIN|SELECT|INSERT|COMMIT|RELEASE)/)?.[0]),["BEGIN","SELECT","INSERT","INSERT","COMMIT","RELEASE"]);
 assert.equal(calls[2].args[1],"account-uuid");
 assert.equal(calls[3].args[0],"PA");
 assert.equal(calls[3].args[1],"ana-507");
 assert.equal(calls[3].args[2],calls[2].args[0]);
});
test("revierte la transacción cuando falla la reserva",async()=>{
 const calls=[],client={query:async(sql)=>{calls.push(sql);if(sql.includes("profile_slug_reservations"))throw Object.assign(Error("duplicate"),{code:"23505"});return {rows:[]};},release:()=>calls.push("RELEASE")};
 await assert.rejects(profilePostgresAdapter({connect:async()=>client}).createProfile(draft),{code:"23505"});
 assert.equal(calls.at(-2),"ROLLBACK");
 assert.equal(calls.at(-1),"RELEASE");
 assert.ok(!calls.includes("COMMIT"));
});
