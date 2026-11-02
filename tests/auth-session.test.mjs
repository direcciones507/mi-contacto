import {test} from "node:test";
import {strict as assert} from "node:assert";
import {issueSession,verifySession,sessionCookie,clearSessionCookie} from "../auth-session.js";
const secret="isolated-mi-contacto-test-secret-32-characters";
const now=Date.UTC(2026,9,30);
test("sesión válida revela solo ID de cuenta",()=>{
 const token=issueSession({accountId:"account-123",secret,now});
 assert.equal(verifySession(token,{secret,now:now+1000})?.accountId,"account-123");
});
test("firma manipulada no autentica",()=>{
 const token=issueSession({accountId:"account-123",secret,now});
 assert.equal(verifySession(token+"x",{secret,now}),null);
});
test("sesión expirada no autentica",()=>{
 const token=issueSession({accountId:"account-123",secret,now,ttlSeconds:60});
 assert.equal(verifySession(token,{secret,now:now+61000}),null);
});
test("secretos débiles no se aceptan",()=>{
 assert.throws(()=>issueSession({accountId:"x",secret:"weak"}),/SESSION_SECRET_REQUIRED/);
});
test("cookie aislada, segura y HttpOnly",()=>{
 const cookie=sessionCookie("abc");
 assert.match(cookie,/mc_session=abc/);
 assert.match(cookie,/HttpOnly/);
 assert.match(cookie,/SameSite=Lax/);
 assert.match(cookie,/Secure/);
 assert.match(clearSessionCookie(),/Max-Age=0/);
});
