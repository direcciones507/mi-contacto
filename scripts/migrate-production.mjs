import {databasePool,migrateDatabase,assertDatabaseReady} from '../database.js';
if(process.env.MC_ORIGIN!=='https://micontacto.online')throw Error('OFFICIAL_ORIGIN_REQUIRED');
if(process.env.MC_DATABASE_ISOLATED!=='true')throw Error('DEDICATED_DATABASE_REQUIRED');
const pool=databasePool();
try{
 const applied=await migrateDatabase(pool);
 await assertDatabaseReady(pool);
 console.log(JSON.stringify({migration:'ok',applied}));
}finally{await pool.end();}
