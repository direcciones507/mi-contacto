import {test} from "node:test";
import {strict as assert} from "node:assert";
import {checkSlugAvailability,slugLookupPostgres} from "../slug-availability.js";
test("mismo nombre puede estar ocupado en PA y disponible en CR",async()=>{
 const db={isSlugTaken:async({country,slug})=>country==="PA"&&slug==="ana-sofia"};
 const pa=await checkSlugAvailability({country:"PA",linkName:"Ana Sofía"},db);
 const cr=await checkSlugAvailability({country:"CR",linkName:"Ana Sofía"},db);
 assert.equal(pa.body.available,false);
 assert.equal(cr.body.available,true);
 assert.equal(cr.body.slug,"ana-sofia");
});
test("rechaza duplicado en el mismo país sin renombrarlo",async()=>{
 const db={isSlugTaken:async()=>true};
 const r=await checkSlugAvailability({country:"CR",linkName:"Ana Sofía"},db);
 assert.equal(r.body.available,false);
 assert.match(r.body.message,/ya existe/);
 assert.equal(r.body.slug,"ana-sofia");
});
test("no consulta país inválido ni nombres reservados",async()=>{
 const db={isSlugTaken:async()=>{throw Error("should not query");}};
 assert.equal((await checkSlugAvailability({country:"ZZ",linkName:"ana-sofia"},db)).status,400);
 assert.equal((await checkSlugAvailability({country:"PA",linkName:"admin"},db)).status,400);
});
test("consulta SQL usa país y nombre como parámetros",async()=>{
 let sql,params;
 const db=slugLookupPostgres({query:async(q,p)=>{sql=q;params=p;return {rows:[{taken:true}]};}});
 assert.equal(await db.isSlugTaken({country:"CR",slug:"ana-sofia"}),true);
 assert.deepEqual(params.slice(0,2),["CR","ana-sofia"]);assert.equal(params[2].length,64);
 assert.match(sql,/country_code=\$1 AND slug=\$2/);
});
