export function applicationOrigin(origin,{acceptance=false}={}){
 const base=new URL(origin),local=base.protocol==='http:'&&['127.0.0.1','localhost'].includes(base.hostname);
 const ownedTest=base.protocol==='https:'&&base.port===''&&(base.hostname==='pruebas.micontacto.online'||/^mi-contacto-[a-z0-9-]+\.up\.railway\.app$/.test(base.hostname));
 if(base.username||base.password||base.pathname!=='/'||base.search||base.hash||!local&&base.origin!=='https://micontacto.online'&&!(acceptance&&ownedTest))throw Error('INVALID_ORIGIN');
 return base;
}
