import {r2PhotoStorage} from '../photo-storage-r2.js';
import {probePhotos} from '../service-probes.js';
if(!process.argv.includes('--isolated-test'))throw Error('EXPLICIT_ISOLATED_TEST_REQUIRED');
const e=process.env;try{
 const storage=r2PhotoStorage({accountId:e.MC_R2_ACCOUNT_ID,accessKeyId:e.MC_R2_ACCESS_KEY_ID,secretAccessKey:e.MC_R2_SECRET_ACCESS_KEY,bucket:e.MC_R2_BUCKET,isolated:e.MC_R2_ISOLATED==='true'});
 console.log(JSON.stringify({service:'R2',status:'PASS',...await probePhotos(storage)}));
}catch(error){console.log(JSON.stringify({service:'R2',status:'NOT_VERIFIED',...(error.testObjectKey?{pendingTestObject:error.testObjectKey}:{})}));process.exitCode=1;}
