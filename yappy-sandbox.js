import {createHmac,timingSafeEqual} from 'node:crypto';
// Adapted from Direcciones507 payment-policy/provider, read 2026-11-04.
// Own merchant, signing key and callback only. Production host intentionally absent.
export function yappySandbox(config,http=fetch){
 if(config?.environment!=='test'||config.isolated!==true||!config.merchantId?.trim())throw Error('INVALID_PAYMENT_CONFIGURATION');
 for(const v of [config.domain,config.ipnUrl]){const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password||u.hash)throw Error('INVALID_PAYMENT_CONFIGURATION');}
 if(new URL(config.ipnUrl).origin!==new URL(config.domain).origin||new URL(config.ipnUrl).pathname!=='/api/payments/yappy/ipn')throw Error('INVALID_PAYMENT_CONFIGURATION');
 if(typeof config.secret!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(config.secret)||config.secret.length>4096)throw Error('INVALID_PAYMENT_CONFIGURATION');
 const key=Buffer.from(config.secret,'base64').toString('utf8').split('.')[0];if(key.length<16||key.includes('\uFFFD'))throw Error('INVALID_PAYMENT_CONFIGURATION');
 async function post(path,body,token){try{
  const r=await http('https://api-comecom-uat.yappycloud.com'+path,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{'content-type':'application/json',...(token?{authorization:token}:{})},body:JSON.stringify(body)});
  if(!r.ok)throw Error();const reader=r.body?.getReader();if(!reader)throw Error();const chunks=[];let n=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>64000){await reader.cancel();throw Error();}chunks.push(value);}}finally{reader.releaseLock();}
  return JSON.parse(Buffer.concat(chunks).toString());
 }catch{throw Error('PAYMENT_PROVIDER_UNCONFIRMED');}}
 return {environment:'test',domain:config.domain,
  verify(query){
   for(const k of ['orderId','status','domain'])if(query.getAll(k).length!==1)throw Error('INVALID_PAYMENT_NOTIFICATION');
   if(query.getAll('hash').length+query.getAll('Hash').length!==1)throw Error('INVALID_PAYMENT_NOTIFICATION');
   const id=query.get('orderId'),status=query.get('status'),domain=query.get('domain'),hash=query.get('hash')??query.get('Hash');
   if(!/^[A-Za-z0-9]{1,15}$/.test(id??'')||!['E','R','C','X'].includes(status)||domain!==config.domain||!/^[a-f0-9]{64}$/i.test(hash??''))throw Error('INVALID_PAYMENT_NOTIFICATION');
   if(!timingSafeEqual(createHmac('sha256',key).update(id+status+domain).digest(),Buffer.from(hash,'hex')))throw Error('INVALID_PAYMENT_SIGNATURE');
   return {orderId:id,status:status==='E'?'PAID':status==='C'?'CANCELLED':'FAILED'};
  },
  async createOrder(order,alias){
   if(!/^[A-Za-z0-9]{1,15}$/.test(order.provider_order_id)||!/^6[0-9]{7}$/.test(alias??'')||!Number.isSafeInteger(order.amount_cents)||order.amount_cents<=0)throw Error('INVALID_YAPPY_ORDER');
   const auth=await post('/payments/validate/merchant',{merchantId:config.merchantId,urlDomain:config.domain});
   if(typeof auth.body?.token!=='string'||!auth.body.token||!Number.isFinite(Number(auth.body.epochTime)))throw Error('PAYMENT_PROVIDER_UNCONFIRMED');
   const amount=(order.amount_cents/100).toFixed(2),r=await post('/payments/payment-wc',{merchantId:config.merchantId,orderId:order.provider_order_id,domain:config.domain,paymentDate:auth.body.epochTime,aliasYappy:alias,ipnUrl:config.ipnUrl,discount:'0.00',taxes:'0.00',subtotal:amount,total:amount},auth.body.token),b=r.body;
   if(!b||typeof b.token!=='string'||!b.token||typeof b.documentName!=='string'||!b.documentName||!b.transactionId||String(b.transactionId).length>300)throw Error('PAYMENT_PROVIDER_UNCONFIRMED');
   return {transactionId:String(b.transactionId),token:b.token,documentName:b.documentName};
  }
 };
}
