import test from 'node:test';
import assert from 'node:assert/strict';
import {checkSlugAvailability,slugLookupPostgres} from '../slug-availability.js';
import {createProfile} from '../profile-service.js';
const base={displayName:'Servicio Ejemplo',profession:'Capacitación',country:'PA'};
test('el enlace ya reservado se rechaza incluso para otra publicación de la misma cuenta',async()=>{
 const db={isSlugTaken:async()=>true};
 const result=await checkSlugAvailability({country:'PA',linkName:'capacitacion-virtual'},db);
 assert.equal(result.available,undefined);
 assert.equal(result.body.available,false);
});
test('el mismo nombre de enlace puede existir en otro país si está disponible allí',async()=>{
 const seen=[];const db={isSlugTaken:async x=>{seen.push(x);return x.country==='PA';}};
 const pa=await checkSlugAvailability({country:'PA',linkName:'capacitacion-virtual'},db);
 const cr=await checkSlugAvailability({country:'CR',linkName:'capacitacion-virtual'},db);
 assert.equal(pa.body.available,false);assert.equal(cr.body.available,true);
 assert.deepEqual(seen.map(x=>x.country),['PA','CR']);
});
test('la consulta incluye publicaciones, reservas y enlaces borrados',async()=>{
 let sql,params;const db=slugLookupPostgres({query:async(q,p)=>{sql=q;params=p;return {rows:[{taken:true}]};}});
 assert.equal(await db.isSlugTaken({country:'PA',slug:'capacitacion-virtual'}),true);
 assert.match(sql,/micontacto\.profiles/);
 assert.match(sql,/micontacto\.profile_slug_reservations/);
 assert.match(sql,/micontacto\.deleted_urls/);
 assert.equal(params[0],'PA');assert.equal(params[1],'capacitacion-virtual');
});
test('una colisión concurrente al guardar devuelve conflicto sin sobrescribir',async()=>{
 const db={createProfile:async()=>{throw Object.assign(Error('duplicate'),{code:'23505',constraint:'profiles_country_slug_key'});}};
 const r=await createProfile({...base,linkName:'capacitacion-virtual'},{accountId:'account',db});
 assert.equal(r.status,409);assert.equal(r.body.code,'SLUG_TAKEN');
});
