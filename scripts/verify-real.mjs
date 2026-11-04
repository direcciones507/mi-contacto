import {verifyRealServices} from '../real-verification.js';
const report=await verifyRealServices({run:process.argv.includes('--run-isolated')});console.log(JSON.stringify(report,null,2));process.exitCode=Object.values(report).some(v=>v?.status==='FAIL')?1:report.productionReady?0:2;
