import {applicationOrigin} from './origin-policy.js';
import {databaseConfig} from './database.js';
/** Reports only variable names/status. Never returns secret values or connection strings. */
export function acceptanceConfiguration(env={}){
 const groups={
  runtime:['MC_ORIGIN','MC_SESSION_SECRET'],
  postgres:['MC_DATABASE_URL','MC_DATABASE_ISOLATED'],
  google:['MC_GOOGLE_CLIENT_ID','MC_GOOGLE_CLIENT_SECRET'],
  r2:['MC_R2_ACCOUNT_ID','MC_R2_ACCESS_KEY_ID','MC_R2_SECRET_ACCESS_KEY','MC_R2_BUCKET','MC_R2_ISOLATED'],
  yappyUat:['MC_YAPPY_MERCHANT_ID','MC_YAPPY_SECRET','MC_YAPPY_ISOLATED'],
  emailTest:['MC_RESEND_API_KEY','MC_EMAIL_FROM','MC_EMAIL_TEST_RECIPIENTS','MC_EMAIL_ISOLATED']
 };
 const result=Object.fromEntries(Object.entries(groups).map(([name,vars])=>[name,{configured:vars.every(key=>!!env[key]),missing:vars.filter(key=>!env[key])}]));
 const invalid=[];
 if(env.MC_ORIGIN)try{applicationOrigin(env.MC_ORIGIN,{acceptance:env.MC_ACCEPTANCE_MODE==='true'});}catch{invalid.push('MC_ORIGIN');}
 if(env.MC_SESSION_SECRET&&Buffer.byteLength(env.MC_SESSION_SECRET)<32)invalid.push('MC_SESSION_SECRET');
 if(result.postgres.configured)try{databaseConfig(env);}catch{invalid.push('MC_DATABASE_URL/MC_DATABASE_TLS/MC_DATABASE_ISOLATED');}
 if(env.MC_GOOGLE_CLIENT_ID&&!env.MC_GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com'))invalid.push('MC_GOOGLE_CLIENT_ID');
 if(env.MC_YAPPY_ENVIRONMENT&&env.MC_YAPPY_ENVIRONMENT!=='test')invalid.push('MC_YAPPY_ENVIRONMENT');
 if(env.MC_R2_ISOLATED&&env.MC_R2_ISOLATED!=='true')invalid.push('MC_R2_ISOLATED');
 if(env.MC_EMAIL_FROM&&!/@(?:mail\.)?micontacto\.online$/.test(env.MC_EMAIL_FROM))invalid.push('MC_EMAIL_FROM');
 return {groups:result,invalid,livePaymentsSupported:false,yappyUatEnabled:env.MC_YAPPY_SANDBOX_ENABLED==='true',testEmailEnabled:env.MC_EMAIL_TEST_ENABLED==='true',readyForDedicatedServer:result.runtime.configured&&result.postgres.configured&&result.google.configured&&(env.MC_STORAGE==='r2'?result.r2.configured:env.MC_STORAGE==='local'&&!!env.MC_PHOTO_ROOT)&&invalid.length===0};
}
