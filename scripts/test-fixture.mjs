import {nativeTestDatabase} from './native/test-database.mjs';
import {randomUUID} from 'node:crypto';
import {localDatabase} from './local-database.mjs';
import {createApplication} from '../application.js';
/** Synthetic fixture only, no HTTP test-login endpoint and no persisted credentials. */
export async function testFixture({origin='https://micontacto.online',google=null,emailTransport=null,fetch,verifyToken,simulation=false,paymentProvider,storage,now,legal,acceptance=false,databaseFactory=process.env.MC_TEST_NATIVE_POSTGRES_BIN?()=>nativeTestDatabase({bin:process.env.MC_TEST_NATIVE_POSTGRES_BIN}):localDatabase}={}){
 const local=await databaseFactory();await local.migrate();const {pool}=local;
 const owner=randomUUID(),other=randomUUID(),admin=randomUUID();
 for(const[id,role]of[[owner,'USER'],[other,'USER'],[admin,'ADMIN']])await pool.query('INSERT INTO micontacto.accounts(id,google_subject,role) VALUES($1,$2,$3)',[id,'synthetic-'+id,role]);
 const geo={};for(const country of ['PA','CR']){
  const r=(await pool.query("INSERT INTO micontacto.geo_regions(country_code,source_id,name) VALUES($1,$2,'Región sintética de pruebas') RETURNING id",[country,country+'.test'])).rows[0];
  const l=(await pool.query("INSERT INTO micontacto.geo_localities(country_code,source_id,name,region_id) VALUES($1,$2,'Localidad sintética de pruebas',$3) RETURNING id",[country,country+'.test',r.id])).rows[0];geo[country]={regionId:r.id,localityId:l.id};
 }
 const category=randomUUID();await pool.query("INSERT INTO micontacto.categories(id,name) VALUES($1,'Categoría sintética')",[category]);
 const app=createApplication({pool,origin,emailTransport,secret:'synthetic-only-'+randomUUID()+randomUUID(),google,fetch,verifyToken,simulation,paymentProvider,storage,now,acceptance,legal});
 const sessions={};for(const[key,id]of Object.entries({owner,other,admin}))sessions[key]=await app.auth.issue(id);
 async function request(path,{as='owner',method='GET',body,raw=false,csrf=true,headers={}}={}){
  const session=sessions[as];const response=await app.handle(new Request(origin+path,{method,headers:{...(session?{cookie:'mc_session='+session.token}:{}),...(method!=='GET'?{origin,...(csrf&&session?{'x-mc-csrf':session.csrf}:{}),...(raw?{'content-type':'image/png'}:{'content-type':'application/json'})}:{}),...headers},...(method!=='GET'?{body:raw?body:JSON.stringify(body??{})}:{})}));
  return {response,status:response.status,async json(){return response.json();}};
 }
 return {local,pool,app,owner,other,admin,geo,category,sessions,request,origin};
}
