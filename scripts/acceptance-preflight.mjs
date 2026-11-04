import {acceptanceConfiguration} from '../acceptance-config.js';
const report=acceptanceConfiguration(process.env);console.log(JSON.stringify(report,null,2));if(!report.readyForDedicatedServer)process.exitCode=1;
