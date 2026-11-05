import {chromium,devices} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin='https://mi-contacto-acceptance-acceptance.up.railway.app';
const code=process.env.MC_ACCEPTANCE_PRIVATE_CODE;
const before=process.env.MC_ACCESS_BEFORE==='true';
if(!before&&!code)throw Error('PRIVATE_CODE_REQUIRED');
const dir='docs/evidence/access-fix-20261105';await mkdir(dir,{recursive:true});
const proxy=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
const browser=await chromium.launch({headless:true,...(proxy?{proxy:{server:proxy}}:{})});
const results=[];
try{for(const [name,options] of [['desktop',{viewport:{width:1440,height:1000}}],['phone',devices['Pixel 7']],['tablet',devices['iPad (gen 7)']]]){
 const context=await browser.newContext({...options,ignoreHTTPSErrors:!!proxy});
 const page=await context.newPage();let post;
 page.on('request',async r=>{if(r.method()==='POST'&&r.url()===origin+'/acceso-pruebas'){const h=await r.allHeaders();post={origin:h.origin,fetchSite:h['sec-fetch-site'],contentType:h['content-type']};}});
 const get=await page.goto(origin+'/acceso-pruebas');const policy=get.headers()['referrer-policy'];
 await page.locator('[name=code]').fill(before?'synthetic-invalid-private-code':code);
 const response=page.waitForResponse(r=>r.url()===origin+'/acceso-pruebas'&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Entrar a pruebas'}).click();const status=(await response).status();
 if(before){assert.equal(status,403);assert.equal(post.origin,'null');}
 else{
 assert.equal(status,303);assert.equal(post.origin,origin);assert.equal(policy,'same-origin');
 await page.waitForURL(origin+'/mi-perfil');await page.getByRole('button',{name:'Crear mi perfil',exact:true}).click();
 await page.locator('#profileForm').waitFor({state:'visible'});assert.equal(await page.locator('[name=displayName]').isVisible(),true);
 await page.screenshot({path:dir+'/'+name+'.png',fullPage:true});
 const session=await context.cookies();const c=session.find(x=>x.name==='mc_session');assert.ok(c?.secure&&c?.httpOnly);
 }
 results.push({device:name,viewport:options.viewport,policy,post,status,createProfileEditorOpened:!before});await context.close();
}}finally{await browser.close();}
const report={checkedAt:new Date().toISOString(),phase:before?'before':'after',liveRailway:true,physicalDevices:false,proxyCertificateExceptionOnlyInTest:!!proxy,results};await writeFile(dir+'/'+(before?'before':'after')+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
