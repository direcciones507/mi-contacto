import {randomBytes,createHash} from "node:crypto";

const b64url=bytes=>Buffer.from(bytes).toString("base64url");
export function createGoogleLogin({clientId,redirectUri,now=Date.now()}){
 if(!clientId||!redirectUri)throw Error("OAUTH_CONFIGURATION_REQUIRED");
 const uri=new URL(redirectUri);
 if(uri.username||uri.password||(uri.protocol!=="https:"&&!(uri.protocol==='http:'&&['localhost','127.0.0.1'].includes(uri.hostname))))throw Error("INVALID_REDIRECT_URI");
 const state=b64url(randomBytes(32));
 const nonce=b64url(randomBytes(32));
 const verifier=b64url(randomBytes(32));
 const challenge=b64url(createHash("sha256").update(verifier).digest());
 const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
 for(const [k,v] of Object.entries({
  client_id:clientId,redirect_uri:uri.href,response_type:"code",
  scope:"openid",state,nonce,code_challenge:challenge,
  code_challenge_method:"S256",prompt:"select_account"
 }))url.searchParams.set(k,v);
 return {url:url.href,state,nonce,verifier,createdAt:now};
}
export function validateGoogleCallback({expectedState,receivedState,createdAt,now=Date.now()}){
 if(typeof expectedState!=="string"||expectedState.length<32||
    typeof receivedState!=="string"||receivedState!==expectedState||
    !Number.isFinite(createdAt)||now<createdAt||now-createdAt>10*60*1000)
  throw Error("INVALID_OAUTH_STATE");
 return true;
}
/** Identity verification belongs to the server's Google ID-token verifier.
 * Require aud=clientId, iss=accounts.google.com or https://accounts.google.com,
 * exp>now, nonce matching the saved nonce, and nonempty sub. Never trust email as ID.
 */
export function validateVerifiedGoogleClaims(claims,{clientId,nonce,now=Math.floor(Date.now()/1000)}){
 if(!claims||typeof claims!=="object"||!clientId||!nonce)throw Error("INVALID_GOOGLE_IDENTITY");
 if(claims.aud!==clientId||
    !["accounts.google.com","https://accounts.google.com"].includes(claims.iss)||
    !Number.isFinite(claims.exp)||claims.exp<=now||
    claims.nonce!==nonce||
    typeof claims.sub!=="string"||!claims.sub)
  throw Error("INVALID_GOOGLE_IDENTITY");
 return {googleSubject:claims.sub};
}
