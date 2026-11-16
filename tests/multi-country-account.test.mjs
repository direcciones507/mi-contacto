import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createProfile} from '../profile-service.js';
const base={displayName:'Ana Sofía',linkName:'Ana Sofía',profession:'Docente'};
test('restricción histórica sin migrar comunica la necesidad de migración 020',async()=>{
 const db={createProfile:async()=>{throw Object.assign(Error('duplicate'),{code:'23505',constraint:'profiles_account_id_key'});}};
 const result=await createProfile({...base,country:'CR'},{accountId:'account',db});
 assert.equal(result.status,409);assert.equal(result.body.code,'ACCOUNT_PROFILE_EXISTS');assert.match(result.body.message,/migración 020/);
});
test('cuenta permite múltiples anuncios en un país si el adaptador los admite',async()=>{
 let count=0;const db={createProfile:async()=>({id:'publication-'+(++count)})};
 const first=await createProfile({...base,country:'PA',linkName:'capacitacion-empresarial'},{accountId:'account',db});
 const second=await createProfile({...base,country:'PA',linkName:'capacitacion-virtual'},{accountId:'account',db});
 assert.equal(first.status,201);assert.equal(second.status,201);assert.notEqual(first.body.id,second.body.id);
});
