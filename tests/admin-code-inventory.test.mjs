import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {testFixture} from '../scripts/test-fixture.mjs';
import {inventorySmoke} from '../scripts/reset-code-inventory.mjs';
import {createCodesExcel} from '../excel-export.js';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
test('ADMIN: exactly 1, 7, 40, 200; no duplicates, bounded arbitrary quantities and idempotency',async()=>{
 const f=await testFixture();try{assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.commercial_codes')).rows[0].n,0);
 for(const quantity of [1,7,40,200]){const key=randomUUID();const b=await f.app.codes.generate(f.admin,{quantity,key});assert.deepEqual(await f.app.codes.generate(f.admin,{quantity,key}),b);const items=await f.app.codes.list(f.admin,{isAdmin:true,batchId:b.batchId});assert.equal(items.length,quantity);assert.ok(items.every(c=>c.days===1&&c.state==='AVAILABLE'));}
 const counts=(await f.pool.query('SELECT count(*)::int AS n,count(DISTINCT token_hash)::int AS distinct FROM micontacto.commercial_codes')).rows[0];assert.deepEqual(counts,{n:248,distinct:248});
 for(const quantity of [0,-1,1.5,1001,Infinity])await assert.rejects(f.app.codes.generate(f.admin,{quantity,key:randomUUID()}),/INVALID_CODE_QUANTITY/);
 await assert.rejects(f.app.codes.generate(f.owner,{quantity:200,key:randomUUID()}),/FORBIDDEN/);
 const r=await f.request('/api/admin/codes',{as:'admin',method:'POST',csrf:false,body:{quantity:200,key:randomUUID()}});assert.equal(r.status,403);
 }finally{await f.pool.close();}
});
test('gift with no payment, reservation, one redemption, private redeemer account and audit',async()=>{
 const f=await testFixture();try{const profile=(await(await f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'code-gift-test',displayName:'Prueba códigos'}})).json()).id;const b=await f.app.codes.generate(f.admin,{quantity:1,key:randomUUID()});const [c]=await f.app.codes.list(f.admin,{isAdmin:true,batchId:b.batchId});await f.app.codes.change(f.admin,c.id,{action:'RESERVE',reference:'Destinatario prueba'});await f.app.codes.change(f.admin,c.id,{action:'GIFT',reference:'Destinatario prueba'});await f.app.codes.redeem(f.owner,profile,{code:c.code});assert.equal((await f.app.codes.redeem(f.owner,profile,{code:c.code})).replayed,true);
 const [admin]=await f.app.codes.list(f.admin,{isAdmin:true,batchId:b.batchId});assert.equal(admin.paymentReference,'REGALO ADMIN');assert.equal(admin.redeemedAccount,f.owner);assert.ok(admin.soldAt&&admin.usedAt);const [privateCode]=await f.app.codes.list(f.owner);assert.equal(privateCode.redeemedAccount,undefined);assert.equal(privateCode.redeemedEmail,undefined);
 assert.ok((await f.app.codes.history(f.admin)).some(e=>e.action==='GIFT'));
 }finally{await f.pool.close();}
});
test('live-probe implementation leaves zero codes, no test accounts or feature terms',async()=>{
 const f=await testFixture();try{const before=(await f.pool.query('SELECT count(*)::int AS n FROM micontacto.accounts')).rows[0].n;const result=await inventorySmoke(f.pool,'probe-secret');assert.equal(result.final,0);assert.equal(result.unique,248);assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.accounts')).rows[0].n,before);assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.feature_terms')).rows[0].n,0);}finally{await f.pool.close();}
});
test('XLSX independent openpyxl reader: 200 real rows, selected rows, Unicode and no formula execution',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mc-xlsx-'));try{for(const count of [7,200]){const rows=[['Código','Estado','Cliente'],...Array.from({length:count},(_,i)=>['MC-'+String(i).padStart(16,'0'),'Disponible',i===0?'=1+1':'José & María'])];await writeFile(join(root,count+'.xlsx'),Buffer.from(await createCodesExcel(rows).arrayBuffer()));}
 const result=execFileSync(process.env.CODEX_PRIMARY_RUNTIME_PYTHON||'python',['-c',`import openpyxl,sys,json\nfrom pathlib import Path\nfor n in [7,200]:\n w=openpyxl.load_workbook(Path(sys.argv[1])/f'{n}.xlsx');s=w.active\n assert s.max_row==n+1,(s.max_row,n)\n assert s['A2'].value=='MC-0000000000000000'\n assert s['C2'].value=='=1+1' and s['C2'].data_type=='s'\n assert s['C3'].value=='José & María'\n print(json.dumps({'rows':n,'readable':True}))`,root],{encoding:'utf8'});assert.match(result,/200/);
 }finally{await rm(root,{recursive:true,force:true});}
});
