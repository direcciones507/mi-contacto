import {randomBytes,randomUUID,createHash,createHmac,scrypt as derive,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {passwordWork} from './password-work.js';
import {transaction} from './profile-runtime.js';
const deriveAsync=promisify(derive),runPassword=passwordWork();
const scrypt=(...args)=>runPassword(()=>deriveAsync(...args)),digest=s=>createHash('sha256').update(s).digest('hex');
const equal=(a,b)=>a.length===b.length&&timingSafeEqual(a,b);
const cookie=req=>{const v=(req.headers.get('cookie')??'').split(';').map(x=>x.trim()).filter(x=>x.startsWith('mc_session='));return v.length===1?v[0].slice(11):'';};
export async function hashPassword(password){
 if(typeof password!=='string'||password.length<12||Buffer.byteLength(password)>256)throw Error('INVALID_PASSWORD');
 const salt=randomBytes(16).toString('hex');return 'scrypt$'+salt+'$'+(await scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:32*1024*1024})).toString('hex');
}
export async function verifyPassword(password,encoded){
 if(typeof password!=='string'||Buffer.byteLength(password)>256)return false;
 const parts=typeof encoded==='string'?encoded.split('$'):[];
 const valid=parts.length===3&&parts[0]==='scrypt'&&/^[a-f0-9]{32}$/.test(parts[1])&&/^[a-f0-9]{128}$/.test(parts[2]);
 const key=await scrypt(password,valid?parts[1]:'00000000000000000000000000000000',64,{N:16384,r:8,p:1,maxmem:32*1024*1024});
 return valid&&equal(key,Buffer.from(parts[2],'hex'));
}
export function emailAuth(pool,auth,{origin,secret,transport=null,now=()=>Date.now()}){
 const enabled=typeof transport==='function';
 const stamp=()=>new Date(now()).toISOString();
 const email=value=>{if(typeof value!=='string'||value.length>254||! /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(value))throw Error('INVALID_EMAIL');return value.toLowerCase();};
 const safe={message:'Si la solicitud es válida, recibirás un enlace de Mi Contacto. Revisa tu correo.'};
 const json=(s,v)=>Response.json(v,{status:s,headers:{'cache-control':'no-store'}});
 async function limit(key,max,windowMs){
  const bucket=createHmac('sha256',secret).update('email-auth:'+key).digest('hex');
  const r=await pool.query('INSERT INTO micontacto.auth_rate_limits(bucket,attempts,expires_at) VALUES($1,1,$2) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN micontacto.auth_rate_limits.expires_at<=$3 THEN 1 ELSE micontacto.auth_rate_limits.attempts+1 END,expires_at=CASE WHEN micontacto.auth_rate_limits.expires_at<=$3 THEN EXCLUDED.expires_at ELSE micontacto.auth_rate_limits.expires_at END RETURNING attempts,expires_at',[bucket,new Date(now()+windowMs).toISOString(),stamp()]);
  if(r.rows[0].attempts>max){const error=Error('RATE_LIMITED');error.retryAfter=Math.max(1,Math.ceil((Date.parse(r.rows[0].expires_at)-now())/1000));throw error;}
 }
 async function send(purpose,address,accountId=null,passwordHash=null,sessionHash=null){
  const token=randomBytes(32).toString('base64url'),tokenHash=digest(token),expires=new Date(now()+1800000).toISOString();
  await pool.query('DELETE FROM micontacto.auth_email_tokens WHERE expires_at<=$1',[stamp()]);
  await pool.query('INSERT INTO micontacto.auth_email_tokens(token_hash,purpose,email,account_id,password_hash,session_hash,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[tokenHash,purpose,address,accountId,passwordHash,sessionHash,expires]);
  // The token is carried in a fragment: HTTP access logs and referrers never receive it.
  try{await transport({to:address,kind:purpose,url:origin+'/acceso#token='+token+'&purpose='+purpose,idempotencyKey:'mc-auth-'+tokenHash,expiresMinutes:30});}catch{
   await pool.query('DELETE FROM micontacto.auth_email_tokens WHERE token_hash=$1',[tokenHash]);throw Error('EMAIL_UNAVAILABLE');
  }
 }
 async function sendSafe(...args){await send(...args);}
 async function credential(user,password){const row=(await pool.query('SELECT password_hash FROM micontacto.email_identities WHERE account_id=$1',[user.id])).rows[0];return verifyPassword(password,row?.password_hash);}
 async function handle(req){
  const path=new URL(req.url).pathname;if(!path.startsWith('/api/auth/email/'))return null;
  if(!enabled&&!['login','change'].includes(path.slice('/api/auth/email/'.length)))return json(503,{error:'EMAIL_NOT_CONFIGURED'});
  if(req.method!=='POST')return json(405,{error:'METHOD_NOT_ALLOWED'});
  try{
   if(req.headers.get('origin')!==origin||req.headers.get('sec-fetch-site')==='cross-site')return json(403,{error:'CSRF_DENIED'});
   if(!req.headers.get('content-type')?.startsWith('application/json'))throw Error('INVALID_REQUEST');
   let size=0,parts=[];for await(const p of req.body??[]){size+=p.length;if(size>4096)throw Error('INVALID_REQUEST');parts.push(Buffer.from(p));}
   let data;try{data=JSON.parse(Buffer.concat(parts));}catch{throw Error('INVALID_REQUEST');}if(!data||typeof data!=='object'||Array.isArray(data))throw Error('INVALID_REQUEST');
   // Global, persistent ceiling also bounds hashing work without trusting forwarded client IPs.
   await pool.query('DELETE FROM micontacto.auth_rate_limits WHERE expires_at<=$1',[stamp()]);
   await limit('global',120,60000);
   const action=path.slice('/api/auth/email/'.length),user=await auth.current(req);
   if(['link','change','link-google'].includes(action)){
    if(!user||user.status!=='ACTIVE')return json(403,{error:'FORBIDDEN'});auth.requireWrite(req,user);
   }
   if(['register','recover','login','link'].includes(action)){
    const address=email(data.email);await limit(action+':'+address,action==='login'?8:5,900000);if(['recover','link'].includes(action))await limit('mail:'+address,3,3600000);
    const row=(await pool.query('SELECT e.*,a.status FROM micontacto.email_identities e JOIN micontacto.accounts a ON a.id=e.account_id WHERE e.email=$1',[address])).rows[0];
    if(action==='login'){
     const session=await transaction(pool,async tx=>{
      const locked=(await tx.query('SELECT e.*,a.status FROM micontacto.email_identities e JOIN micontacto.accounts a ON a.id=e.account_id WHERE e.email=$1 FOR UPDATE OF e,a',[address])).rows[0];
      const correct=await verifyPassword(data.password,locked?.password_hash);
      if(!correct||!locked||!locked.verified_at||locked.status!=='ACTIVE')return null;
      return auth.issue(locked.account_id,tx);
     });if(!session)return json(401,{error:'INVALID_CREDENTIALS'});
     return new Response(null,{status:204,headers:{'set-cookie':session.cookie,'cache-control':'no-store'}});
    }
    if(action==='recover'){if(row?.status==='ACTIVE')await sendSafe('RESET',address,row.account_id);return json(202,safe);}
    const passwordHash=await hashPassword(data.password);
    if(action==='register'){
     // No identity or session is created until the address is verified.
     // An unavailable mail transport fails closed instead of creating an unverified account.
     if(row)return json(202,safe);
     await limit('mail:'+address,3,3600000);
     await sendSafe('VERIFY',address,null,passwordHash);
     return json(202,safe);
    }
    const existing=(await pool.query('SELECT account_id FROM micontacto.email_identities WHERE account_id=$1',[user.id])).rows[0];
    if(!row&&!existing)await sendSafe('LINK',address,user.id,passwordHash,digest(cookie(req)));return json(202,safe);
   }
   if(action==='confirm'){
    if(typeof data.token!=='string'||! /^[a-zA-Z0-9_-]{43}$/.test(data.token))throw Error('INVALID_LINK');
    // No GET mutates identity. A password is required even for verification, preventing unsolicited-link takeover.
    const tokenHash=digest(data.token),saved=(await pool.query('SELECT * FROM micontacto.auth_email_tokens WHERE token_hash=$1 AND expires_at>$2',[tokenHash,stamp()])).rows[0];
    if(!saved)throw Error('INVALID_LINK');await limit('confirm:'+tokenHash,8,1800000);
    if(saved.purpose==='LINK'){
     if(!user||user.id!==saved.account_id||digest(cookie(req))!==saved.session_hash)throw Error('INVALID_LINK');auth.requireWrite(req,user);
    }
    const newHash=saved.purpose==='RESET'?await hashPassword(data.password):null;
    if(saved.purpose!=='RESET'&&!await verifyPassword(data.password,saved.password_hash))throw Error('INVALID_LINK');
    await transaction(pool,async tx=>{
     const taken=(await tx.query('DELETE FROM micontacto.auth_email_tokens WHERE token_hash=$1 AND expires_at>$2 RETURNING *',[tokenHash,stamp()])).rows[0];if(!taken)throw Error('INVALID_LINK');
     if(saved.purpose==='LINK'&&!(await tx.query('SELECT token_hash FROM micontacto.sessions WHERE token_hash=$1 AND account_id=$2 AND expires_at>$3',[saved.session_hash,saved.account_id,stamp()])).rows.length)throw Error('INVALID_LINK');
     if(saved.purpose==='RESET'){
      const r=await tx.query("UPDATE micontacto.email_identities SET password_hash=$1,updated_at=$2 WHERE account_id=$3 AND email=$4 AND EXISTS(SELECT 1 FROM micontacto.accounts a WHERE a.id=$3 AND a.status='ACTIVE') RETURNING account_id",[newHash,stamp(),saved.account_id,saved.email]);if(!r.rows.length)throw Error('INVALID_LINK');
      await tx.query('DELETE FROM micontacto.sessions WHERE account_id=$1',[saved.account_id]);
     }else{
      const id=saved.account_id??randomUUID();
      if(!saved.account_id)await tx.query('INSERT INTO micontacto.accounts(id) VALUES($1)',[id]);
      else if(!(await tx.query("SELECT id FROM micontacto.accounts WHERE id=$1 AND status='ACTIVE' FOR UPDATE",[id])).rows.length)throw Error('INVALID_LINK');
      await tx.query('INSERT INTO micontacto.email_identities(account_id,email,password_hash,verified_at) VALUES($1,$2,$3,$4)',[id,saved.email,saved.password_hash,stamp()]);
     }
     await tx.query('DELETE FROM micontacto.auth_email_tokens WHERE email=$1',[saved.email]);
    });return json(200,{message:'Correo confirmado o contraseña actualizada. Ya puedes iniciar sesión.'});
   }
   if(action==='change'){
    await limit('change:'+user.id,8,900000);if(!await credential(user,data.currentPassword))return json(401,{error:'INVALID_CREDENTIALS'});
    const passwordHash=await hashPassword(data.password);
    await transaction(pool,async tx=>{
     // Serialize competing changes and make the checked hash part of the write condition.
     const row=(await tx.query('SELECT password_hash FROM micontacto.email_identities WHERE account_id=$1 FOR UPDATE',[user.id])).rows[0];
     if(!await verifyPassword(data.currentPassword,row?.password_hash))throw Error('INVALID_CREDENTIALS');
     await tx.query('UPDATE micontacto.email_identities SET password_hash=$1,updated_at=$2 WHERE account_id=$3',[passwordHash,stamp(),user.id]);
     await tx.query('DELETE FROM micontacto.sessions WHERE account_id=$1',[user.id]);
     await tx.query('DELETE FROM micontacto.auth_email_tokens WHERE account_id=$1',[user.id]);
    });return json(200,{message:'Contraseña actualizada. Inicia sesión nuevamente en tus dispositivos.'});
   }
   return json(404,{error:'NOT_FOUND'});
  }catch(e){if(e.message==='RATE_LIMITED')return new Response(JSON.stringify({error:'RATE_LIMITED'}),{status:429,headers:{'content-type':'application/json','cache-control':'no-store','retry-after':String(e.retryAfter??60)}});const code=e.code==='23505'?'IDENTITY_ALREADY_LINKED':e.message;return json(code==='ACCOUNT_EXISTS'?409:code==='RATE_LIMITED'?429:code==='CSRF_DENIED'?403:code==='EMAIL_UNAVAILABLE'?503:code==='INVALID_CREDENTIALS'?401:/^(INVALID_|IDENTITY_)/.test(code)?400:503,{error:/^(INVALID_|IDENTITY_|RATE_LIMITED|CSRF_DENIED|EMAIL_UNAVAILABLE|ACCOUNT_EXISTS)/.test(code)?code:'OPERATION_UNAVAILABLE'});}
 }
 return {enabled,handle,credential};
}
