import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
/** Single backend, serialized pg-compatible pool. Never a native concurrency claim. */
export async function localDatabase(){
 const db=new PGlite();let queue=Promise.resolve();
 async function lock(){let release;const previous=queue;queue=new Promise(r=>{release=r;});await previous;return release;}
 const execute=async(text,values=[])=>values.length?db.query(text,values):(await db.exec(text)).at(-1)??{rows:[]};
 const pool={async query(text,values){const release=await lock();try{return await execute(text,values);}finally{release();}},async connect(){const release=await lock();return {query:execute,release};},async close(){await queue;await db.close();}};
 return {db,pool,async migrate(){for(const name of readdirSync(new URL('../db/',import.meta.url)).filter(n=>/^\d{3}_.*\.sql$/.test(n)).sort())await pool.query(readFileSync(new URL('../db/'+name,import.meta.url),'utf8'));}};
}
