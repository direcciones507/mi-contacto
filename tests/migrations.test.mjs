import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {localDatabase} from '../scripts/local-database.mjs';
test('migraciones 001–009, compatibilidad y rollback no destructivo',async()=>{
 const local=await localDatabase(),{pool}=local;
 const files=readdirSync(new URL('../db/',import.meta.url)).filter(x=>/^00[1-9]_/.test(x)).sort();
 const text=name=>readFileSync(new URL('../db/'+name,import.meta.url),'utf8');
 const account=randomUUID(),profile=randomUUID();let original;
 try{
  for(const file of files){
   if(file.startsWith('007')){
    await assert.rejects(pool.query(text(file).replace(/COMMIT;\s*$/,()=>"DO $$ BEGIN RAISE EXCEPTION 'SYNTHETIC_FAILURE'; END $$; COMMIT;")),/SYNTHETIC_FAILURE/);await pool.query('ROLLBACK');
    assert.equal((await pool.query("SELECT to_regclass('micontacto.sessions') AS t")).rows[0].t,null);
   }
   if(file.startsWith('009')){await assert.rejects(pool.query(text(file).replace(/COMMIT;\s*$/,()=>"DO $$ BEGIN RAISE EXCEPTION 'SYNTHETIC_PRIVACY_FAILURE'; END $$; COMMIT;")),/SYNTHETIC_PRIVACY_FAILURE/);await pool.query('ROLLBACK');assert.equal((await pool.query("SELECT to_regclass('micontacto.removal_requests') AS t")).rows[0].t,null);}
   await pool.query(text(file));
   if(file.startsWith('001')){
    await pool.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[account,'synthetic-old-account']);
    await pool.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code) VALUES($1,$2,'Perfil anterior','perfil-anterior','PA')",[profile,account]);
    await pool.query("INSERT INTO micontacto.profile_slug_reservations(slug,profile_id) VALUES('perfil-anterior',$1)",[profile]);
    original=(await pool.query('SELECT to_jsonb(p) AS row FROM micontacto.profiles p WHERE id=$1',[profile])).rows[0].row;
   }
  }
  const upgraded=(await pool.query('SELECT to_jsonb(p) AS row FROM micontacto.profiles p WHERE id=$1',[profile])).rows[0].row;
  assert.deepEqual(Object.fromEntries(Object.keys(original).map(k=>[k,upgraded[k]])),original);
  assert.equal((await pool.query('SELECT country_code FROM micontacto.profile_slug_reservations WHERE profile_id=$1',[profile])).rows[0].country_code,'PA');
  await assert.rejects(pool.query('DELETE FROM micontacto.profiles WHERE id=$1',[profile]),/PROFILE_IDENTITY_RESERVED/);
  await pool.query(text('rollback_009.sql'));
  await pool.query(text('rollback_008.sql'));
  const sql=text('rollback_007.sql');await pool.query("INSERT INTO micontacto.sessions(token_hash,account_id,csrf,expires_at) VALUES('synthetic',$1,'synthetic',now()+interval '1 day')",[account]);
  await assert.rejects(pool.query(sql),/ROLLBACK_REQUIRES_DATA_PRESERVATION/);await pool.query('ROLLBACK');
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM micontacto.sessions")).rows[0].n,1);
  // Only the fixture created above is removed, never user/production data.
  await pool.query("DELETE FROM micontacto.sessions WHERE token_hash='synthetic'");await pool.query(sql);
  assert.equal((await pool.query("SELECT to_regclass('micontacto.sessions') AS t")).rows[0].t,null);
  const restored=(await pool.query('SELECT to_jsonb(p) AS row FROM micontacto.profiles p WHERE id=$1',[profile])).rows[0].row;assert.deepEqual(Object.fromEntries(Object.keys(original).map(k=>[k,restored[k]])),original);
  await pool.query(text(files.find(n=>n.startsWith('007'))));
  await pool.query(text(files.find(n=>n.startsWith('008'))));
  await pool.query(text(files.find(n=>n.startsWith('009'))));
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM micontacto.country_settings')).rows[0].n,8);
 }finally{await pool.close();}
});

