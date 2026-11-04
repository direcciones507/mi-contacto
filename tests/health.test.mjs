import {test} from 'node:test';
import assert from 'node:assert/strict';
import {testFixture} from '../scripts/test-fixture.mjs';
test('health: readiness comprueba DB, liveness sigue disponible y errores no filtran secretos',async()=>{
 const f=await testFixture();try{
  assert.equal((await f.request('/health/ready',{as:null})).status,200);
  const original=f.pool.query;
  f.pool.query=async()=>{throw Error('postgresql://private:password@unavailable/db');};
  const ready=await f.request('/health/ready',{as:null});assert.equal(ready.status,503);assert.doesNotMatch(await ready.response.text(),/private|password|unavailable/);
  assert.equal((await f.request('/health/live',{as:null})).status,200);f.pool.query=original;
 }finally{await f.pool.close();}
});
