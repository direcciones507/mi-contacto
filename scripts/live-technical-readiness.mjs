import {chromium,devices} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin='https://mi-contacto-acceptance-acceptance.up.railway.app',code=process.env.MC_ACCEPTANCE_PRIVATE_CODE;
const dir='docs/evidence/technical-completion-20261105';await mkdir(dir,{recursive:true});
if(!code)throw Error('PRIVATE_CODE_REQUIRED');
const proxy=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
const browser=await chromium.launch({headless:true,...(proxy?{proxy:{server:proxy}}:{})}),results=[];
try{for(const [device,options] of [['desktop',{viewport:{width:1440,height:1000}}],['phone',devices['Pixel 7']],['tablet',devices['iPad (gen 7)']]]){
 if(process.env.MC_LIVE_DEVICE&&process.env.MC_LIVE_DEVICE!==device)continue;
 const c=await browser.newContext({...options,ignoreHTTPSErrors:!!proxy});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(origin+'/acceso-pruebas');await p.locator('[name=code]').fill(code);const response=p.waitForResponse(r=>r.url()===origin+'/acceso-pruebas'&&r.request().method()==='POST');await p.getByRole('button',{name:'Entrar a pruebas',exact:true}).click();assert.equal((await response).status(),303);await p.waitForURL(origin+'/mi-perfil');
 const session=await c.request.get(origin+'/api/session');assert.equal(session.status(),200);const data=await session.json();assert.equal(data.user.role,'ADMIN');
 const optionsReply=await(await c.request.get(origin+'/api/auth-options')).json();
 const report=await c.request.get(origin+'/api/admin/acceptance/status');assert.equal(report.status(),200);const acceptance=await report.json();
 const cross=await c.request.post(origin+'/api/profiles',{headers:{origin:'https://external.invalid','x-mc-csrf':data.csrf},data:{}});assert.equal(cross.status(),403);
 const noCsrf=await c.request.post(origin+'/api/profiles',{headers:{origin},data:{}});assert.equal(noCsrf.status(),403);
 assert.equal(errors.length,0);results.push({device,realPrivateLogin:true,authenticatedAdmin:true,externalOriginRejected:true,missingCsrfRejected:true,googleEnabled:optionsReply.googleEnabled,emailEnabled:optionsReply.emailEnabled,migrations:acceptance.migrations,verifiedTls:acceptance.verifiedTls,dataUnchanged:true,errors});const logout=await c.request.post(origin+'/auth/logout',{headers:{origin,'x-mc-csrf':data.csrf},data:{}});assert.equal(logout.status(),204);assert.equal((await c.request.get(origin+'/api/session')).status(),401);results.at(-1).logoutVerified=true;await c.close();
}}finally{await browser.close();}
const evidence={checkedAt:new Date().toISOString(),liveRailway:true,physicalDevices:false,ownerConsentNotSubmitted:true,realProviderTests:false,proxyCertificateExceptionOnlyInTest:!!proxy,results};await writeFile(dir+(process.env.MC_LIVE_DEVICE?'/live-logout.json':'/live-authenticated.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
