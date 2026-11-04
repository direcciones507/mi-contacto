/** Accept only HTTPS Google Maps pins; never fetch user URLs or infer coordinates from short links. */
export function validateMapsUrl(value){
 if(value==null||value==='')return null;
 if(typeof value!=='string'||value.length>2048)throw Error('INVALID_MAPS_URL');
 let url;try{url=new URL(value.trim());}catch{throw Error('INVALID_MAPS_URL');}
 const host=url.hostname;
 const accepted=host==='maps.app.goo.gl'&&url.pathname.length>1||host==='goo.gl'&&url.pathname.startsWith('/maps/')||['www.google.com','google.com','maps.google.com'].includes(host)&&(/^\/maps(?:\/|$)/.test(url.pathname)||host==='maps.google.com'&&url.pathname==='/');
 if(url.protocol!=='https:'||url.username||url.password||url.port||!accepted)throw Error('INVALID_MAPS_URL');
 return url.href;
}
