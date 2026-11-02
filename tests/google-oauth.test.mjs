import {test} from "node:test";
import {strict as assert} from "node:assert";
import {createGoogleLogin,validateGoogleCallback,validateVerifiedGoogleClaims} from "../google-oauth.js";
test("Google login requiere state nonce y PKCE",()=>{
 const r=createGoogleLogin({clientId:"mi-contacto-client",redirectUri:"https://micontacto.online/auth/google/callback"});
 const u=new URL(r.url);
 assert.equal(u.searchParams.get("response_type"),"code");
 assert.equal(u.searchParams.get("code_challenge_method"),"S256");
 assert.equal(u.searchParams.get("state"),r.state);
 assert.equal(u.searchParams.get("nonce"),r.nonce);
 assert.ok(r.verifier.length>32);
});
test("rechaza callback alterado o vencido",()=>{
 const r=createGoogleLogin({clientId:"client",redirectUri:"https://micontacto.online/auth/google/callback",now:1000});
 assert.equal(validateGoogleCallback({expectedState:r.state,receivedState:r.state,createdAt:1000,now:2000}),true);
 assert.throws(()=>validateGoogleCallback({expectedState:r.state,receivedState:"otro",createdAt:1000,now:2000}),/INVALID_OAUTH_STATE/);
 assert.throws(()=>validateGoogleCallback({expectedState:r.state,receivedState:r.state,createdAt:1000,now:602000}),/INVALID_OAUTH_STATE/);
});
test("solo acepta claims previamente verificados y ligados al nonce",()=>{
 const claims={aud:"client",iss:"https://accounts.google.com",exp:2000,nonce:"nonce",sub:"google-subject"};
 assert.equal(validateVerifiedGoogleClaims(claims,{clientId:"client",nonce:"nonce",now:1000}).googleSubject,"google-subject");
 assert.throws(()=>validateVerifiedGoogleClaims(claims,{clientId:"otro",nonce:"nonce",now:1000}),/INVALID_GOOGLE_IDENTITY/);
 assert.throws(()=>validateVerifiedGoogleClaims(claims,{clientId:"client",nonce:"otro",now:1000}),/INVALID_GOOGLE_IDENTITY/);
});
