import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {nativeTestDatabase} from '../scripts/native/test-database.mjs';

test('PostgreSQL nativo conserva perfiles y unicidad al aplicar migración 020',async()=>{
 const db=await nativeTestDatabase({bin:process.env.MC_NATIVE_PG_BIN});
 try{
  const names=readdirSync(new URL('../db/',import.meta.url)).filter(n=>/^\d{3}_.*\.sql$/.test(n)).sort();
  for(const name of names.filter(n=>Number(n.slice(0,3))<20)){
   await db.pool.query(readFileSync(new URL('../db/'+name,import.meta.url),'utf8'));
  }
  const account=randomUUID(),first=randomUUID(),second=randomUUID();
  await db.pool.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[account,'native-'+account]);
  await db.pool.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code,url_country) VALUES($1,$2,'Primera','primera','PA','PA')",[first,account]);
  await db.pool.query(readFileSync(new URL('../db/020_multiple_publications_per_account.sql',import.meta.url),'utf8'));
  await db.pool.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code,url_country) VALUES($1,$2,'Segunda','segunda','PA','PA')",[second,account]);
  const rows=(await db.pool.query('SELECT id FROM micontacto.profiles WHERE account_id=$1 ORDER BY slug',[account])).rows;
  assert.deepEqual(rows.map(r=>r.id),[first,second]);
  await assert.rejects(db.pool.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code,url_country) VALUES($1,$2,'Duplicada','primera','PA','PA')",[randomUUID(),account]),/duplicate|unique/i);
 }finally{await db.pool.close();}
});
