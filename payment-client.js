import {FEATURE_PRICES} from './feature-policy.js';
const $=id=>document.getElementById(id),profileId=location.pathname.split('/').at(-1);
let csrf='',order=null,busy=false,key=sessionStorage.getItem('mc-checkout-'+profileId);
if(!key){key=crypto.randomUUID();sessionStorage.setItem('mc-checkout-'+profileId,key);}
const message=text=>{$('paymentMessage').textContent=text;};
async function api(path,{method='GET',body}={}){
 const r=await fetch(path,{method,headers:method==='GET'?{}:{'content-type':'application/json','x-mc-csrf':csrf},...(method!=='GET'?{body:JSON.stringify(body)}:{})});const data=await r.json();
 if(!r.ok)throw Error(({PAYMENT_CONFLICT:'Ya hay un intento registrado. Consulta su estado y solicita conciliación antes de reintentarlo.',PAYMENTS_DISABLED:'Los pagos de prueba no están habilitados.',PROFILE_LOCKED:'El perfil está restringido.',INVALID_PAYMENT_COUNTRY:'Yappy está disponible únicamente para Panamá.',INVALID_YAPPY_ORDER:'Introduce el celular UAT de ocho dígitos, empezando en 6.'})[data.error]??'No se pudo completar la operación. Consulta el estado antes de reintentar.');return data;
}
function show(o){order=o;$('paymentForm').hidden=true;$('paymentRefresh').hidden=false;$('yappyCheckout').hidden=o.status!=='PENDING'||o.initialized;message('Orden '+o.id+' · USD '+(o.amountCents/100).toFixed(2)+' · '+({PENDING:o.initialized?'Pendiente de confirmación. Un intento iniciado necesita conciliación antes de repetirlo.':'Pendiente. Puedes continuar con el botón Yappy de pruebas.',PAID:'Pago de prueba confirmado. Consulta tu saldo en Mi perfil.',FAILED:'No completado; requiere conciliación.',CANCELLED:'Cancelado; requiere conciliación.'}[o.status]));}
async function refresh(){if(order)show(await api('/api/payments/'+order.id));}
$('paymentRefresh').onclick=()=>refresh().catch(e=>message(e.message));
$('paymentForm').onsubmit=async e=>{e.preventDefault();if(busy||!$('paymentForm').reportValidity())return;busy=true;const b=e.submitter;b.disabled=true;try{
 const term=await api('/api/profiles/'+profileId+'/feature',{method:'POST',body:{days:Number($('paymentDays').value)}});
 const created=await api('/api/profiles/'+profileId+'/checkout',{method:'POST',body:{termId:term.id,key,email:$('paymentEmail').value.trim()}});show(created);
}catch(e){message(e.message);}finally{busy=false;b.disabled=false;}};
const yappy=document.querySelector('btn-yappy');
yappy.addEventListener('eventClick',async()=>{if(busy||!order)return;const alias=$('yappyAlias').value.trim();if(!/^6[0-9]{7}$/.test(alias)){message('Introduce el celular UAT de ocho dígitos, empezando en 6.');return;}busy=true;try{
 const result=await api('/api/payments/'+order.id+'/initialize',{method:'POST',body:{alias}});yappy.eventPayment({transactionId:result.transactionId,token:result.token,documentName:result.documentName});message('Continúa en Yappy de pruebas y después consulta el estado.');
}catch(e){message(e.message);$('yappyCheckout').hidden=true;}finally{busy=false;}});
for(const event of ['eventSuccess','eventError'])yappy.addEventListener(event,()=>refresh().catch(e=>message(e.message)));
try{
 const session=await api('/api/session');csrf=session.csrf;const config=await api('/api/payments/config');if(!config.enabled)throw Error('Los pagos de prueba no están habilitados.');
 const p=await api('/api/profiles/'+profileId);if(p.country!=='PA')throw Error('Yappy está disponible únicamente para Panamá.');
 const orders=(await api('/api/profiles/'+profileId+'/orders')).items,existing=orders.find(o=>o.status!=='PAID');
 if(existing)show(existing);else if(p.featureTerms.some(t=>['ACTIVE','PAUSED'].includes(t.state))){const paid=orders.find(o=>o.status==='PAID');if(paid)show(paid);else message('El perfil ya tiene saldo Destacado. Vuelve a Mi perfil.');}
 else {key=crypto.randomUUID();sessionStorage.setItem('mc-checkout-'+profileId,key);for(const [days,cents] of Object.entries(FEATURE_PRICES))$('paymentDays').append(new Option(days+' días · USD '+(cents/100).toFixed(2),days));$('paymentForm').hidden=false;message('Elige un paquete y el correo para el comprobante de prueba.');}
}catch(e){message(e.message);}
