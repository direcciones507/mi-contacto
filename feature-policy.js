export const FEATURE_PRICES=Object.freeze({1:169,5:799,10:1499,15:2199,20:2799,25:3199,30:3499});
export function featureQuote(days){
 if(!Number.isInteger(days)||!Object.hasOwn(FEATURE_PRICES,days))throw Error('INVALID_FEATURE_DAYS');
 return {days,amountCents:FEATURE_PRICES[days],currency:'USD',paymentEnabled:false,automaticRenewal:false};
}
export function featureBalance(t,now=Date.now()){
 if(t.remaining_ms===undefined)return Math.max(0,Date.parse(t.expires_at)-now);
 const elapsed=t.state==='ACTIVE'?Math.max(0,Math.max(now,Date.parse(t.observed_at)||0)-Date.parse(t.anchor_at)):0;
 return Math.max(0,Number(t.remaining_ms)-elapsed);
}
export function activeFeature(terms,now=Date.now()){
 return terms.some(t=>t.state==='ACTIVE'&&(t.remaining_ms!==undefined||Date.parse(t.starts_at)<=now)&&featureBalance(t,now)>0);
}
export function visiblePhotos(photos,featured){return photos.filter(p=>p.state==='ACTIVE'&&(p.role==='MAIN'||featured)).slice(0,featured?5:1);}
