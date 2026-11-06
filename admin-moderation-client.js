const node=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
const states={CONTACT_PENDING:'Pendiente de contacto',WAITING:'Esperando verificación',VERIFIED:'Verificado',UNVERIFIED:'No verificado',RESOLVED:'Resuelto'};
export function reportInvestigation(card,r,{api,message,refresh}){
 card.append(node('p','Investigación: '+states[r.investigation_state]));const target=new Date(r.contact_target_at);card.append(node('p','Objetivo de contacto: '+target.toLocaleString('es')+' · Aproximadamente 48 horas, sin sanción automática.'));
 if(r.contacted_at)card.append(node('p','Contacto registrado: '+new Date(r.contacted_at).toLocaleString('es')));if(r.investigation_notes)card.append(node('p','Resultado/notas: '+r.investigation_notes));if(r.state!=='OPEN')return;
 const f=node('form'),select=node('select');for(const [value,title]of Object.entries(states))if(value!=='RESOLVED')select.append(new Option(title,value));select.value=r.investigation_state;
 function field(label,input){input.setAttribute('aria-label',label);const l=node('label',label);l.append(input);f.append(l);return input;}field('Estado de la investigación',select);
 const contacted=field('Fecha del contacto por WhatsApp',node('input'));contacted.type='datetime-local';const due=field('Plazo comunicado al titular (opcional)',node('input'));due.type='datetime-local';
 const local=v=>{if(!v)return '';const d=new Date(v);return new Date(+d-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};contacted.value=local(r.contacted_at);due.value=local(r.response_due_at);
 const notes=field('Notas mínimas y resultado, sin videos ni enlaces privados',node('textarea'));notes.maxLength=500;notes.required=true;notes.value=r.investigation_notes;
 const save=node('button','Guardar investigación');save.type='submit';f.append(save);f.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await api('/api/admin/reports/'+r.id+'/investigation',{method:'POST',body:{state:select.value,contactedAt:contacted.value?new Date(contacted.value).toISOString():null,responseDueAt:due.value?new Date(due.value).toISOString():null,notes:notes.value,version:r.investigation_version}});await refresh();}catch(e){message(e.message);}finally{save.disabled=false;}};card.append(f);
}
export function contactLink(card,p){const phone=p.whatsapp||p.phone;if(!/^\+[1-9][0-9]{7,14}$/.test(phone??'')){card.append(node('p','No hay un número válido proporcionado para contactar por WhatsApp.'));return;}const a=node('a','Contactar al titular por WhatsApp');a.href='https://wa.me/'+phone.slice(1);a.target='_blank';a.rel='noopener noreferrer';card.append(a,node('p','Solicita la verificación por WhatsApp. No subas videos a Mi Contacto.'));
}
