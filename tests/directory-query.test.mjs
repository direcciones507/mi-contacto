import {test} from "node:test";import {strict as assert} from "node:assert";import {directoryQuery} from "../directory-query.js";
test("país obligatorio y validado",()=>assert.throws(()=>directoryQuery({country:"XX"}),/INVALID_COUNTRY/));
test("no filtra por coordenadas",()=>assert.doesNotMatch(directoryQuery({country:"PA"}).sql,/latitude|longitude/));
test("solo perfiles activos",()=>assert.match(directoryQuery({country:"PA"}).sql,/p.status = 'ACTIVE'/));
test("región y localidad usan parámetros",()=>assert.deepEqual(directoryQuery({country:"PA",regionId:2,localityId:5}).params,["PA",2,5,20,0]));
test("localidad exige región",()=>assert.throws(()=>directoryQuery({country:"PA",localityId:1}),/REGION_REQUIRED/));
test("limita resultados",()=>assert.equal(directoryQuery({country:"CO",limit:900}).params.at(-2),50));
