import {readCookie as cookie} from './auth-cookies.js';
import {verifyPassword} from './email-auth.js';
import {applicationOrigin} from './origin-policy.js';
import {randomUUID,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {jwtVerify,createRemoteJWKSet} from 'jose';
import {issueSession,verifySession,sessionCookie,clearSessionCookie} from './auth-session.js';
import {createGoogleLogin,validateGoogleCallback,validateVerifiedGoogleClaims} from './google-oauth.js';
const hash=s=>createHash('sha256').update(s).digest('hex');

const equal=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export function createAuth(pool,{secret,origin,google=null,fetch:network=fetch,verifyToken=null,acceptance=false,acceptanceOwner=null,now=()=>Date.now()}){
 if(typeof secret!=='string'||Buffer.byteLength(secret)<32)throw Error('SESSION_SECRET_REQUIRED');
 const base=applicationOrigin(origin,{acceptance});
 const secure=base.protocol==='https:';
 const json=(status,body)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
 async function issue(accountId,executor=pool){
  const token=issueSession({accountId,secret,now:now()}),csrf=randomBytes(32).toString('base64url');
  await executor.query('INSERT INTO micontacto.sessions(token_hash,account_id,csrf,expires_at) VALUES($1,$2,$3,$4)',[hash(token),accountId,csrf,new Date(now()+7*86400000).toISOString()]);
  return {token,csrf,cookie:sessionCookie(token,{secure})};
 }
 async function current(req){
  const token=cookie(req,'mc_session');const claims=verifySession(token,{secret,now:now()});if(!claims)return null;if(acceptanceOwner&&claims.accountId===acceptanceOwner.accountId&&now()>=acceptanceOwner.expiresAt)return null;
  const r=await pool.query("SELECT a.id,a.role,a.status,s.csrf FROM micontacto.sessions s JOIN micontacto.accounts a ON a.id=s.account_id WHERE s.token_hash=$1 AND s.account_id=$2 AND s.expires_at>$3",[hash(token),claims.accountId,new Date(now()).toISOString()]);
  return r.rows[0]??null;
 }
 function requireWrite(req,user){
  if(req.headers.get('origin')!==base.origin||req.headers.get('sec-fetch-site')==='cross-site'||!equal(req.headers.get('x-mc-csrf'),user.csrf))throw Error('CSRF_DENIED');
 }
 async function handle(req){
  const url=new URL(req.url);
  if(url.pathname==='/api/auth-options'&&req.method==='GET')return json(200,{googleEnabled:!!google?.clientId&&!!google?.clientSecret});
  if(url.pathname==='/api/session'&&req.method==='GET'){const user=await current(req);return user?json(200,{user:{id:user.id,role:user.role,status:user.status},csrf:user.csrf}):json(401,{error:'UNAUTHENTICATED'});}
  if(['/auth/logout','/auth/logout-all'].includes(url.pathname)&&req.method==='POST'){
   const user=await current(req);if(!user)return json(401,{error:'UNAUTHENTICATED'});requireWrite(req,user);
   if(url.pathname==='/auth/logout-all')await pool.query('DELETE FROM micontacto.sessions WHERE account_id=$1',[user.id]);else await pool.query('DELETE FROM micontacto.sessions WHERE token_hash=$1',[hash(cookie(req,'mc_session'))]);
   return new Response(null,{status:204,headers:{'set-cookie':clearSessionCookie({secure}),'cache-control':'no-store'}});
  }
  const linking=url.pathname==='/auth/google/link';
  if(!['/auth/google','/auth/google/callback','/auth/google/link'].includes(url.pathname))return null;
  if(req.method!==(linking?'POST':'GET'))return json(405,{error:'METHOD_NOT_ALLOWED'});
  if(!google?.clientId||!google?.clientSecret)return json(503,{error:'GOOGLE_NOT_CONFIGURED'});
  if(url.pathname==='/auth/google'||linking){
   let linkUser=null;
   if(linking){
    linkUser=await current(req);if(!linkUser||linkUser.status!=='ACTIVE')return json(403,{error:'FORBIDDEN'});requireWrite(req,linkUser);
    if(!req.headers.get('content-type')?.startsWith('application/json'))return json(400,{error:'INVALID_REQUEST'});
    let chunks=[],size=0;for await(const p of req.body??[]){size+=p.length;if(size>4096)return json(413,{error:'PAYLOAD_TOO_LARGE'});chunks.push(Buffer.from(p));}
    let data;try{data=JSON.parse(Buffer.concat(chunks));}catch{return json(400,{error:'INVALID_REQUEST'});}
    const bucket=hash('google-link:'+linkUser.id),expires=new Date(now()+900000).toISOString();
    const rate=await pool.query('INSERT INTO micontacto.auth_rate_limits(bucket,attempts,expires_at) VALUES($1,1,$2) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN micontacto.auth_rate_limits.expires_at<=$3 THEN 1 ELSE micontacto.auth_rate_limits.attempts+1 END,expires_at=CASE WHEN micontacto.auth_rate_limits.expires_at<=$3 THEN EXCLUDED.expires_at ELSE micontacto.auth_rate_limits.expires_at END RETURNING attempts',[bucket,expires,new Date(now()).toISOString()]);if(rate.rows[0].attempts>8)return json(429,{error:'RATE_LIMITED'});
    const identity=(await pool.query('SELECT e.password_hash,a.google_subject FROM micontacto.email_identities e JOIN micontacto.accounts a ON a.id=e.account_id WHERE e.account_id=$1',[linkUser.id])).rows[0];
    if(!await verifyPassword(data?.password,identity?.password_hash))return json(401,{error:'INVALID_CREDENTIALS'});
    if(identity.google_subject)return json(409,{error:'IDENTITY_ALREADY_LINKED'});
   }
   const login=createGoogleLogin({clientId:google.clientId,redirectUri:base.origin+'/auth/google/callback',now:now()});
   await pool.query('DELETE FROM micontacto.oauth_transactions WHERE expires_at<=$1',[new Date(now()).toISOString()]);
   await pool.query('INSERT INTO micontacto.oauth_transactions(state_hash,nonce,verifier,expires_at) VALUES($1,$2,$3,$4)',[hash(login.state),login.nonce,login.verifier,new Date(now()+600000).toISOString()]);
   if(linkUser)await pool.query('UPDATE micontacto.oauth_transactions SET link_account_id=$1,link_session_hash=$2 WHERE state_hash=$3',[linkUser.id,hash(cookie(req,'mc_session')),hash(login.state)]);
   if(linking)return new Response(JSON.stringify({url:login.url}),{headers:{'content-type':'application/json','cache-control':'no-store','set-cookie':`mc_oauth=${login.state}; HttpOnly; SameSite=Lax; Path=/auth/google/callback; Max-Age=600${secure?'; Secure':''}`}});
   return new Response(null,{status:302,headers:{location:login.url,'set-cookie':`mc_oauth=${login.state}; HttpOnly; SameSite=Lax; Path=/auth/google/callback; Max-Age=600${secure?'; Secure':''}`,'cache-control':'no-store'}});
  }
  try{
  if(['state','code','error'].some(k=>url.searchParams.getAll(k).length>1))throw Error('INVALID_OAUTH_RESPONSE');
  const state=url.searchParams.get('state');
  if(!equal(state,cookie(req,'mc_oauth'))||!state||state.length>128)throw Error('INVALID_OAUTH_STATE');
  const saved=await pool.query('DELETE FROM micontacto.oauth_transactions WHERE state_hash=$1 AND expires_at>$2 RETURNING *',[hash(state),new Date(now()).toISOString()]);
  if(!saved.rows[0])throw Error('INVALID_OAUTH_STATE');
  validateGoogleCallback({expectedState:state,receivedState:state,createdAt:Date.parse(saved.rows[0].expires_at)-600000,now:now()});
  if(url.searchParams.has('error'))throw Error(url.searchParams.get('error')==='access_denied'?'OAUTH_CANCELLED':'INVALID_OAUTH_RESPONSE');
  const code=url.searchParams.get('code');if(!code||code.length>4096)throw Error('INVALID_OAUTH_CODE');
  let response;try{response=await network('https://oauth2.googleapis.com/token',{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code,client_id:google.clientId,client_secret:google.clientSecret,redirect_uri:base.origin+'/auth/google/callback',code_verifier:saved.rows[0].verifier})});}catch{throw Error('GOOGLE_EXCHANGE_FAILED');}
  if(!response.ok)throw Error('GOOGLE_EXCHANGE_FAILED');
  let parsed;try{parsed=await response.json();}catch{throw Error('INVALID_GOOGLE_IDENTITY');}const token=parsed?.id_token;if(typeof token!=='string'||token.length>16384)throw Error('INVALID_GOOGLE_IDENTITY');
  let claims;try{claims=verifyToken?await verifyToken(token): (await jwtVerify(token,keys,{algorithms:['RS256'],audience:google.clientId,issuer:['accounts.google.com','https://accounts.google.com'],currentDate:new Date(now())})).payload;}catch{throw Error('INVALID_GOOGLE_IDENTITY');}
  const identity=validateVerifiedGoogleClaims(claims,{clientId:google.clientId,nonce:saved.rows[0].nonce,now:Math.floor(now()/1000)});
  let r;
  if(saved.rows[0].link_account_id){
   const user=await current(req);if(!user||user.status!=='ACTIVE'||user.id!==saved.rows[0].link_account_id||!equal(hash(cookie(req,'mc_session')??''),saved.rows[0].link_session_hash))throw Error('INVALID_OAUTH_STATE');
   try{r=await pool.query("UPDATE micontacto.accounts SET google_subject=$1 WHERE id=$2 AND google_subject IS NULL AND status='ACTIVE' RETURNING id,status",[identity.googleSubject,user.id]);}catch(e){if(e.code==='23505')throw Error('IDENTITY_ALREADY_LINKED');throw e;}if(!r.rows.length)throw Error('IDENTITY_ALREADY_LINKED');
  }else r=await pool.query('INSERT INTO micontacto.accounts(id,google_subject) VALUES($1,$2) ON CONFLICT(google_subject) DO UPDATE SET google_subject=EXCLUDED.google_subject RETURNING id,status',[randomUUID(),identity.googleSubject]);
  // Suspended accounts receive a limited session for private appeals only.
  const session=await issue(r.rows[0].id);const headers=new Headers({location:'/mi-perfil','cache-control':'no-store'});headers.append('set-cookie',session.cookie);headers.append('set-cookie',`mc_oauth=; Path=/auth/google/callback; HttpOnly; SameSite=Lax; Max-Age=0${secure?'; Secure':''}`);
  return new Response(null,{status:302,headers});
  }catch(e){const code=['IDENTITY_ALREADY_LINKED','INVALID_OAUTH_STATE','INVALID_OAUTH_CODE','INVALID_OAUTH_RESPONSE','INVALID_GOOGLE_IDENTITY','OAUTH_CANCELLED','ACCOUNT_SUSPENDED'].includes(e.message)?e.message:'GOOGLE_UNAVAILABLE';const status=code==='ACCOUNT_SUSPENDED'?403:code==='GOOGLE_UNAVAILABLE'?503:400;const result=json(status,{error:code});result.headers.set('set-cookie',`mc_oauth=; Path=/auth/google/callback; HttpOnly; SameSite=Lax; Max-Age=0${secure?'; Secure':''}`);return result;}
 }
 return {current,requireWrite,handle,issue};
}
