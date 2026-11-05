import {territoryDisplayName} from './territory-corrections.js';
import {validateMapsUrl} from './maps.js';
import {randomUUID} from 'node:crypto';
import {profilePostgresAdapter} from './profile-postgres.js';
import {createProfile,validateProfileDraft} from './profile-service.js';
import {profileUrl} from './profile-slug.js';
import {activeFeature,visiblePhotos} from './feature-policy.js';
import {featureRuntime} from './feature-runtime.js';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export async function transaction(pool,run){const client=await pool.connect();try{await client.query('BEGIN');const r=await run(client);await client.query('COMMIT');return r;}catch(e){try{await client.query('ROLLBACK');}catch{}throw e;}finally{client.release();}}
export function profileRuntime(pool,{origin='https://micontacto.online',now=()=>Date.now(),features=featureRuntime(pool)}={}){
 const audit=async(tx,actor,id,action,reason='')=>tx.query('INSERT INTO micontacto.audit(id,actor_id,profile_id,action,reason) VALUES($1,$2,$3,$4,$5)',[randomUUID(),actor,id,action,reason]);
 async function owned(tx,account,id){if(!uuid.test(id))throw Error('NOT_FOUND');const r=await tx.query('SELECT * FROM micontacto.profiles WHERE id=$1 AND account_id=$2 FOR UPDATE',[id,account]);if(!r.rows[0])throw Error('NOT_FOUND');return r.rows[0];}
 function writable(p){if(['BLOCKED','DELETED'].includes(p.status))throw Error('PROFILE_LOCKED');}
 async function detail(account,id){const r=await pool.query('SELECT * FROM micontacto.profiles WHERE id=$1 AND account_id=$2',[id,account]);if(!r.rows[0])throw Error('NOT_FOUND');return decorate(r.rows[0],true);}
 async function decorate(p,owner=false){
  const {terms,events}=await features.snapshot(p.id);
  const featured=!p.privacy_hidden&&p.status==='ACTIVE'&&p.review_decision==='APPROVED'&&p.directory_consent&&terms.some(t=>t.state==='ACTIVE'&&Number(t.remaining_ms)>0);const photos=(await pool.query("SELECT id,role,state FROM micontacto.photos WHERE profile_id=$1 AND state='ACTIVE' ORDER BY CASE role WHEN 'MAIN' THEN 0 ELSE 1 END,created_at,id",[p.id])).rows;
  const visible=owner?photos:visiblePhotos(photos,featured);
  const removal=owner?(await pool.query('SELECT id,state,requested_at,reviewed_at FROM micontacto.removal_requests WHERE profile_id=$1',[p.id])).rows[0]??null:null;
  const location=(await pool.query('SELECT r.name AS region,l.name AS locality FROM micontacto.geo_localities l JOIN micontacto.geo_regions r ON r.id=l.region_id WHERE l.id=$1 AND l.region_id=$2 AND l.country_code=$3',[p.locality_id,p.region_id,p.country_code])).rows[0]??{};
  return {id:p.id,displayName:p.display_name,country:p.country_code,slug:p.slug,urlCountry:p.url_country,profession:p.profession??'',description:p.description??'',categoryId:p.category_id,regionId:owner||p.location_consent?p.region_id:null,localityId:owner||p.location_consent?p.locality_id:null,region:owner||p.location_consent?territoryDisplayName(location.region)||null:null,locality:owner||p.location_consent?location.locality:null,featured,photoVerified:!!p.photo_verified_id&&photos.some(x=>x.id===p.photo_verified_id&&x.role==='MAIN'),moderationRestricted:p.moderation_restricted,sensitiveHold:p.sensitive_hold,photos:visible.map(x=>({id:x.id,role:x.role,url:'/media/'+p.id+'/'+x.id})),url:profileUrl(p.url_country??p.country_code,p.slug,origin),...(p.contact_consent?{phone:p.phone,whatsapp:p.whatsapp}:{}),...(p.location_consent?{latitude:p.latitude,longitude:p.longitude,mapsUrl:p.maps_url}:{}),...(owner?{ownerId:p.account_id,privacyHidden:p.privacy_hidden,removalRequest:removal,status:p.status,version:p.version,featureEvents:events,featureTerms:terms.map(t=>({id:t.id,days:t.days,amountCents:t.amount_cents,state:t.state,startsAt:t.starts_at,expiresAt:t.expires_at,usedSeconds:(t.days*86400000-Number(t.remaining_ms))/1000,remainingSeconds:Number(t.remaining_ms)/1000})),phone:p.phone??'',whatsapp:p.whatsapp??'',latitude:p.latitude,longitude:p.longitude,mapsUrl:p.maps_url,directoryConsent:p.directory_consent,contactConsent:p.contact_consent,locationConsent:p.location_consent,reviewReason:p.review_reason}: {})};
 }
 async function geo(tx,country,region,locality){
  const r=await tx.query('WITH RECURSIVE trail AS (SELECT id,parent_id,enabled FROM micontacto.geo_regions WHERE id=$2 AND country_code=$3 UNION ALL SELECT r.id,r.parent_id,r.enabled FROM micontacto.geo_regions r JOIN trail t ON t.parent_id=r.id WHERE r.country_code=$3) SELECT l.id FROM micontacto.geo_localities l WHERE l.id=$1 AND l.region_id=$2 AND l.country_code=$3 AND l.enabled AND EXISTS(SELECT 1 FROM trail) AND NOT EXISTS(SELECT 1 FROM trail WHERE NOT enabled)',[locality,region,country]);
  if(!r.rows.length)throw Error('INVALID_GEO_SELECTION');
 }
 async function update(account,id,input){
  const allowed=['country','mapsUrl','displayName','profession','description','phone','whatsapp','categoryId','regionId','localityId','latitude','longitude','directoryConsent','contactConsent','locationConsent','version'];
  if(!input||Object.keys(input).some(k=>!allowed.includes(k)))throw Error('INVALID_PROFILE_FIELDS');
  return transaction(pool,async tx=>{
   const p=await owned(tx,account,id);writable(p);if(input.version!==p.version)throw Error('EDIT_CONFLICT');
   const draft=validateProfileDraft({...input,country:input.country??p.country_code,linkName:p.slug});
   if(!draft.profession||String(input.profession).length>120||String(input.description??'').length>1000)throw Error('INVALID_PROFILE');
   const phone=value=>{const v=String(value??'').replace(/[ ().-]/g,'');if(v&&!/^\+[1-9][0-9]{6,14}$/.test(v))throw Error('INVALID_PHONE');return v||null;};
   const region=input.regionId==null||input.regionId===''?null:Number(input.regionId),locality=input.localityId==null||input.localityId===''?null:Number(input.localityId);
   if(region||locality){if(!Number.isSafeInteger(region)||!Number.isSafeInteger(locality))throw Error('INVALID_GEO_SELECTION');await geo(tx,draft.country,region,locality);}
   const latitude=input.latitude==null||input.latitude===''?null:Number(input.latitude),longitude=input.longitude==null||input.longitude===''?null:Number(input.longitude);
   if((latitude===null)!==(longitude===null)||latitude!==null&&(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180||input.locationConsent!==true))throw Error('INVALID_COORDINATES');
   for(const k of ['directoryConsent','contactConsent','locationConsent'])if(typeof input[k]!=='boolean')throw Error('CONSENT_REQUIRED');
   const mapsUrl=validateMapsUrl(input.mapsUrl);if(mapsUrl&&input.locationConsent!==true)throw Error('CONSENT_REQUIRED');
   if(!(await tx.query('SELECT code FROM micontacto.country_settings WHERE code=$1 AND enabled',[draft.country])).rows.length)throw Error('INVALID_COUNTRY');
   if(draft.country!==p.country_code&&(!region||!locality))throw Error('INVALID_GEO_SELECTION');
   const category=input.categoryId||null;
   if(category){if(!uuid.test(category)||(await tx.query('SELECT id FROM micontacto.categories WHERE id=$1 AND enabled',[category])).rows.length!==1)throw Error('INVALID_CATEGORY');}
   await features.suspend(tx,id,account,'Edición pendiente de nueva aprobación');
   await tx.query("UPDATE micontacto.profiles SET country_code=$15,maps_url=$16,display_name=$2,profession=$3,description=$4,phone=$5,whatsapp=$6,category_id=$7,region_id=$8,locality_id=$9,latitude=$10,longitude=$11,directory_consent=$12,contact_consent=$13,location_consent=$14,version=version+1,review_decision=NULL,review_reason=NULL,status='DRAFT',updated_at=now() WHERE id=$1",[id,draft.displayName,draft.profession,draft.description,phone(input.phone),phone(input.whatsapp),category,region,locality,latitude,longitude,input.directoryConsent,input.contactConsent,input.locationConsent,draft.country,mapsUrl]);
   await audit(tx,account,id,'PROFILE_EDITED');return {ok:true,status:'DRAFT'};
  });
 }
 async function requestPublication(account,id){return transaction(pool,async tx=>{
  const p=await owned(tx,account,id);writable(p);if(p.status!=='DRAFT')throw Error('INVALID_PROFILE_STATE');
  if(!p.profession?.trim())throw Error('PUBLICATION_REQUIREMENTS');
  await geo(tx,p.country_code,p.region_id,p.locality_id);
  if(!(await tx.query("SELECT id FROM micontacto.photos WHERE profile_id=$1 AND role='MAIN' AND state='ACTIVE'",[id])).rows.length)throw Error('PHOTO_REQUIRED');
  await tx.query("UPDATE micontacto.profiles SET status='PENDING_REVIEW',version=version+1,updated_at=now() WHERE id=$1",[id]);await audit(tx,account,id,'PUBLICATION_REQUESTED');return {ok:true,status:'PENDING_REVIEW'};
 });}
 async function pause(account,id,resume=false){return features.toggle(account,id,resume);}
 async function moderate(actor,id,{action,reason,version}){return transaction(pool,async tx=>{
  if(!(await tx.query("SELECT id FROM micontacto.accounts WHERE id=$1 AND role='ADMIN' AND status='ACTIVE'",[actor])).rows.length)throw Error('FORBIDDEN');
  if(!uuid.test(id))throw Error('NOT_FOUND');const p=(await tx.query('SELECT * FROM micontacto.profiles WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!p)throw Error('NOT_FOUND');
  if(typeof reason!=='string'||reason.trim().length<3||reason.length>500)throw Error('REASON_REQUIRED');if(p.version!==version)throw Error('EDIT_CONFLICT');
  if(!['APPROVE','REJECT','BLOCK'].includes(action)||action!=='BLOCK'&&p.status!=='PENDING_REVIEW'||p.status==='DELETED')throw Error('INVALID_PROFILE_STATE');
  if(action==='APPROVE'){if(p.moderation_restricted)throw Error('PROFILE_LOCKED');await geo(tx,p.country_code,p.region_id,p.locality_id);if(!(await tx.query("SELECT id FROM micontacto.photos WHERE profile_id=$1 AND role='MAIN' AND state='ACTIVE'",[id])).rows.length)throw Error('PHOTO_REQUIRED');}
  if(action==='BLOCK')await features.suspend(tx,id,actor,'Bloqueo ADMIN: '+reason.trim());
  const status=action==='APPROVE'?'ACTIVE':action==='REJECT'?'DRAFT':'BLOCKED';
  await tx.query('UPDATE micontacto.profiles SET status=$2,review_decision=$3,review_reason=$4,version=version+1 WHERE id=$1',[id,status,action==='APPROVE'?'APPROVED':'REJECTED',reason.trim()]);await audit(tx,actor,id,action,reason.trim());return {ok:true,status};
 });}
 return {features,owned,writable,audit,decorate,detail,update,requestPublication,pause,moderate,async create(account,input){return createProfile(input,{accountId:account,db:profilePostgresAdapter(pool),origin});}};
}
