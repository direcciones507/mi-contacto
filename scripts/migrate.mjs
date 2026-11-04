import {databasePool,migrateDatabase} from '../database.js';
if(!process.argv.includes('--isolated-test'))throw Error('EXPLICIT_ISOLATED_TEST_REQUIRED');
const pool=databasePool();try{console.log(JSON.stringify({applied:await migrateDatabase(pool)}));}finally{await pool.end();}
