import {chromium,devices} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serveLocal} from './http-local.mjs';
import {testFixture} from './test-fixture.mjs';
const out=new URL('../docs/evidence/integral-close-20261106/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.MC_CHROMIUM,args:['--no-sandbox','--disable-dev-shm-usage']}),results=[];
try{for(const width of [390,820,1440]){
 let f,sent=[];const server=await serveLocal(async origin=>{f=await testFixture({origin,emailTransport:async value=>sent.push(value)});return f.app;});
 const context=await browser.newContext({...(width===390?devices['Pixel 7']:width===820?devices['iPad (gen 7)']:{}),viewport:{width,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));context.setDefaultTimeout(60000);
 const pw='synthetic-browser-password-one',next='synthetic-browser-password-two';
 const access=async action=>{await page.goto(server.origin+'/acceso');await page.locator('#emailAccess').waitFor({state:'visible'});if(await page.locator('#authActionLabel').isVisible())await page.locator('[name=action]').selectOption(action);else await page.locator('[data-auth-action='+action+']').click();};
 const enter=async(action,password=pw)=>{await access(action);await page.locator('#emailAccess [name=email]').fill('synthetic@example.test');if(action!=='recover')await page.locator('#emailAccess [name=password]').fill(password);await page.locator('#emailAccess button').click();};
 try{
  await enter('register');await page.getByText(/Si la solicitud es válida/).waitFor();assert.equal(sent.length,1);
  await page.goto(sent.at(-1).url);await page.locator('#confirmEmail').waitFor({state:'visible'});assert.equal(new URL(page.url()).hash,'');await page.locator('#confirmEmail [name=password]').fill(pw);await page.locator('#confirmEmail button').click();await page.getByText(/Correo confirmado/).waitFor();
  await enter('login');await page.waitForURL(server.origin+'/mi-perfil');await page.locator('#accountPanel').waitFor({state:'visible'});await page.locator('#photoFile').waitFor({state:'visible'});assert.equal(await page.locator('.photo-slot').count(),1);
  const session=await (await context.request.get(server.origin+'/api/session')).json();assert.equal(session.user.role,'USER');
  await enter('recover');await page.getByText(/Si la solicitud es válida/).waitFor();await page.goto(sent.at(-1).url);await page.locator('#confirmEmail [name=password]').fill(next);await page.locator('#confirmEmail button').click();await page.getByText(/Correo confirmado/).waitFor();assert.equal((await context.request.get(server.origin+'/api/session')).status(),401);
  await enter('login',next);await page.waitForURL(server.origin+'/mi-perfil');await access('change');await page.locator('#emailAccess [name=currentPassword]').fill(next);await page.locator('#emailAccess [name=password]').fill(pw);await page.locator('#emailAccess button').click();await page.getByText(/Contraseña actualizada/).waitFor();assert.equal((await context.request.get(server.origin+'/api/session')).status(),401);
  await access('login');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:new URL('email-access-'+width+'.png',out).pathname,fullPage:true});assert.deepEqual(errors,[]);
  results.push({width,registration:true,verification:true,fragmentRemoved:true,login:true,recovery:true,passwordChange:true,sessionsRevoked:true,oneFreePhotoSlot:true,overflow:false,jsErrors:errors,engine:'Chromium + local HTTP + '+(f.local.engine??'PostgreSQL WASM'),realMail:false,physicalDevice:false});
 }finally{await context.close();await server.close();await f.pool.close();}
}await writeFile(new URL('email-browser-results.json',out),JSON.stringify(results,null,2));console.log(JSON.stringify(results));}finally{await browser.close();}
