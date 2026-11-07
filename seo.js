import {COUNTRIES} from './countries.js';
import {directoryQuery} from './directory-query.js';
import {layout} from './views.js';
export const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function metadata(html,{origin,path,title,description}){
 const e=escapeHTML,url=origin+path;
 return html.replace(/<title>[\s\S]*?<\/title>/i,'').replace(/<meta\s+name="(?:robots|description)"[^>]*>/gi,'').replace('</head>',`<title>${e(title)}</title><meta name="description" content="${e(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${e(url)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Mi Contacto"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(url)}"><meta property="og:image" content="${e(origin)}/mi-contacto-open-graph.jpg"><meta name="twitter:card" content="summary_large_image"></head>`);
}
export function publicSEO(pool,{origin}){
 const response=(body,type='text/html; charset=utf-8',status=200)=>new Response(body,{status,headers:{'content-type':type,'cache-control':'public, max-age=60','x-content-type-options':'nosniff','x-robots-tag':status===200?'index, follow':'noindex, nofollow','content-security-policy':"default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'"}});
 const base='/directorio',countryPath=c=>base+'/'+c.toLowerCase(),regionPath=(c,id)=>countryPath(c)+'/region/'+id,localityPath=(c,id)=>countryPath(c)+'/localidad/'+id;
 const countries=async()=>{const rows=(await pool.query('SELECT code FROM micontacto.country_settings WHERE enabled ORDER BY code')).rows;return COUNTRIES.filter(c=>rows.some(r=>r.code===c.code));};
 const link=(path,label)=>`<li><a href="${escapeHTML(path)}">${escapeHTML(label)}</a></li>`;
 async function handle(req){
  const url=new URL(req.url),path=url.pathname;if(req.method!=='GET')return null;
  if(path==='/robots.txt')return response(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /auth/\nDisallow: /admin\nDisallow: /mi-perfil\nDisallow: /pagos\nDisallow: /pago\nSitemap: ${origin}/sitemap.xml\n`,'text/plain; charset=utf-8');
  if(path==='/sitemap.xml'){
   const list=await countries(),paths=['/',base,...list.map(c=>countryPath(c.code))];
   // Only territorial identifiers are selected. No names, contacts, account IDs or profile URLs enter the sitemap.
   const geo=(await pool.query(`WITH RECURSIVE visible AS (SELECT p.country_code,p.region_id,p.locality_id FROM micontacto.profiles p JOIN micontacto.accounts a ON a.id=p.account_id JOIN micontacto.country_settings cs ON cs.code=p.country_code AND cs.enabled WHERE p.status='ACTIVE' AND p.review_decision='APPROVED' AND NOT p.privacy_hidden AND NOT p.moderation_restricted AND p.directory_consent AND p.location_consent AND a.status='ACTIVE'), regions AS (SELECT r.id,r.parent_id,r.country_code FROM micontacto.geo_regions r JOIN visible v ON v.region_id=r.id AND v.country_code=r.country_code WHERE r.enabled UNION SELECT r.id,r.parent_id,r.country_code FROM micontacto.geo_regions r JOIN regions child ON child.parent_id=r.id AND child.country_code=r.country_code WHERE r.enabled) SELECT DISTINCT country_code,id,'region' AS kind FROM regions UNION SELECT DISTINCT l.country_code,l.id,'localidad' AS kind FROM micontacto.geo_localities l JOIN visible v ON v.locality_id=l.id AND v.country_code=l.country_code WHERE l.enabled ORDER BY country_code,kind,id`)).rows;
   for(const g of geo)paths.push(countryPath(g.country_code)+'/'+g.kind+'/'+g.id);
   const page=url.searchParams.get('pagina');if(paths.length>50000&&!page)return response('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+Array.from({length:Math.ceil(paths.length/50000)},(_,i)=>'<sitemap><loc>'+escapeHTML(origin+'/sitemap.xml?pagina='+(i+1))+'</loc></sitemap>').join('')+'</sitemapindex>','application/xml; charset=utf-8');if(page){const n=Number(page);if(!Number.isInteger(n)||n<1||n>Math.ceil(paths.length/50000))return response('Página no encontrada','text/plain',404);paths.splice(n*50000);paths.splice(0,(n-1)*50000);}
   return response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>'<url><loc>'+escapeHTML(origin+p)+'</loc></url>').join('')+'</urlset>','application/xml; charset=utf-8');
  }
  if(path!==base&&!path.startsWith(base+'/'))return null;
  const match=path.match(/^\/directorio(?:\/(pa|cr|ni|sv|hn|gt|mx|co)(?:\/(region|localidad)\/([1-9][0-9]{0,14}))?)?$/);
  if(!match)return response('Página no encontrada','text/plain',404);
  const list=await countries(),country=match[1]?list.find(c=>c.code===match[1].toUpperCase()):null;
  if(match[1]&&!country)return response('Página no encontrada','text/plain',404);
  let place=null,regionId=null,localityId=null;
  if(match[2]){
   const table=match[2]==='region'?'geo_regions':'geo_localities';
   place=(await pool.query(`SELECT * FROM micontacto.${table} WHERE id=$1 AND country_code=$2 AND enabled`,[match[3],country.code])).rows[0];
   if(!place)return response('Página no encontrada','text/plain',404);
   regionId=match[2]==='region'?place.id:place.region_id;localityId=match[2]==='localidad'?place.id:null;
  }
  const title='Directorio'+(place?' en '+place.name:country?' en '+country.name:' de personas y servicios')+' | Mi Contacto';
  let body='<p>Encuentra perfiles publicados de personas, profesionales y servicios'+(country?' en '+escapeHTML(country.name):' por país')+'.</p><nav aria-label="Ubicación"><a href="/directorio">Todos los países</a>'+(country?' · <a href="'+countryPath(country.code)+'">'+escapeHTML(country.name)+'</a>':'')+'</nav>';
  if(!country)body+='<ul>'+list.map(c=>link(countryPath(c.code),c.name)).join('')+'</ul>';
  else{
   const children=localityId?[]:(await pool.query('SELECT id,name FROM micontacto.geo_regions WHERE country_code=$1 AND enabled AND '+(regionId?'parent_id=$2':'parent_id IS NULL')+' ORDER BY name',regionId?[country.code,regionId]:[country.code])).rows;
   body+='<ul>'+children.map(r=>link(regionPath(country.code,r.id),r.name)).join('')+'</ul>';
   if(regionId&&!localityId){const localities=(await pool.query('SELECT id,name FROM micontacto.geo_localities WHERE country_code=$1 AND region_id=$2 AND enabled ORDER BY name',[country.code,regionId])).rows;body+='<ul>'+localities.map(l=>link(localityPath(country.code,l.id),l.name)).join('')+'</ul>';}
   const page=Math.max(1,Math.min(10000,Number(url.searchParams.get('pagina'))||1));
   if(!Number.isInteger(page))return response('Página no encontrada','text/plain',404);
   const q=directoryQuery({country:country.code,...(regionId?{regionId}:{}),...(localityId?{localityId}:{}),limit:20,offset:(page-1)*20});
   const rows=(await pool.query(q.sql,q.params)).rows;
   body+='<section data-nosnippet><h2>Perfiles publicados</h2>'+rows.map(p=>'<article class="panel"><h3><a href="/'+escapeHTML(String(p.url_country).toLowerCase())+'/'+escapeHTML(p.slug)+'">'+escapeHTML(p.display_name)+'</a></h3><p>'+escapeHTML(p.profession)+'</p></article>').join('')+(rows.length?'':'<p>No hay perfiles publicados para esta ubicación.</p>')+'</section>';
   if(rows.length===20)body+='<a href="'+path+'?pagina='+(page+1)+'">Siguiente página</a>';
  }
  const description='Explora el '+(place?'directorio de '+place.name+', '+country.name:country?'directorio de '+country.name:'directorio público por país y región')+' en Mi Contacto. Encuentra personas, profesionales y servicios.';
  return response(metadata(layout(title.replace(' | Mi Contacto',''),body,{privatePage:false,script:null}),{origin,path,title,description}));
 }
 return {handle};
}