test('008 conserva saldo de ventanas anteriores y rechaza downgrade con datos',async()=>{
 const local=await localDatabase(),{pool}=local,text=name=>readFileSync(new URL('../db/'+name,import.meta.url),'utf8');
 const account=randomUUID(),profile=randomUUID(),active=randomUUID(),prepared=randomUUID(),expired=randomUUID();
 try{
  for(const n of readdirSync(new URL('../db/',import.meta.url)).filter(n=>/^00[1-7]_.*\.sql$/.test(n)).sort())await pool.query(text(n));
  await pool.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[account,'synthetic-migration-'+account]);
  await pool.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code) VALUES($1,$2,'Migración sintética','migracion-sintetica','PA')",[profile,account]);
  await pool.query("INSERT INTO micontacto.feature_terms(id,profile_id,days,amount_cents,state,starts_at,expires_at) VALUES($1,$2,1,169,'ACTIVE',now()-interval '12 hours',now()+interval '12 hours'),($3,$2,5,799,'PREPARED',NULL,NULL),($4,$2,1,169,'ACTIVE',now()-interval '2 days',now()-interval '1 day')",[active,profile,prepared,expired]);
  const migration=text('008_feature_time.sql');
  await assert.rejects(pool.query(migration.replace(/COMMIT;\s*$/,()=>"DO $$ BEGIN RAISE EXCEPTION 'SYNTHETIC_TIMER_FAILURE'; END $$; COMMIT;")),/SYNTHETIC_TIMER_FAILURE/);await pool.query('ROLLBACK');
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='micontacto' AND table_name='feature_terms' AND column_name='remaining_ms'")).rows[0].n,0);
  await pool.query(migration);const terms=(await pool.query('SELECT * FROM micontacto.feature_terms')).rows;
  const a=terms.find(x=>x.id===active);assert.ok(Number(a.remaining_ms)<=43200000&&Number(a.remaining_ms)>43190000);assert.equal(a.state,'ACTIVE');assert.equal(Number(terms.find(x=>x.id===prepared).remaining_ms),5*86400000);assert.equal(terms.find(x=>x.id===expired).state,'EXPIRED');
  await assert.rejects(pool.query(text('rollback_008.sql')),/ROLLBACK_REQUIRES_DATA_PRESERVATION/);await pool.query('ROLLBACK');
  assert.equal((await pool.query('SELECT slug FROM micontacto.profiles WHERE id=$1',[profile])).rows[0].slug,'migracion-sintetica');assert.equal((await pool.query('SELECT count(*)::int AS n FROM micontacto.feature_terms')).rows[0].n,3);
 }finally{await pool.close();}
});

test('008 rechaza pausas antiguas, activaciones futuras y términos superpuestos sin sustituir datos',async()=>{
 const local=await localDatabase(),{pool}=local,text=name=>readFileSync(new URL('../db/'+name,import.meta.url),'utf8');
 const account=randomUUID(),profile=randomUUID(),term=randomUUID(),overlap=randomUUID();
 try{
  for(const n of readdirSync(new URL('../db/',import.meta.url)).filter(n=>/^00[1-7]_.*\.sql$/.test(n)).sort())await pool.query(text(n));
  await pool.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[account,'synthetic-guard-'+account]);
  await pool.query("INSERT INTO micontacto.profiles(id,account_id,display_name,slug,country_code,status) VALUES($1,$2,'Guarda sintética','guarda-sintetica','PA','PAUSED')",[profile,account]);
  const sql=text('008_feature_time.sql');
  await assert.rejects(pool.query(sql),/MIGRATION_REQUIRES_LEGACY_PAUSE_REVIEW/);await pool.query('ROLLBACK');
  await pool.query("UPDATE micontacto.profiles SET status='ACTIVE' WHERE id=$1",[profile]);
  await pool.query("INSERT INTO micontacto.feature_terms(id,profile_id,days,amount_cents,state,starts_at,expires_at) VALUES($1,$2,1,169,'ACTIVE',now()+interval '1 day',now()+interval '2 days')",[term,profile]);
  await assert.rejects(pool.query(sql),/MIGRATION_REQUIRES_FUTURE_ACTIVATION_REVIEW/);await pool.query('ROLLBACK');
  await pool.query("UPDATE micontacto.feature_terms SET starts_at=now()-interval '1 hour',expires_at=now()+interval '23 hours' WHERE id=$1",[term]);
  await pool.query("INSERT INTO micontacto.feature_terms(id,profile_id,days,amount_cents,state,starts_at,expires_at) VALUES($1,$2,1,169,'ACTIVE',now()-interval '1 hour',now()+interval '23 hours')",[overlap,profile]);
  await assert.rejects(pool.query(sql),e=>e.code==='23505');await pool.query('ROLLBACK');
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM micontacto.feature_terms')).rows[0].n,2);
  assert.equal((await pool.query("SELECT to_regclass('micontacto.feature_events') AS t")).rows[0].t,null);
 }finally{await pool.close();}
});
