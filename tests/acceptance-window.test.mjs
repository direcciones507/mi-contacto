import {test} from 'node:test';
import assert from 'node:assert/strict';
import {acceptanceWindow,AUTHORIZED_ACCEPTANCE_END} from '../acceptance-window.js';
const now=Date.parse('2026-11-05T12:00:00Z');
test('existing acceptance deadline is enforced before database bootstrap; no extension',()=>{
 assert.equal(acceptanceWindow({}, {now}),null);
 for(const value of [undefined,'bad','2026-11-07T00:00:00Z'])assert.throws(()=>acceptanceWindow({MC_ACCEPTANCE_MODE:'true',MC_ACCEPTANCE_STOP_AT:value},{now}),/NOT_AUTHORIZED/);
 assert.throws(()=>acceptanceWindow({MC_ACCEPTANCE_MODE:'true',MC_ACCEPTANCE_STOP_AT:'2026-11-05T12:00:00Z'},{now}),/WINDOW_ENDED/);
 const env={MC_ACCEPTANCE_MODE:'true',MC_ACCEPTANCE_STOP_AT:AUTHORIZED_ACCEPTANCE_END};assert.deepEqual(acceptanceWindow(env,{now}),{stopAt:AUTHORIZED_ACCEPTANCE_END,authorizedEnd:AUTHORIZED_ACCEPTANCE_END});assert.equal(env.MC_ACCEPTANCE_STOP_AT,AUTHORIZED_ACCEPTANCE_END);
 assert.equal(acceptanceWindow({MC_ACCEPTANCE_MODE:'true',MC_ACCEPTANCE_STOP_AT:'2026-11-06T18:00:00Z'},{now}).stopAt,'2026-11-06T18:00:00.000Z');
});
