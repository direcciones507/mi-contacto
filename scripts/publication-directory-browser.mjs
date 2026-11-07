import {acceptTestEntry} from './browser-entry.mjs';
import {createHmac} from 'node:crypto';
import {yappySandbox} from '../yappy-sandbox.js';
import {nativeTestDatabase} from './native/test-database.mjs';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {serveLocal} from './http-local.mjs';
import {testFixture} from './test-fixture.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.MC_PLAYWRIGHT||'playwright');
const out=process.env.MC_BROWSER_EVIDENCE;if(!out?.startsWith('/'))throw Error('EXPLICIT_LOCAL_EVIDENCE_REQUIRED');mkdirSync(out,{recursive:true});
const native=process.env.MC_BROWSER_DATABASE==='native';
const browser=await chromium.launch({executablePath:process.env.MC_CHROMIUM,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote']});const results=[];
try{for(const width of [390,1440]){
 let f;const server=await serveLocal(async origin=>{const provider=yappySandbox({environment:'test',isolated:true,merchantId:'synthetic-browser',domain:'https://micontacto.online',ipnUrl:'https://micontacto.online/api/payments/yappy/ipn',secret:Buffer.from('synthetic-browser-yappy-signature.suffix').toString('base64')},async(url,options)=>{const data=JSON.parse(options.body);return Response.json({body:url.endsWith('/merchant')?{token:'synthetic-browser-token',epochTime:1}:{transactionId:'synthetic-'+data.orderId,token:'synthetic-browser-token',documentName:'synthetic-doc'}});});f=await testFixture({origin,simulation:true,emailTransport:async()=>{},paymentProvider:{...provider,domain:origin},...(native?{databaseFactory:()=>nativeTestDatabase({bin:process.env.MC_PG_BIN})}:{})});return f.app;});
 const contexts=[];
 try{
  async function pageFor(as){const context=await browser.newContext({viewport:{width,height:1100}});contexts.push(context);context.setDefaultTimeout(60000);context.setDefaultNavigationTimeout(60000);await context.route('**/*',route=>{if(route.request().url()==='https://bt-cdn-uat.yappycloud.com/v1/cdn/web-component-btn-yappy.js')return route.fulfill({contentType:'text/javascript',body:"customElements.define('btn-yappy',class extends HTMLElement{connectedCallback(){const b=document.createElement('button');b.textContent='Yappy de prueba';b.onclick=()=>this.dispatchEvent(new Event('eventClick'));this.append(b);}eventPayment(data){window.syntheticYappyData=data;}});"});return new URL(route.request().url()).origin===server.origin?route.continue():route.abort();});if(as)await context.addCookies([{name:'mc_session',value:f.sessions[as].token,url:server.origin}]);const p=await context.newPage();await acceptTestEntry(p,server.origin);return p;}
  const owner=await pageFor('owner'),errors=[];owner.on('pageerror',e=>errors.push(e.message));
  await owner.goto(server.origin+'/mi-perfil');await owner.waitForFunction(()=>document.documentElement.dataset.ownerReady==='true');if(await owner.locator('#profileOptions').isVisible())await owner.locator('summary').filter({hasText:'Estado y opciones de mi perfil'}).click();await owner.locator('#photoTools').waitFor({state:'visible'});assert.equal(await owner.locator('.photo-slot').count(),1);assert.equal(await owner.locator('#photoFile').isDisabled(),false);await owner.waitForFunction(()=>document.documentElement.dataset.ownerReady==='true');
  const form=owner.locator('#profileForm');await form.locator('[name=country]').selectOption('PA');await form.locator('[name=linkName]').fill('browser-'+width);await form.locator('[name=displayName]').fill('Persona sintética '+width);await form.locator('[name=profession]').fill('Oficio de prueba');
  await form.locator('[name=region]').selectOption(String(f.geo.PA.regionId));await form.locator('[name=localityId] option').nth(1).waitFor({state:'attached'});await form.locator('[name=localityId]').selectOption(String(f.geo.PA.localityId));await form.locator('[name=directoryConsent]').check();await form.locator('[name=contactConsent]').check();await form.locator('[name=phone]').fill('+50760000000');await form.locator('[name=whatsapp]').fill('+50760000000');
  const buffer=await sharp({create:{width:800,height:600,channels:3,background:'#155eb1'}}).png().toBuffer();await owner.locator('#photoFile').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer});await owner.locator('#photoPreview').waitFor({state:'visible'});await form.getByRole('button',{name:'Guardar y publicar'}).click();await owner.locator('#publicationPreview').waitFor({state:'visible'});await owner.frameLocator('#previewFrame').getByRole('heading',{name:'Vista previa de mi ficha',exact:true}).waitFor();await owner.getByRole('button',{name:'Confirmar solicitud de publicación',exact:true}).click();await owner.getByText('Perfil publicado correctamente.',{exact:true}).waitFor();
  const id=(await f.pool.query('SELECT id FROM micontacto.profiles WHERE account_id=$1',[f.owner])).rows[0].id;
  assert.equal((await f.pool.query('SELECT status,review_decision FROM micontacto.profiles WHERE id=$1',[id])).rows[0].status,'ACTIVE');
  const count=async()=>Number((await f.pool.query('SELECT count(*) AS n FROM micontacto.profile_unique_views WHERE profile_id=$1',[id])).rows[0].n);
  const path='/pa/browser-'+width;
  await owner.goto(server.origin+path);assert.equal(await count(),0);assert.equal(await owner.locator('.profile-view-count').innerText(),'0 vistas');
  const visitor=await pageFor(null);await visitor.locator('#region option').nth(1).waitFor({state:'attached'});await visitor.locator('#searchText').fill('Persona sintética '+width);await visitor.getByRole('button',{name:'Buscar',exact:true}).click();await visitor.getByRole('link',{name:'Ver tarjeta',exact:true}).waitFor();
  await visitor.getByRole('link',{name:'Ver tarjeta',exact:true}).click();assert.equal(await visitor.locator('.profile-view-count').innerText(),'1 vistas');await visitor.reload();assert.equal(await visitor.locator('.profile-view-count').innerText(),'1 vistas');assert.equal(await count(),1);
  assert(await visitor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await visitor.screenshot({path:out+'/publication-directory-counter-'+width+'.png',fullPage:true});
  await owner.reload();assert.equal(await owner.locator('.profile-view-count').innerText(),'1 vistas');assert.equal(await count(),1);
  results.push({width,publicationAutomatic:true,directorySearch:true,card:true,uniqueViews:true,ownerExcluded:true,overflow:false,database:'PostgreSQL WASM'});
 }catch(error){const p=contexts[0]?.pages()[0];if(p){await p.screenshot({path:out+'/failure-'+width+'.png',fullPage:true}).catch(()=>{});writeFileSync(out+'/failure-'+width+'.json',JSON.stringify({message:error.message,ui:await p.locator('body').innerText().catch(()=>''),url:p.url()},null,2));}throw error;}finally{for(const c of contexts)await c.close();await server.close();await f?.local.pool.close();}
}console.log(JSON.stringify({scenarios:results.length,results,nativePostgres:native,realGoogle:false,realPayments:0,yappyComponentSynthetic:true},null,2));}finally{await browser.close();}
