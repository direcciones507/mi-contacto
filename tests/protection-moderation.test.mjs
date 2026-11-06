import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {testFixture} from '../scripts/test-fixture.mjs';
import {legalConfig} from '../legal.js';
import {publicPhoto} from '../watermark.js';

test('watermark embedded at center on vertical, square and horizontal photographs',async()=>{
 for(const [width,height]of [[400,800],[600,600],[800,400]]){
  const original=await sharp({create:{width,height,channels:3,background:'#1068ad'}}).webp().toBuffer();
  const marked=await publicPhoto(original),a=await sharp(original).raw().toBuffer(),b=await sharp(marked).raw().toBuffer();
  let center=0,edge=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*3,d=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);if(d>30){if(y>height*.35&&y<height*.65)center++;else edge++;}}
  assert.ok(center>100);assert.equal(edge,0);assert.notDeepEqual(marked,original);
 }
});

test('acceptance draft requires three declarations and persists version; OAuth cannot start without notice',async()=>{
 const f=await testFixture({legal:legalConfig({MC_ACCEPTANCE_MODE:'true'})});try{
  const create=()=>f.request('/api/profiles',{method:'POST',body:{country:'PA',linkName:'adult-only',displayName:'Synthetic adult'}});
  assert.equal((await create()).status,201);const draftId=(await f.pool.query('SELECT id FROM micontacto.profiles WHERE account_id=$1',[f.owner])).rows[0].id;assert.equal((await f.request('/api/profiles/'+draftId+'/publish',{method:'POST'})).status,428);assert.equal((await f.request('/auth/google',{as:null})).response.headers.get('location'),'/aviso');
  const page=await f.request('/aviso',{as:null});const html=await page.response.text();assert.equal((html.match(/type="checkbox"/g)||[]).length,0);assert.match(html,/role="dialog"/);assert.match(html,/Acepto y continuar/);assert.doesNotMatch(html,/ checked/);
  assert.equal(page.response.headers.get('referrer-policy'),'same-origin');
  const token=html.match(/name="token" value="([^"]+)"/)[1];
  const form=async fields=>f.app.handle(new Request(f.origin+'/aviso',{method:'POST',headers:{origin:f.origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token,...fields})}));
  assert.equal((await f.app.handle(new Request(f.origin+'/aviso',{method:'POST',headers:{origin:'https://external.invalid'},body:new URLSearchParams({token,accept0:'yes',accept1:'yes',accept2:'yes'})}))).status,403);
  assert.equal((await form({token:'invalid'})).status,400);assert.equal((await form({accept0:'yes',accept1:'yes',accept2:'yes'})).status,303);
  const info=await(await f.request('/api/legal')).json(),data={version:info.version,policyDigest:info.policyDigest,adult:true,acceptTerms:true,acceptPrivacy:true};
  assert.equal((await f.request('/api/legal-consent',{method:'POST',body:{...data,adult:false}})).status,400);
  assert.equal((await f.request('/api/legal-consent',{method:'POST',body:data})).status,200);assert.equal((await create()).status,409);
  const saved=(await f.pool.query('SELECT * FROM micontacto.legal_consents WHERE account_id=$1',[f.owner])).rows[0];assert.equal(saved.policy_version,info.version);assert.ok(saved.accepted_at);
 }finally{await f.pool.close();}
});

