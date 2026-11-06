import {test} from 'node:test';
import assert from 'node:assert/strict';
import {acceptanceWindow} from '../acceptance-window.js';
test('continuous operation ignores obsolete shutdown dates and retains private-origin guard',()=>{
 assert.equal(acceptanceWindow({}),null);
 const env={MC_ACCEPTANCE_MODE:'true',MC_PRIVATE_OFFICIAL_ORIGIN:'true',MC_ORIGIN:'https://micontacto.online'};
 for(const stopAt of [undefined,'bad','2026-11-05T12:00:00Z'])assert.deepEqual(acceptanceWindow({...env,MC_ACCEPTANCE_STOP_AT:stopAt}),{continuousPrivate:true});
 assert.throws(()=>acceptanceWindow({...env,MC_PRIVATE_OFFICIAL_ORIGIN:'false'}),/PRIVATE_ACCEPTANCE_REQUIRED/);
 assert.throws(()=>acceptanceWindow({...env,MC_ORIGIN:'https://example.com'}),/PRIVATE_ACCEPTANCE_REQUIRED/);
});
