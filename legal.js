import {PHOTO_NOTICE_ITEMS} from './content-policy.js';
import {createHash} from 'node:crypto';
import {layout} from './views.js';
export const POLICY_VERSION='2026-11-04.2';
export const PRIVACY_TEXT=[
 ['Qué datos tratamos','Usamos el identificador que Google verifica para administrar tu cuenta y sesiones. El perfil contiene tu nombre, fotografía, descripción y los contactos y ubicación que decidas proporcionar. No pedimos una dirección física.'],
 ['Para qué los usamos','Administramos tu perfil, revisamos solicitudes, mostramos los datos que autorices, prevenimos abusos y atendemos solicitudes de privacidad. No activamos cobros ni suscripciones en esta versión.'],
 ['Qué se hace público','Una ficha aprobada se abre por enlace y puede reenviarse. El enlace no es una contraseña. Las fichas solicitan no indexación, pero no se garantiza que terceros no guarden copias. Teléfono, WhatsApp y ubicación dependen de tu autorización. El directorio requiere consentimiento, aprobación y un Destacado activo.'],
 ['Fotografías y ubicación','Las fotos se validan y se almacenan en el destino privado configurado. El servidor comprueba permisos antes de entregarlas. La galería adicional depende de la vigencia del Destacado. Google Maps recibe el enlace del pin cuando abres la navegación; Waze se ofrece solo con coordenadas válidas.'],
 ['Proveedores y transferencias','Google participa en la autenticación; PostgreSQL conserva los datos y Cloudflare R2 o el almacenamiento privado configurado conserva las fotos. La ubicación de tratamiento y los proveedores habilitados se identifican abajo. No reutilizamos credenciales de otros proyectos.'],
 ['Tus controles','Puedes editar, ocultar tu ficha y retirar consentimientos de contactos, ubicación y directorio. Al solicitar eliminación, se oculta la ficha; ADMIN autoriza el borrado definitivo del perfil. Los archivos retirados se borran mediante una cola con reintentos. La URL y el QR dejan de funcionar.'],
 ['Datos que permanecen','La eliminación del perfil no elimina por sí sola tu cuenta Google de acceso ni el registro de aceptación de estas condiciones. Se conserva un hash del enlace para impedir reutilizarlo y una constancia administrativa sin el contenido eliminado. Para solicitudes sobre la cuenta completa, acceso, copia, rectificación u oposición, utiliza el canal de privacidad indicado abajo. Las copias de respaldo están sujetas a la retención publicada y no deben reintroducir perfiles eliminados.'],
 ['Edad y datos de terceros','Este texto propone el servicio para personas mayores de 18 años. No publiques datos de menores, información sensible ni datos de otra persona sin autorización. La política de edad requiere aprobación del responsable antes del lanzamiento.']
];
export const TERMS_TEXT=[
 ['Aviso previo de fotografías y contenido permitido',PHOTO_NOTICE_ITEMS.join(' ')],
 ['El servicio','Mi Contacto permite mantener un perfil personal por cuenta Google. Puedes cambiar de país y localidad conservando la URL y el QR originales. Un cambio de país no crea otro perfil ni cambia el país escrito en tu enlace original.'],
 ['Tu cuenta y contenido','Accede con tu propia cuenta Google. Debes tener autorización para publicar textos, fotografías y datos de contacto. No suplantes a otras personas ni publiques contenido ilícito, abusivo o engañoso. La verificación de fotografía no acredita identidad legal ni certifica tu actividad.'],
 ['Publicación y visibilidad','Crear o editar un borrador no lo publica. La publicación y sus cambios están sujetos a revisión. El perfil gratuito se comparte por enlace o QR. El directorio y hasta cuatro fotos adicionales requieren Destacado elegible, aprobación y los consentimientos correspondientes.'],
 ['Precios y pagos','Los paquetes mostrados son información comercial. En esta versión no se procesan cobros, suscripciones ni renovaciones automáticas. Antes de habilitar pagos deberán aprobarse y comunicarse condiciones específicas de contratación, impuestos, vigencia y atención de reclamos.'],
 ['Moderación y eliminación','ADMIN puede rechazar o bloquear contenido con motivo registrado. Puedes ocultar tu perfil y solicitar su eliminación definitiva. La autorización ADMIN y la cola de archivos controlan el borrado. Solicitar revisión no garantiza aprobación.'],
 ['Servicios de terceros','Google, Maps, Waze y otras aplicaciones tienen sus propias condiciones. Su disponibilidad y los datos de navegación pueden variar. Comprueba el destino antes de desplazarte.'],
 ['Cambios y contacto','Una modificación material de estos textos debe publicar una nueva versión y requerir nueva aceptación. El responsable y el canal de contacto se indican abajo. Estas condiciones no declaran renuncia a derechos obligatorios del usuario. La revisión legal de países habilitados sigue a cargo del responsable.']
];
export function legalConfig(env=process.env,{requireApproval=false}={}){
 const config={approved:env.MC_LEGAL_APPROVED==='true',version:POLICY_VERSION,controller:env.MC_LEGAL_CONTROLLER??'',contact:env.MC_PRIVACY_CONTACT??'',retention:env.MC_RETENTION_NOTICE??'',processing:env.MC_PROCESSING_NOTICE??''};
 if(requireApproval&&(!config.approved||[config.controller,config.contact,config.retention,config.processing].some(x=>!x.trim()||x.length>2000)))throw Error('LEGAL_REVIEW_AND_CONTROLLER_DETAILS_REQUIRED');
 return config;
}
export const policyDigest=config=>createHash('sha256').update(JSON.stringify({version:config.version,controller:config.controller,contact:config.contact,retention:config.retention,processing:config.processing,privacy:PRIVACY_TEXT,terms:TERMS_TEXT})).digest('hex');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function legalPage(kind,config=legalConfig({})){
 const title=kind==='privacy'?'Política de privacidad':'Términos de servicio',sections=kind==='privacy'?PRIVACY_TEXT:TERMS_TEXT;
 return layout(title,(config.approved?'':'<p role="alert">Borrador pendiente de revisión y aprobación del responsable. No habilita el lanzamiento.</p>')+'<p>Versión '+esc(config.version)+'</p>'+sections.map(([h,p])=>'<section><h2>'+esc(h)+'</h2><p>'+esc(p)+'</p></section>').join('')+'<h2>Responsable y atención</h2><p>Responsable: '+esc(config.controller||'Pendiente de confirmar')+'</p><p>Canal de privacidad: '+esc(config.contact||'Pendiente de confirmar')+'</p><p>Conservación y respaldos: '+esc(config.retention||'Política pendiente de aprobación')+'</p><p>Proveedores y ubicación de tratamiento: '+esc(config.processing||'Pendiente de confirmar')+'</p>',{script:null});
}
export function consentRuntime(pool,config){
 const digest=policyDigest(config);
 async function accepted(account){return !config.approved||!!(await pool.query('SELECT account_id FROM micontacto.legal_consents WHERE account_id=$1 AND policy_version=$2 AND policy_digest=$3',[account,config.version,digest])).rows[0];}
 async function accept(account,input){if(!config.approved)throw Error('LEGAL_REVIEW_PENDING');if(!input||input.acceptTerms!==true||input.acceptPrivacy!==true||input.adult!==true||input.version!==config.version||input.policyDigest!==digest||Object.keys(input).some(k=>!['acceptTerms','acceptPrivacy','adult','version','policyDigest'].includes(k)))throw Error('INVALID_LEGAL_ACCEPTANCE');await pool.query('INSERT INTO micontacto.legal_consents(account_id,policy_version,policy_digest) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[account,config.version,digest]);return {accepted:true,version:config.version,policyDigest:digest};}
 return {accepted,accept,publicInfo:{approved:config.approved,version:config.version,policyDigest:digest,privacyUrl:'/privacidad',termsUrl:'/terminos'}};
}
