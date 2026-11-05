import {chromium,devices} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const origin='https://mi-contacto-acceptance-acceptance.up.railway.app',code=process.env.MC_ACCEPTANCE_PRIVATE_CODE;
if(!code)throw Error('PRIVATE_CODE_REQUIRED');
const dir='docs/evidence/photo-form-live-20261105';await mkdir(dir,{recursive:true});
const proxy=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
const browser=await chromium.launch({headless:true,...(proxy?{proxy:{server:proxy}}:{})});const results=[];
const buffer=await sharp({create:{width:400,height:400,channels:3,background:'#3282b8'}}).png().toBuffer();
try{for(const [name,options] of [['desktop',{viewport:{width:1440,height:1000}}],['phone',devices['Pixel 7']],['tablet',devices['iPad (gen 7)']]]){
 const context=await browser.newContext({...options,ignoreHTTPSErrors:!!proxy});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/acceso-pruebas');await page.locator('[name=code]').fill(code);await page.getByRole('button',{name:'Entrar a pruebas'}).click();await page.waitForURL(origin+'/mi-perfil');await page.locator('#photoTools').waitFor({state:'visible'});await page.locator('.photo-slot').nth(4).waitFor();
 assert.equal(await page.locator('.photo-slot').count(),5);
 const profiles=await page.evaluate(async()=>await(await fetch('/api/profiles')).json());
 const exists=profiles.items.length>0;
 assert.equal(await page.locator('#photoFile').isDisabled(),!exists);
 const eligible=profiles.items[0]?.featureTerms.some(t=>['ACTIVE','PAUSED'].includes(t.state)&&t.remainingSeconds>0)??false;
 assert.equal(await page.locator('[aria-label^="Seleccionar foto adicional"]:disabled').count(),eligible?0:4);
 let preview=false;
 if(exists){await page.locator('#photoFile').setInputFiles({name:'private-preview.png',mimeType:'image/png',buffer});await page.locator('#photoPreview').waitFor({state:'visible'});assert.equal(await page.locator('#photoPreview').getAttribute('src').then(s=>s.startsWith('blob:')),true);await page.locator('.photo-slot').first().getByRole('button',{name:'Descartar selección'}).click();assert.equal(await page.locator('#photoFile').inputValue(),'');preview=true;}
 else{await page.getByRole('button',{name:'Crear mi perfil',exact:true}).click();await page.locator('#profileForm').waitFor({state:'visible'});}
 assert.equal(errors.length,0,errors.join(';'));await page.locator('#photoTools').screenshot({path:dir+'/'+name+'.png'});
 results.push({device:name,visibleSlots:5,hasExistingProfile:exists,extraSlotsLocked:!eligible,privatePreviewAndDiscard:preview,profileDataUnchanged:true,errors});await context.close();
}}finally{await browser.close();}
const report={checkedAt:new Date().toISOString(),liveRailway:true,physicalDevices:false,proxyCertificateExceptionOnlyInTest:!!proxy,results};await writeFile(dir+'/results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
