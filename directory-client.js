import {COUNTRIES} from './countries.js';
const $=id=>document.getElementById(id),toggle=$('menuToggle'),nav=$('navLinks');
const closeMenu=()=>{nav?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');};
toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('pointerdown',event=>{if(nav?.classList.contains('open')&&!nav.contains(event.target)&&!toggle?.contains(event.target))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav?.classList.contains('open')){closeMenu();toggle?.focus();}});
window.addEventListener('hashchange',closeMenu);
window.addEventListener('popstate',closeMenu);
window.addEventListener('resize',()=>{if(window.innerWidth>600)closeMenu();});$('year').textContent=new Date().getFullYear();
const country=$('country'),region=$('region'),district=$('district'),locality=$('locality'),category=$('category');let offset=0,lastFilters=null;
for(const c of COUNTRIES)country.append(new Option(c.name,c.code));country.value='PA';
async function api(path){const r=await fetch(path);if(!r.ok)throw Error('No se pudo consultar el directorio. Intenta nuevamente.');return r.json();}
function options(select,rows,first){select.replaceChildren(new Option(first,''));for(const row of rows)select.append(new Option(row.name,row.id));select.disabled=!rows.length;}
async function localities(){const id=district.value||region.value;if(!id){options(locality,[],'Selecciona región');return;}const r=await api('/api/localities?country='+country.value+'&regionId='+id+'&q='+encodeURIComponent($('localitySearch').value));options(locality,r.items.map(l=>({...l,name:l.name+(l.region_name?' · '+l.region_name:'')})),'Todas las localidades · busca para precisar');}
country.onchange=async()=>{try{options(region,(await api('/api/regions?country='+country.value)).items,'Todas las regiones');options(district,[],'Todos los distritos');options(locality,[],'Selecciona región');if(country.value)await search();}catch(e){$('searchStatus').textContent=e.message;}};
region.onchange=async()=>{try{options(district,region.value?(await api('/api/regions?country='+country.value+'&parentId='+region.value)).items:[],'Todos los distritos');await localities();await search();}catch(e){$('searchStatus').textContent=e.message;}};
district.onchange=async()=>{try{await localities();await search();}catch(e){$('searchStatus').textContent=e.message;}};let timer;$('localitySearch').oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>localities().catch(e=>$('searchStatus').textContent=e.message),250);};
function text(tag,value){const node=document.createElement(tag);node.textContent=value;return node;}
async function search(more=false){
 if(!more){offset=0;lastFilters=new URLSearchParams({country:country.value,keyword:$('searchText').value,regionId:district.value||region.value,localityId:locality.value,categoryId:category.value,limit:'20'});$('results').replaceChildren();}
 const filters=new URLSearchParams(lastFilters);filters.set('offset',String(offset));$('searchStatus').textContent='Buscando…';
 try{const data=await api('/api/directory?'+filters);for(const p of data.items){const card=text('article','');card.className='contact-card';if(p.photo_id){const image=document.createElement('img');image.src='/media/'+p.id+'/'+p.photo_id;image.alt='Foto principal de '+p.display_name;card.append(image);}card.append(text('h3',p.display_name),text('p',p.profession),text('p',[p.locality,p.region].filter(Boolean).join(', ')));if(p.featured){const badge=text('span','Destacado');badge.className='tag-inline';card.append(badge);}const link=text('a','Ver tarjeta');link.className='btn btn-outline';link.href='/'+(p.url_country??p.country_code).toLowerCase()+'/'+p.slug;card.append(link);$('results').append(card);}
  offset+=data.items.length;$('loadMore').hidden=data.items.length<20;$('searchStatus').textContent=data.items.length?offset+' resultados cargados.':'No hay perfiles publicados para estos filtros.';
 }catch(e){$('searchStatus').textContent=e.message;$('loadMore').hidden=true;}
}
$('searchForm').onsubmit=e=>{e.preventDefault();search();};$('locality').onchange=()=>search();$('category').onchange=()=>search();const rates=$('tarifas');$('openRates')?.addEventListener('click',()=>{rates.open=true;});$('loadMore').onclick=()=>search(true);
try{const enabled=(await api('/api/countries')).items;country.replaceChildren(...enabled.map(c=>new Option(c.name,c.code)));country.value=enabled.some(c=>c.code==='PA')?'PA':enabled[0]?.code??'';options(category,(await api('/api/categories')).items,'Todas las categorías');await country.onchange();}catch(e){$('searchStatus').textContent=e.message;}
