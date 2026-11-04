import {test} from "node:test";
import {strict as assert} from "node:assert";
import {createProfile} from "../profile-service.js";
const base={displayName:"Ana Sofía",linkName:"Ana Sofía",profession:"Docente"};
test("conflicto de perfil por cuenta comunica que se debe editar el existente",async()=>{
 const db={createProfile:async()=>{throw Object.assign(Error('duplicate'),{code:'23505',constraint:'profiles_account_id_key'});}};
 const result=await createProfile({...base,country:'CR'},{accountId:'account',db});
 assert.equal(result.status,409);assert.equal(result.body.code,'ACCOUNT_PROFILE_EXISTS');assert.match(result.body.message,/Edita su ubicación/);
});