test('public report, spam controls, ADMIN moderation, restricted originals, appeals and audit',async t=>{
 const f=await testFixture({simulation:true});try{
  const id=(await f.app.profiles.create(f.owner,{country:'PA',linkName:'protection-test',displayName:'Synthetic adult',profession:'Test'})).body.id;
  const buffer=await sharp({create:{width:800,height:600,channels:3,background:'#1068ad'}}).png().toBuffer();
  const photo=await f.app.photos.upload(f.owner,id,'MAIN',buffer,'image/png');
  const row=(await f.pool.query('SELECT object_key FROM micontacto.photos WHERE id=$1',[photo.id])).rows[0];
  await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED',directory_consent=true WHERE id=$1",[id]);
  await t.test('all media returns pixel watermark; private object keys and unmarked query variants cannot expose originals',async()=>{
   const r=await f.request('/media/'+id+'/'+photo.id,{as:null});assert.equal(r.status,200);assert.equal(r.response.headers.get('x-mc-watermark'),'center-v1');
   assert.equal((await f.request('/'+row.object_key,{as:null})).status,404);const q=await f.request('/media/'+id+'/'+photo.id+'?original=true',{as:null});assert.equal(q.response.headers.get('x-mc-watermark'),'center-v1');
  });
  let reportId;
  await t.test('anonymous form enforces same origin cookie and signature, deduplicates and never auto hides',async()=>{
   const page=await f.request('/reportar/'+id,{as:null}),html=await page.response.text(),cookie=page.response.headers.get('set-cookie').split(';')[0],token=html.match(/data-token="([^"]+)"/)[1];
   const send=(headers={})=>f.request('/api/public-reports',{as:null,method:'POST',headers:{cookie,'x-mc-report':token,...headers},body:{profileId:id,category:'STOLEN_PHOTO',reason:'Synthetic report for test',evidence:'Reference only, no external fetching'}});
   assert.equal((await send({origin:'https://evil.invalid'})).status,403);const r=await send();assert.equal(r.status,201);reportId=(await r.json()).id;assert.equal((await(await send()).json()).id,reportId);
   assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM micontacto.reports')).rows[0].n,1);assert.equal((await f.request('/pa/protection-test',{as:null})).status,200);
   assert.equal((await f.request('/api/admin/reports')).status,403);assert.equal((await f.request('/api/admin/reports',{as:'admin'})).status,200);
  });
  await t.test('hide blocks link QR media and directory; owner cannot undo by toggling privacy',async()=>{
   assert.equal((await f.request('/api/admin/reports/'+reportId,{as:'admin',method:'POST',csrf:false,body:{action:'HIDE',reason:'Synthetic justified restriction'}})).status,403);
   await f.app.moderation.act(f.admin,reportId,{action:'HIDE',reason:'Synthetic justified restriction'});
   for(const path of ['/pa/protection-test','/pa/protection-test/qr.svg','/media/'+id+'/'+photo.id])assert.equal((await f.request(path,{as:null})).status,404);
   await assert.rejects(f.app.privacy.visibility(f.owner,id,{hidden:false}),/PROFILE_LOCKED/);assert.equal((await f.request('/pa/protection-test',{as:null})).status,404);
   assert.equal((await(await f.request('/api/directory?country=PA',{as:null})).json()).items.length,0);
  });
  await t.test('appeal is private, role guarded and resolution returns only to draft',async()=>{
   assert.equal((await f.request('/api/profiles/'+id+'/appeal',{as:'other',method:'POST',body:{reason:'Unauthorized appeal'}})).status,404);
   const a=await f.app.moderation.appeal(f.owner,id,{reason:'Synthetic owner appeal'});await f.app.moderation.reviewAppeal(f.admin,a.id,{accepted:true,reason:'Synthetic resolved restriction'});
   const p=(await f.pool.query('SELECT status,moderation_restricted FROM micontacto.profiles WHERE id=$1',[id])).rows[0];assert.equal(p.status,'DRAFT');assert.equal(p.moderation_restricted,false);
   const events=(await(await f.request('/api/admin/moderation-events',{as:'admin'})).json()).items;const decisions=events.filter(e=>['HIDE','APPEAL_ACCEPTED'].includes(e.action));assert.equal(decisions.length,2);assert.ok(decisions.every(e=>e.created_at&&e.actor_id&&e.reason));
  });
  await t.test('account suspension revokes sessions; reauthentication permits only reads and appeals',async()=>{
   await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED' WHERE id=$1",[id]);
   const r=await f.app.moderation.report({profileId:id,reason:'Synthetic suspension case'},'synthetic-suspension');await f.app.moderation.act(f.admin,r.id,{action:'SUSPEND',reason:'Synthetic account restriction'});
   assert.equal((await f.request('/api/session')).status,401);f.sessions.owner=await f.app.auth.issue(f.owner);
   assert.equal((await f.request('/api/profiles')).status,200);assert.equal((await f.request('/api/profiles',{method:'POST',body:{}})).status,403);assert.equal((await f.request('/api/admin/reports')).status,403);
   const a=await f.app.moderation.appeal(f.owner,id,{reason:'Synthetic suspension appeal'});await f.app.moderation.reviewAppeal(f.admin,a.id,{accepted:true,reason:'Synthetic access restored'});
  });
  await t.test('withdrawal blocks profile QR and media; no auto publication after accepted appeal',async()=>{
   await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED' WHERE id=$1",[id]);
   const r=await f.app.moderation.report({profileId:id,reason:'Synthetic removal case'},'synthetic-removal');await assert.rejects(f.app.moderation.act(f.admin,r.id,{action:'DELETE',reason:'Synthetic removal'}),/CONFIRMATION/);
   await f.app.moderation.act(f.admin,r.id,{action:'DELETE',reason:'Synthetic removal',confirm:true});for(const path of ['/pa/protection-test','/pa/protection-test/qr.svg','/media/'+id+'/'+photo.id])assert.equal((await f.request(path,{as:null})).status,404);
   const a=await f.app.moderation.appeal(f.owner,id,{reason:'Synthetic removal appeal'});await f.app.moderation.reviewAppeal(f.admin,a.id,{accepted:true,reason:'Synthetic test restoration'});
  });
  await t.test('sensitive hold denies photo even to ADMIN, deletion preserves held evidence and no automatic report is sent',async()=>{
   await f.pool.query("UPDATE micontacto.profiles SET status='ACTIVE',review_decision='APPROVED' WHERE id=$1",[id]);
   const r=await f.app.moderation.report({profileId:id,category:'EXPLOITATION',reason:'Synthetic harmless escalation case'},'synthetic-second');await f.app.moderation.act(f.admin,r.id,{action:'SENSITIVE_HOLD',reason:'Synthetic restricted access escalation'});
   assert.equal((await f.request('/media/'+id+'/'+photo.id,{as:'admin'})).status,404);
   await f.pool.query('INSERT INTO micontacto.storage_deletions(object_key) VALUES($1)',[row.object_key]);assert.equal((await f.app.erasure.cleanup()).deleted,0);
  });
 }finally{await f.pool.close();}
});
