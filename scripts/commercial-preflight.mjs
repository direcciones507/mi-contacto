import {databasePool} from '../database.js';
import {readdir,readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
// Read-only. No connection URL, account identifier or personal data is logged.
const pool=databasePool();try{
 const ledger=(await pool.query('SELECT name,sha256 FROM micontacto.schema_migrations ORDER BY name')).rows;
 for(const row of ledger){const actual=createHash('sha256').update(await readFile(new URL('../db/'+row.name,import.meta.url))).digest('hex');if(actual!==row.sha256)throw Error('MIGRATION_CHECKSUM_MISMATCH');}
 const pending=(await readdir(new URL('../db/',import.meta.url))).filter(n=>/^\d{3}_.*\.sql$/.test(n)&&!ledger.some(r=>r.name===n)).sort();
 if(pending.some(n=>n!=='016_commercial_codes.sql'))throw Error('UNEXPECTED_MIGRATION_BASELINE');
 const counts=(await pool.query('SELECT (SELECT count(*)::int FROM micontacto.accounts) AS accounts,(SELECT count(*)::int FROM micontacto.profiles) AS profiles,(SELECT count(*)::int FROM micontacto.photos) AS photos')).rows[0];
 const prepared=(await pool.query("SELECT days,amount_cents,count(*)::int AS count FROM micontacto.feature_terms WHERE state='PREPARED' GROUP BY days,amount_cents ORDER BY days,amount_cents")).rows;
 console.log(JSON.stringify({readOnly:true,migrations:ledger.length,pending,counts,preparedPackages:prepared,backupRequiredBeforeApply:true,livePaymentsEnabled:false}));
}finally{await pool.end();}
