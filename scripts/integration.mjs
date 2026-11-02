import {spawn} from 'node:child_process';
const env={PATH:process.env.PATH,HOME:process.env.HOME,LANG:process.env.LANG};
const child=spawn(process.execPath,['--test','tests/runtime.test.mjs','tests/migrations.test.mjs','tests/feature-time.test.mjs','tests/privacy-requests.test.mjs','tests/storage-private.test.mjs','tests/auth-hardening.test.mjs'],{cwd:new URL('../',import.meta.url),env,stdio:'inherit'});
child.once('exit',code=>process.exitCode=code??1);
