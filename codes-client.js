import {FEATURE_PRICES} from './feature-policy.js';
import {downloadCodesExcel} from './excel-export.js';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const money=n=>'USD '+(n/100).toFixed(2);
const states={AVAILABLE:'Disponible',RESERVED:'Reservado',SOLD:'Vendido',USED:'Utilizado',VOID:'Anulado',PENDING:'Pendiente',PAID:'Pagado',FAILED:'Rechazado',CANCELLED:'Cancelado'};
const errors={LEGAL_ACCEPTANCE_REQUIRED:'Acepta los términos y la privacidad actuales desde Mi perfil antes de canjear.',INVALID_CODE:'Código no válido, no vendido o ya utilizado.',CODE_CONFLICT:'La operación ya cambió o el código pertenece a otra reserva. Actualiza el listado.',FEATURE_CONFLICT:'Ya tienes saldo Destacado. Utilízalo antes de canjear otro código.',PAYMENTS_DISABLED:'Los pagos todavía no están habilitados.',RATE_LIMITED:'Espera antes de volver a intentar.',INVALID_CODE_QUANTITY:'Escribe un entero entre 1 y 1000 códigos.',INVALID_CODE_REFERENCE:'Escribe una referencia de al menos tres caracteres.',FORBIDDEN:'Acceso exclusivo de administración.'};
function client(csrf){return async(path,body)=>{const r=await fetch(path,{method:body?'POST':'GET',headers:body?{'content-type':'application/json','x-mc-csrf':csrf}:{},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok)throw Error(errors[d.error]??'No se pudo completar la operación. Revisa los datos y actualiza.');return d;};}
function button(text,fn,status){const b=el('button',text);b.type='button';b.onclick=async()=>{b.disabled=true;try{await fn();}catch(e){status.textContent=e.message;}finally{b.disabled=false;}};return b;}
function field(parent,title,node){if(!node.hasAttribute('aria-label'))node.setAttribute('aria-label',title);const l=el('label',title);l.append(node);parent.append(l);return node;}
function number(parent){const i=el('input');i.type='number';i.min='1';i.max='100';i.value='1';i.setAttribute('aria-label','Cantidad de códigos');field(parent,'Cantidad de códigos',i);return i;}
async function copy(text,status){await navigator.clipboard.writeText(text);status.textContent='Códigos copiados. Compártelos solo con su destinatario.';}
export async function renderCodesAdmin(target,{csrf}){
 const api=client(csrf);target.replaceChildren();target.classList.add('codes-admin');
 target.append(el('h2','Generador de códigos'),el('p','Cada código representa un día de Destacado y se canjea una sola vez. Generar no activa ningún perfil.'));
 const status=el('p');status.setAttribute('role','status');
 const form=el('form'),quantity=number(form);quantity.max='1000';quantity.step='1';quantity.required=true;
 quantity.setAttribute('aria-label','¿Cuántos códigos deseas generar?');form.querySelector('label').firstChild.textContent='¿Cuántos códigos deseas generar?';
 let key=crypto.randomUUID(),pendingQuantity=null,busy=false,all=[],selected=new Set(),currentBatch='';
 const generate=button('Generar códigos',async()=>{
  if(busy||!form.reportValidity())return;busy=true;quantity.disabled=true;
  try{const n=Number(quantity.value);if(pendingQuantity!==null&&pendingQuantity!==n)key=crypto.randomUUID();pendingQuantity=n;
   const r=await api('/api/admin/codes',{quantity:n,key});key=crypto.randomUUID();pendingQuantity=null;currentBatch=r.batchId;
   await load();status.textContent='Lote generado: '+r.quantity+' códigos. Ningún perfil fue activado.';
  }finally{busy=false;quantity.disabled=false;}
 },status);form.append(generate,el('small','De 1 a 1000 por lote por protección del servidor. Puedes generar más lotes.'));form.onsubmit=e=>{e.preventDefault();if(!generate.disabled)generate.click();};target.append(form,status);
 const toolbar=el('div');toolbar.className='codes-toolbar';
 const search=el('input');search.type='search';search.placeholder='Buscar código, cliente, pago o cuenta';field(toolbar,'Buscar códigos',search);
 const stateFilter=el('select');stateFilter.append(new Option('Todos los estados',''));for(const s of ['AVAILABLE','RESERVED','SOLD','USED','VOID'])stateFilter.append(new Option(states[s],s));field(toolbar,'Estado',stateFilter);
 const batchFilter=el('select');field(toolbar,'Lote',batchFilter);const originFilter=el('select');originFilter.append(new Option('Todos los orígenes',''),new Option('ADMIN','ADMIN'),new Option('Cliente','ONLINE'));field(toolbar,'Origen',originFilter);
 const summary=el('p'),actions=el('div'),container=el('div');container.className='codes-table-scroll';container.tabIndex=0;container.setAttribute('aria-label','Inventario de códigos');
 const editor=el('section');editor.className='codes-editor';editor.hidden=true;target.append(toolbar,summary,actions,editor,container);
 const headers=['Código','Estado','Cliente o destinatario','Referencia de pago','Fecha y hora de generación','Fecha y hora de entrega','Fecha y hora de canje','Cuenta que lo canjeó','Origen ADMIN/Cliente'];
 const date=v=>v?new Date(v).toLocaleString('es-PA',{timeZone:'America/Panama',hour12:false}):'';
 const exportItems=(items,name)=>{if(!items.length)throw Error('No hay códigos para exportar.');downloadCodesExcel(name,[headers,...items.map(c=>[c.code,states[c.state]??c.state,c.customerReference??'',c.paymentReference??'',date(c.createdAt),date(c.soldAt),date(c.usedAt),c.redeemedEmail||c.redeemedAccount||'',c.origin==='ADMIN'?'ADMIN':'Cliente'])]);status.textContent=items.length+' códigos exportados. Horarios de Panamá.';};
 const visible=()=>all.filter(c=>(!currentBatch||c.batchId===currentBatch)&&(!stateFilter.value||c.state===stateFilter.value)&&(!originFilter.value||c.origin===originFilter.value)&&(!search.value||[c.code,c.customerReference,c.paymentReference,c.redeemedEmail,c.redeemedAccount].some(v=>String(v??'').toLowerCase().includes(search.value.toLowerCase()))));
 const chosen=()=>all.filter(c=>selected.has(c.id));
 const batchItems=()=>{if(!currentBatch)throw Error('Selecciona un lote.');return all.filter(c=>c.batchId===currentBatch);};
 actions.className='codes-actions';actions.append(
  button('Copiar códigos seleccionados',()=>{const items=chosen();if(!items.length)throw Error('Selecciona al menos un código.');return copy(items.map(c=>c.code).join('\n'),status);},status),
  button('Excel de seleccionados',()=>exportItems(chosen(),'mi-contacto-seleccion.xlsx'),status),
  button('Seleccionar todos los códigos del lote',()=>{for(const c of batchItems())selected.add(c.id);draw();},status),
  button('Copiar todos los códigos del lote',()=>copy(batchItems().map(c=>c.code).join('\n'),status),status),
  button('Excel del lote completo',()=>exportItems(batchItems(),'mi-contacto-lote.xlsx'),status),
  button('Descargar histórico completo Excel',()=>exportItems(all,'mi-contacto-historico.xlsx'),status),
  button('Quitar selección',()=>{selected.clear();draw();},status));
 function edit(c){editor.replaceChildren(el('h3',c.code));editor.hidden=false;
  const ref=el('input');ref.maxLength=180;ref.value=c.customerReference??'';field(editor,'Cliente o destinatario',ref);
  const payment=el('input');payment.maxLength=180;payment.value=c.paymentReference??'';field(editor,'Referencia de pago (solo para venta)',payment);
  const available=c.state==='AVAILABLE'?['RESERVE','SELL','GIFT','VOID']:c.state==='RESERVED'?['RELEASE','SELL','GIFT','VOID']:['VOID'];
  for(const action of available)editor.append(button({RESERVE:'Reservar',RELEASE:'Liberar reserva',SELL:'Registrar entrega',GIFT:'Regalar código',VOID:'Anular'}[action],async()=>{
   if(action==='VOID'&&!confirm('¿Anular este código? No podrá canjearse.'))return;
   await api('/api/admin/codes/'+c.id,{action,reference:ref.value,paymentReference:payment.value});editor.hidden=true;await load();status.textContent='Operación registrada.';
  },status));editor.append(button('Cerrar',()=>{editor.hidden=true;},status));editor.scrollIntoView({block:'nearest',behavior:'instant'});
 }
 function draw(){container.replaceChildren();const items=visible();summary.textContent=items.length+' códigos visibles · '+all.length+' en inventario · '+selected.size+' seleccionados';
  const table=el('table');table.className='codes-table';const caption=el('caption','Inventario de códigos · fechas de Panamá');table.append(caption);const head=el('thead'),hr=el('tr'),first=el('th'),check=el('input');check.type='checkbox';check.setAttribute('aria-label','Seleccionar códigos visibles');check.checked=items.length>0&&items.every(c=>selected.has(c.id));check.onchange=()=>{for(const c of items)check.checked?selected.add(c.id):selected.delete(c.id);draw();};first.append(check);hr.append(first);
  for(const text of ['Código','Estado','Cliente o destinatario','Referencia de pago','Fecha de generación','Origen','Acciones']){const th=el('th',text);th.scope='col';hr.append(th);}head.append(hr);table.append(head);const body=el('tbody');
  for(const c of items){const tr=el('tr'),td=el('td'),cb=el('input');cb.type='checkbox';cb.checked=selected.has(c.id);cb.setAttribute('aria-label','Seleccionar '+c.code);cb.onchange=()=>{cb.checked?selected.add(c.id):selected.delete(c.id);summary.textContent=items.length+' códigos visibles · '+all.length+' en inventario · '+selected.size+' seleccionados';};td.append(cb);tr.append(td);const codeCell=el('td');codeCell.append(el('code',c.code));tr.append(codeCell);
   for(const v of [states[c.state],c.customerReference||'—',c.paymentReference||'—',date(c.createdAt),c.origin==='ADMIN'?'ADMIN':'Cliente'])tr.append(el('td',v));const controls=el('td');controls.append(button('Copiar código',()=>copy(c.code,status),status));if(c.origin==='ADMIN'&&!['USED','VOID'].includes(c.state))controls.append(button('Gestionar',()=>edit(c),status));tr.append(controls);body.append(tr);
  }table.append(body);container.append(table);if(!items.length)container.append(el('p','No hay códigos para estos filtros.'));
 }
 async function load(){all=[];for(let offset=0;offset<10000000;offset+=100){const {items}=await api('/api/admin/codes?offset='+offset);all.push(...items);if(items.length<100)break;}
  const ids=new Set(all.map(c=>c.id));selected=new Set([...selected].filter(id=>ids.has(id)));const batches=[...new Set(all.map(c=>c.batchId))];if(currentBatch&&!batches.includes(currentBatch))currentBatch='';batchFilter.replaceChildren(new Option('Todos los lotes',''));for(const id of batches)batchFilter.append(new Option('Lote '+id.slice(0,8)+' · '+all.filter(c=>c.batchId===id).length+' códigos',id));batchFilter.value=currentBatch;draw();
 }
 search.oninput=draw;stateFilter.onchange=draw;originFilter.onchange=draw;batchFilter.onchange=()=>{currentBatch=batchFilter.value;draw();};await load();
 const history=el('details');history.append(el('summary','Historial y auditoría'));target.append(history);
 async function loadHistory(offset=0){history.replaceChildren(el('summary','Historial y auditoría'));const {items}=await api('/api/admin/code-events?offset='+offset);for(const e of items)history.append(el('p',date(e.created_at)+' · '+e.action+' · '+e.reason));if(offset)history.append(button('Historial anterior',()=>loadHistory(offset-100),status));if(items.length===100)history.append(button('Más historial',()=>loadHistory(offset+100),status));}await loadHistory();
}
export async function renderCommercial(target,{csrf,profile,paymentSandbox,refresh}={}){
 const api=client(csrf);target.replaceChildren();target.append(el('h2','Destacar mi perfil'));const status=el('p');status.setAttribute('role','status');target.append(status);
 if(!profile){target.append(el('p','Guarda tu perfil para canjear un código o elegir Destacado.'));return;}
 const redeem=el('section');redeem.append(el('h3','Ya tengo un código'));const code=el('input');code.autocomplete='off';code.maxLength=19;code.setAttribute('aria-label','Código de Destacado');field(redeem,'Código de un día',code);redeem.append(button('Canjear código',async()=>{const r=await api('/api/profiles/'+profile.id+'/redeem-code',{code:code.value.trim()});status.textContent=r.replayed?'Ese código ya fue canjeado en tu perfil. No se añadió saldo otra vez.':r.state==='PAUSED'?'Código canjeado. Saldo en pausa hasta que el perfil sea elegible.':'Código canjeado. Consulta tu saldo Destacado.';code.value='';if(refresh)await refresh();},status));target.append(redeem);
 // Lanzamiento promocional: mostrar únicamente canje de códigos. Las opciones de compra y prueba se conservan en el historial de Git para reactivarlas cuando se habiliten los pagos.
 const inventory=el('details');inventory.append(el('summary','Mis códigos y compras'));target.append(inventory);const codes=el('div'),orders=el('div');inventory.append(codes,orders);
 async function codePage(offset=0){codes.replaceChildren();const items=(await api('/api/codes?offset='+offset)).items;for(const c of items){const row=el('p',c.code+' · '+states[c.state]);row.append(button('Copiar',()=>copy(c.code,status),status));codes.append(row);}if(offset)codes.append(button('Códigos anteriores',()=>codePage(Math.max(0,offset-100)),status));if(items.length===100)codes.append(button('Más códigos',()=>codePage(offset+100),status));}
 async function orderPage(offset=0){orders.replaceChildren();const items=(await api('/api/code-orders?offset='+offset)).items;for(const o of items)orders.append(el('p',o.quantity+' códigos · '+money(o.amountCents)+' · '+states[o.status]+' · Yappy de pruebas'));if(offset)orders.append(button('Compras anteriores',()=>orderPage(Math.max(0,offset-100)),status));if(items.length===100)orders.append(button('Más compras',()=>orderPage(offset+100),status));}await codePage();await orderPage();

}
