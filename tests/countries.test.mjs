import {test} from "node:test";import {strict as assert} from "node:assert";import {COUNTRIES,getCountry,normalizeLocationFilters,buildDirectoryQuery} from "../countries.js";
test("los ocho países de lanzamiento están configurados",()=>assert.deepEqual(COUNTRIES.map(c=>c.code),["PA","CR","NI","SV","HN","GT","MX","CO"]));
test("cada país define tres niveles y prefijo",()=>COUNTRIES.forEach(c=>{assert.equal(c.levels.length,3);assert.match(c.dial,/^\+\d+$/)}));
test("país desconocido no se acepta",()=>assert.equal(getCountry("XX"),null));
test("filtro vacío no inventa región",()=>assert.deepEqual(normalizeLocationFilters({country:"PA"}),{country:"PA",region:"",locality:""}));
test("query usa filtros codificados",()=>assert.equal(buildDirectoryQuery({country:"PA",region:"Veraguas",locality:"Santiago",keyword:"electricista"}),"country=PA&region=Veraguas&locality=Santiago&q=electricista"));
