import {test} from "node:test";import {strict as assert} from "node:assert";
import {normalizeSlug,validateSlug,profileUrl,DUPLICATE_SLUG_MESSAGE} from "../profile-slug.js";
test("acentos y espacios",()=>assert.equal(normalizeSlug("María Sofía"),"maria-sofia"));
test("nombres equivalentes normalizan igual",()=>assert.equal(normalizeSlug("MARIA--SOFIA"),"maria-sofia"));
test("reservados no se permiten",()=>assert.equal(validateSlug("admin").code,"RESERVED_SLUG"));
test("nombre corto no se permite",()=>assert.equal(validateSlug("A").code,"INVALID_SLUG"));
test("url estable con slug válido",()=>assert.equal(profileUrl("PA","maria-sofia"),"https://micontacto.online/pa/maria-sofia"));
test("mensaje de duplicado aprobado",()=>assert.match(DUPLICATE_SLUG_MESSAGE,/ya existe/));

test("mismo nombre permitido en distintos países",()=>assert.notEqual(profileUrl("PA","ana-sofia"),profileUrl("CR","ana-sofia")));
