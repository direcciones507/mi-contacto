import {test} from "node:test";
import {strict as assert} from "node:assert";
import {PLATFORM,checkPlatformConfig} from "../platform-config.js";
const config={origin:PLATFORM.origin,schema:PLATFORM.schema,cookie:PLATFORM.cookie,storagePrefix:"mi-contacto/photos",databaseUrl:"postgresql://local/mi_contacto"};
test("acepta configuración aislada",()=>assert.equal(checkPlatformConfig(config).ok,true));
test("rechaza nombre de cookie ajeno",()=>assert.deepEqual(checkPlatformConfig({...config,cookie:"session"}).errors,["INVALID_COOKIE"]));
test("rechaza almacenamiento sin prefijo propio",()=>assert.ok(checkPlatformConfig({...config,storagePrefix:"photos"}).errors.includes("INVALID_STORAGE_PREFIX")));
test("exige base de datos propia configurada",()=>assert.ok(checkPlatformConfig({...config,databaseUrl:""}).errors.includes("MISSING_DATABASE")));
