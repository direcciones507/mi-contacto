# Fotos y Google — configuración preparada, sin conexiones reales

## Almacenamiento independiente

El runtime recibe storage explícitamente. No lee buckets, credenciales o archivos .env de Direcciones507 ni de otro proyecto. Por defecto continúa con memoria efímera; no se cambió el arranque para conservar fotos junto a una base efímera sin advertencia.

### Persistencia privada local comprobada

`localPhotoStorage({root:'/carpeta/privada/exclusiva', isolated:true})`, de photo-storage-local.js, funciona en el sistema de archivos Linux validado. Requiere carpeta privada 0700, vacía al primer uso; crea una marca de proyecto. Rechaza raíces ajenas no vacías, enlaces simbólicos en raíz/marca/objetos y permisos públicos. No usar una carpeta servida por HTTP ni una compartida con otra aplicación. El padre también debe estar bajo control exclusivo del operador; las defensas de archivos no sustituyen aislamiento del host ni protegen contra un administrador del sistema comprometido.

Las claves solo aceptan mi-contacto/UUID/UUID.webp. Los nombres físicos se derivan mediante SHA-256, sin nombres personales. Escritura privada 0600, temporal exclusiva, sincronización y publicación por hardlink sin sobreescribir una clave existente. Lectura privada por el servidor, sin URL pública ni URL firmada persistente. Esta implementación requiere un filesystem que soporte las operaciones indicadas; no se afirma compatibilidad con Windows, almacenamiento de red ni un filesystem distinto sin validación.

La reapertura conserva los bytes; una segunda instancia de aplicación sirvió una imagen aprobada desde el mismo almacenamiento. Esto prueba persistencia de archivos, **no** persistencia ni backup conjunto de una base de datos productiva. No se habilitó este adaptador en un servicio activo.

### Contrato de bucket simulado

`isolatedObjectStorage({isolated:true,bucket:'mi-contacto-validacion-photos',client})` exige nombre con prefijo mi-contacto- y métodos putObject/getObject/deleteObject explícitos. El prefijo y la declaración isolated son guardias de configuración, no prueban que un bucket real sea exclusivo.

- putObject recibe {bucket,key,body,contentType:'image/webp',public:false}.
- getObject recibe {bucket,key} y debe devolver bytes privados o null, nunca una URL pública, un redirect ni un objeto de respuesta SDK sin convertir.
- deleteObject es una primitiva del contrato, pero el runtime no la invoca: ante un COMMIT de resultado incierto conserva el objeto privadamente. No existe ruta de borrado físico por retención o solicitud de usuario. Los huérfanos requieren reconciliación aprobada; no se eliminan suponiendo que el COMMIT no ocurrió.

Para futura configuración, aprobar primero un bucket NUEVO y exclusivo; acceso público deshabilitado, sin dominio/CDN público ni credenciales de otras aplicaciones. Credencial de servicio limitada a ese bucket; conversión/limitación de streams a bytes en el futuro cliente SDK, timeouts, reintentos y observabilidad sin datos privados. No se construyó ni conectó ese cliente R2 real ni se creó un bucket. No introducir claves en Git o en el navegador.

Antes de almacenar, preparePhoto valida JPG/PNG/WebP estáticos, máximo 5 MB y 20 millones de píxeles; corrige orientación, limita a 1600 px y convierte a WebP sin metadatos. La sustitución revoca acceso al identificador anterior aun con archivo conservado. Una ficha no aprobada, oculta o bloqueada no sirve fotos a visitantes; propietario y ADMIN conservan acceso autenticado de gestión. Galería adicional pública solo con Destacado activo. Todas las respuestas de imagen pasan por el servidor, comprueban autorización y usan no-store.

No se borran originales de versiones retiradas ni galerías vencidas por una política automática. Una futura copia de seguridad deberá coordinar catálogo SQL, versiones/objetos y reserva de nombres. La retención requiere aprobación; ver RETENTION-PROPOSAL.md.

## Cliente Google exclusivo — instrucciones futuras

No se solicitó, utilizó o generó una credencial real. El flujo local se prueba con claves RSA, JWKS y respuestas sintéticas dentro del proceso.

1. Cuando se autorice la integración, usar un proyecto/cliente web exclusivo de Mi Contacto. No reutilizar el cliente de Direcciones507 ni sus consentimientos, secretos o sesiones.
2. El callback que exige el código es `https://micontacto.online/auth/google/callback`, exactamente. El runtime acepta ese origen o HTTP loopback explícito para pruebas; no habilita dominios arbitrarios. Aprobar dominio y callback antes de configurar Google.
3. La configuración server-side de createApplication recibe google:{clientId,clientSecret}, secret de sesión de al menos 32 bytes y el origen exacto. No se incluye un cargador de variables productivas ni credenciales predeterminadas. El dominio/callback real todavía no se validó contra Google.
4. Scope mínimo: openid. La aplicación utiliza sub validado como identidad y no almacena email, nombre o foto de Google. Los datos de la tarjeta se proporcionan aparte por el propietario. La interfaz no necesita ni solicita permisos de Gmail, Drive u otros servicios.
5. State, nonce y verifier PKCE aleatorios; challenge S256; cookie HttpOnly/SameSite=Lax/Secure en HTTPS; transacción de un solo uso de hasta diez minutos. El intercambio no sigue redirects y tiene límite de espera de diez segundos.
6. Verificación JOSE RS256, issuer, audience, exp y nonce con claves oficiales. El verificador sustituido y fetch sintético se usan solo en el harness. Ningún claim de rol eleva a ADMIN.
7. La sesión combina firma, hash almacenado, expiración y estado/rol actuales de cuenta. POST exige origen y CSRF. Logout revoca una sesión; logout-all revoca las sesiones de la misma cuenta. No se altera el rol por OAuth.
8. Cancelaciones/errores consumen el state válido y limpian la cookie OAuth; para un navegador hay una página segura de retorno. No se reflejan descripciones del proveedor ni detalles técnicos secretos. Para volver a intentar se inicia otro flujo.

Antes de publicar: comprobar Google real en un entorno dedicado autorizado, consentimientos y callback, cookies HTTPS, rotación de secretos y procedimiento de aprovisionamiento ADMIN revisado. Las pruebas actuales no verifican la consola Google, un usuario real ni entrega de códigos de Google.
