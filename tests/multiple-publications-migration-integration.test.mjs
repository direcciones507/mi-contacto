import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {localDatabase} from '../scripts/local-database.mjs';

test('migración 020 conserva la publicación existente y permite dos enlaces por cuenta',async()=>{
 const {pool}=await localDatabase();
 try{
  const migrations=readdirSync(new URL('../db/',import.meta.url)).filter(n=>/^\\d{3}_.*\\.sql$/.test(n)).sort();
  const before=migrations.filter(n=>Number(n.slice(0,3))<20);
  for(const name of before)await pool.query(readFileSync(new URL('../db/'+name,import.meta.url),'utf8'));
  const account=randomUUID(),first=randomUUID(),second=randomUUID();
  await pool.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[account,'multi-test-'+account]);
  await pool.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code,url_country) VALUES($1,$2,'Primera','primera','PA','PA')",[first,account]);
  await pool.query(readFileSync(new URL('../db/020_multiple_publications_per_account.sql',import.meta.url),'utf8'));
  await pool.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code,url_country) VALUES($1,$2,'Segunda','segunda','PA','PA')",[second,account]);
  const rows=(await pool.query('SELECT id,slug FROM micontacto.profiles WHERE account_id=$1 ORDER BY slug',[account])).rows;
  assert.deepEqual(rows.map(r=>r.id),[first,second]);
  await assert.rejects(pool.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code,url_country) VALUES($1,$2,'Duplicada','primera','PA','PA')",[randomUUID(),account]),/duplicate|unique/i);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM micontacto.profiles WHERE account_id=$1',[account])).rows[0].n,2);
 }finally{await pool.close();}
});
