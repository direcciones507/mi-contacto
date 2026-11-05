import {chromium,devices} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const origin='https://mi-contacto-acceptance-acceptance.up.railway.app',code=process.env.MC_ACCEPTANCE_PRIVATE_CODE;
if(!code||process.env.MC_PHOTO_WRITE_TEST!=='true')throw Error('EXPLICIT_PRIVATE_WRITE_TEST_REQUIRED');
const dir='docs/evidence/photo-form-live-20261105';await mkdir(dir,{recursive:true});
const proxy=process.env.HTTPS_PROXY||process.env.HTTP_PROXY,b=await chromium.launch({headless:true,...(proxy?{proxy:{server:proxy}}:{})});
let qa=null,adminContext=null;const results=[];
const image=await sharp({create:{width:300,height:300,channels:3,background:'#1078bd'}}).png().toBuffer();
async function login(options={}){const c=await b.newContext({...options,ignoreHTTPSErrors:!!proxy}),p=await c.newPage();await p.goto(origin+'/acceso-pruebas');await p.locator('[name=code]').fill(code);await p.getByRole('button',{name:'Entrar a pruebas'}).click();await p.waitForURL(origin+'/mi-perfil');await p.locator('.photo-slot').nth(4).waitFor();return {c,p};}
async function api(c,path,method='GET',body){const session=await(await c.request.get(origin+'/api/session')).json();const r=await c.request.fetch(origin+path,{method,headers:{origin,'x-mc-csrf':session.csrf},...(body?{data:body}:{})});return {status:r.status(),data:await r.json()};}
try{
 const first=await login();adminContext=first.c;
 const existing=await api(first.c,'/api/profiles');assert.equal(existing.data.items.length,0,'Owner has a profile; never replace owner data.');
 await first.p.getByRole('button',{name:'Crear mi perfil',exact:true}).click();const form=first.p.locator('#profileForm');await form.locator('[name=country]').selectOption('PA');await form.locator('[name=linkName]').fill('qa-fotos-'+Date.now());await form.locator('[name=displayName]').fill('Prueba técnica temporal de fotografías');await form.locator('[name=profession]').fill('Verificación técnica temporal');await form.getByRole('button',{name:'Guardar sin publicar'}).click();await first.p.getByText('Perfil creado como borrador.',{exact:false}).waitFor();
 const created=await api(first.c,'/api/profiles');assert.equal(created.data.items.length,1);qa=created.data.items[0].id;await first.p.close();
 for(const [device,options] of [['desktop',{viewport:{width:1440,height:1000}}],['phone',devices['Pixel 7']],['tablet',devices['iPad (gen 7)']]]){
  const {c,p}=await login(options);assert.equal(await p.locator('[aria-label^="Seleccionar foto adicional"]:disabled').count(),4);
  const file=p.locator('#photoFile');await file.setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('not an image')});await p.locator('.photo-slot').first().getByText('Usa una imagen JPG, PNG o WebP estática de hasta 5 MB.',{exact:true}).waitFor();assert.equal(await file.inputValue(),'');
  async function upload(name){await file.setInputFiles({name,mimeType:'image/png',buffer:image});await p.locator('#photoPreview').waitFor({state:'visible'});assert.ok((await p.locator('#photoPreview').getAttribute('src')).startsWith('blob:'));const response=p.waitForResponse(r=>r.request().method()==='POST'&&r.url().includes('/photos?'));await p.getByRole('button',{name:'Guardar fotografía',exact:true}).click();assert.equal((await response).status(),201);await p.getByText('Fotografía guardada.',{exact:false}).waitFor();await p.locator('#photoPreview').waitFor({state:'visible'});return (await api(c,'/api/profiles/'+qa)).data.photos.find(x=>x.role==='MAIN');}
  const old=await upload('main.png');assert.equal((await c.request.get(origin+old.url)).status(),200);await p.locator('#message').evaluate(e=>e.textContent='');const replacement=await upload('replacement.png');assert.notEqual(replacement.id,old.id);assert.equal((await c.request.get(origin+old.url)).status(),404);
  const session=await(await c.request.get(origin+'/api/session')).json();const denied=await c.request.post(origin+'/api/profiles/'+qa+'/photos?role=GALLERY',{headers:{origin,'x-mc-csrf':session.csrf,'content-type':'image/png'},data:image});assert.equal(denied.status(),409);
  await p.getByRole('button',{name:'Retirar foto',exact:true}).click();await p.getByText('Fotografía retirada.',{exact:true}).waitFor();assert.equal((await api(c,'/api/profiles/'+qa)).data.photos.length,0);assert.equal((await c.request.get(origin+replacement.url)).status(),404);
  results.push({device,upload:true,privatePreview:true,replace:true,remove:true,invalidFileRejected:true,galleryRejectedWithoutFeatured:true,oldPhotoRevoked:true});await c.close();
 }
}finally{
 if(qa&&adminContext){const profile=await api(adminContext,'/api/profiles/'+qa);assert.equal(profile.data.displayName,'Prueba técnica temporal de fotografías');const removal=await api(adminContext,'/api/profiles/'+qa+'/removal','POST',{confirm:true});assert.equal(removal.status,202);const approved=await api(adminContext,'/api/admin/removals/'+removal.data.id+'/approve','POST',{confirm:true,reason:'Eliminar exclusivamente la ficha técnica de fotografías creada por esta prueba'});assert.equal(approved.status,200);assert.equal((await api(adminContext,'/api/profiles')).data.items.length,0);}
 await b.close();
}
const report={checkedAt:new Date().toISOString(),liveRailway:true,physicalDevices:false,syntheticProfileRemoved:!!qa,realCharges:false,results};await writeFile(dir+'/upload-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
