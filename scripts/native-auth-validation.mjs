import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {nativeTestDatabase} from './native/test-database.mjs';
import {createApplication} from '../application.js';
import {profileRuntime} from '../profile-runtime.js';
const bin=process.env.MC_TEST_NATIVE_POSTGRES_BIN;if(!bin)throw Error('EXPLICIT_NATIVE_TEST_BIN_REQUIRED');
test('native 015: existing data, concurrent confirmation, rollback, reset races and restart/restore',async t=>{
 const db=await nativeTestDatabase({bin}),pool=db.pool,sent=[];
 try{
  await t.test('upgrade 001–014 to 015 preserves existing account profile session and identity',async()=>{
   await pool.query('CREATE SCHEMA micontacto');await pool.query('CREATE TABLE micontacto.schema_migrations(name text PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
   for(const name of (await readdir(new URL('../db/',import.meta.url))).filter(n=>/^\d{3}_.*\.sql$/.test(n)&&n<'015_').sort()){
    const sql=await readFile(new URL('../db/'+name,import.meta.url),'utf8');await pool.query(sql);await pool.query('INSERT INTO micontacto.schema_migrations(name,sha256) VALUES($1,$2)',[name,createHash('sha256').update(sql).digest('hex')]);
   }
   db.existing=randomUUID();await pool.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2)',[db.existing,'synthetic-existing-google']);
   const p=await profileRuntime(pool).create(db.existing,{country:'PA',linkName:'native-existing',displayName:'Existing synthetic profile',profession:'Test'});assert.equal(p.status,201);db.profile=p.body.id;
   const oldApp=createApplication({pool,secret:'synthetic-native-secret'.repeat(3)});db.session=await oldApp.auth.issue(db.existing);
   const before=(await pool.query('SELECT to_jsonb(p) AS row FROM micontacto.profiles p WHERE id=$1',[db.profile])).rows;
   const applied=await db.migrate();assert.deepEqual(applied,['015_email_auth.sql','016_commercial_codes.sql','017_moderation_contact.sql']);assert.deepEqual((await pool.query('SELECT to_jsonb(p) AS row FROM micontacto.profiles p WHERE id=$1',[db.profile])).rows,before);
   assert.equal((await oldApp.auth.current(new Request('https://micontacto.online/api/session',{headers:{cookie:'mc_session='+db.session.token}}))).id,db.existing);
   assert.equal((await pool.query('SELECT google_subject FROM micontacto.accounts WHERE id=$1',[db.existing])).rows[0].google_subject,'synthetic-existing-google');
  });
  const app=createApplication({pool,secret:'synthetic-native-secret'.repeat(3),emailTransport:async m=>sent.push(m)}),pw='synthetic-native-password-one',next='synthetic-native-password-two';
  const post=(action,body)=>app.handle(new Request('https://micontacto.online/api/auth/email/'+action,{method:'POST',headers:{origin:'https://micontacto.online','content-type':'application/json'},body:JSON.stringify(body)}));
  const token=()=>new URLSearchParams(new URL(sent.at(-1).url).hash.slice(1)).get('token');
  await t.test('distinct connections and concurrent one-use verification create exactly one identity',async()=>{
   const a=await pool.connect(),b=await pool.connect();try{assert.notEqual((await a.query('SELECT pg_backend_pid() AS id')).rows[0].id,(await b.query('SELECT pg_backend_pid() AS id')).rows[0].id);}finally{a.release();b.release();}
   assert.equal((await post('register',{email:'native@example.test',password:pw})).status,202);const value=token();const statuses=(await Promise.all([post('confirm',{token:value,password:pw}),post('confirm',{token:value,password:pw})])).map(r=>r.status).sort();assert.deepEqual(statuses,[200,400]);assert.equal((await pool.query("SELECT count(*)::int AS n FROM micontacto.email_identities WHERE email='native@example.test'")).rows[0].n,1);
  });
  await t.test('constraint failure rolls back cleanly without changing existing identities or profile',async()=>{
   const tx=await pool.connect();try{await tx.query('BEGIN');await tx.query("INSERT INTO micontacto.email_identities(account_id,email,password_hash,verified_at) SELECT $1,email,password_hash,verified_at FROM micontacto.email_identities WHERE email='native@example.test'",[db.existing]).then(()=>assert.fail('duplicate accepted'),e=>assert.equal(e.code,'23505'));await tx.query('ROLLBACK');}finally{tx.release();}
   assert.equal((await pool.query('SELECT count(*)::int AS n FROM micontacto.profiles WHERE id=$1',[db.profile])).rows[0].n,1);assert.equal((await pool.query('SELECT count(*)::int AS n FROM micontacto.email_identities WHERE account_id=$1',[db.existing])).rows[0].n,0);
  });
  await t.test('login racing password reset cannot leave a session authenticated with the old password',async()=>{
   assert.equal((await post('recover',{email:'native@example.test'})).status,202);const value=token();const [login,reset]=await Promise.all([post('login',{email:'native@example.test',password:pw}),post('confirm',{token:value,password:next})]);assert.equal(reset.status,200);assert.ok([204,401].includes(login.status));
   const session=login.headers.get('set-cookie')?.split(';')[0];if(session)assert.equal(await app.auth.current(new Request('https://micontacto.online/api/session',{headers:{cookie:session}})),null);
   assert.equal((await post('login',{email:'native@example.test',password:pw})).status,401);assert.equal((await post('login',{email:'native@example.test',password:next})).status,204);
  });
  await t.test('server restart and actual pg_dump/pg_restore preserve 015 data and old profile',async()=>{
   const admin=randomUUID();await pool.query("INSERT INTO micontacto.accounts(id,google_subject,role) VALUES($1,$2,'ADMIN')",[admin,'synthetic-code-admin-'+admin]);await app.codes.generate(admin,{quantity:3,key:randomUUID()});const inventoryBefore=await app.codes.list(admin,{isAdmin:true});
   const snapshot=async p=>(await p.query('SELECT a.id,a.google_subject,e.email,e.password_hash FROM micontacto.accounts a LEFT JOIN micontacto.email_identities e ON e.account_id=a.id ORDER BY a.id')).rows;
   const before=await snapshot(pool);await db.restart();assert.deepEqual(await snapshot(pool),before);const restored=await db.restoredSnapshot();assert.deepEqual(await snapshot(restored),before);const restoredApp=createApplication({pool:restored,secret:'synthetic-native-secret'.repeat(3)});assert.deepEqual(await restoredApp.codes.list(admin,{isAdmin:true}),inventoryBefore);assert.equal((await restored.query('SELECT count(*)::int AS n FROM micontacto.profiles WHERE id=$1',[db.profile])).rows[0].n,1);assert.equal((await restored.query('SELECT count(*)::int AS n FROM micontacto.schema_migrations')).rows[0].n,17);
  });
 }finally{await pool.close();}
});
