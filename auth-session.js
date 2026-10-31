import {createHmac,timingSafeEqual,randomBytes} from "node:crypto";
const encode=x=>Buffer.from(JSON.stringify(x)).toString("base64url");
const decode=x=>JSON.parse(Buffer.from(x,"base64url").toString("utf8"));
const sign=(value,secret)=>createHmac("sha256",secret).update(value).digest("base64url");
function secretCheck(secret){if(typeof secret!=="string"||Buffer.byteLength(secret)<32)throw Error("SESSION_SECRET_REQUIRED");}
export function issueSession({accountId,secret,now=Date.now(),ttlSeconds=7*86400}){
 secretCheck(secret);
 if(typeof accountId!=="string"||!accountId)throw Error("INVALID_ACCOUNT");
 if(!Number.isSafeInteger(ttlSeconds)||ttlSeconds<60||ttlSeconds>7*86400)throw Error("INVALID_SESSION_TTL");
 const payload=encode({sub:accountId,iat:Math.floor(now/1000),exp:Math.floor(now/1000)+ttlSeconds,nonce:randomBytes(12).toString("base64url")});
 return payload+"."+sign(payload,secret);
}
export function verifySession(token,{secret,now=Date.now()}){
 secretCheck(secret);
 if(typeof token!=="string"||token.length>4096)return null;
 const parts=token.split(".");
 if(parts.length!==2||!parts[0]||!parts[1])return null;
 const expected=Buffer.from(sign(parts[0],secret));
 const actual=Buffer.from(parts[1]);
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;
 try{
  const p=decode(parts[0]),seconds=Math.floor(now/1000);
  if(typeof p.sub!=="string"||!p.sub||!Number.isSafeInteger(p.iat)||!Number.isSafeInteger(p.exp)||p.iat>seconds+60||p.exp<=seconds||p.exp-p.iat>7*86400)return null;
  return {accountId:p.sub,expiresAt:p.exp};
 }catch{return null;}
}
export function sessionCookie(token,{secure=true,maxAge=7*86400}={}){
 return `mc_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?"; Secure":""}`;
}
export function clearSessionCookie({secure=true}={}){
 return `mc_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure?"; Secure":""}`;
}
