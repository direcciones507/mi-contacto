# Reutilización de cuentas y proveedores existentes

Rama work/provider-reuse-20261105. Base ac87f2c. No hay cuentas, proyectos, bases ni recursos nuevos. El alcance es exclusivamente Mi Contacto; Direcciones507 se consultó en lectura, sin valores secretos ni cambios.

## Comparación efectuada

| Direcciones507 | Mi Contacto | Decisión |
|---|---|---|
| core/runtime/general-auth.ts: Google con PKCE, estado consumido SQL, cookie ad507_session y esquema ad507 | google-oauth.js, auth-runtime.js: PKCE/estado, cookie mc_session, esquema y base micontacto | Reutilizar aplicación Google existente añadiendo callback; no reutilizar sesiones, usuarios ni clave de sesión |
| core/runtime/r2-storage.ts y r2-signing.ts: SigV4, bucket direcciones507-media, claves addresses/... | photo-storage-r2.js y photo-storage.js: SDK SigV4, claves mi-contacto/UUID/UUID.webp | Reutilizar cuenta y bucket por opción explícita; conservar adaptador Node compatible y no trasladar rutas/types Bun ni permisos de direcciones |
| core/runtime/account-email.ts: Resend con EMAIL_FROM y RESEND_API_KEY | auth-email-transport.js y receipt-resend.js | Reutilizar la cuenta y dominio verificado mail.direcciones507.com, con remitente específico Mi Contacto y plantillas propias |

No se reconstruyen OAuth, almacenamiento ni correo. Se aprovechan los adaptadores existentes de Mi Contacto y su compatibilidad con los mismos servicios ya operativos; se eliminan las barreras artificiales que exigían otro bucket/dominio. No es necesario contratar otras cuentas.

## Aislamiento y configuración preparada en Railway Mi Contacto

- MC_EMAIL_FROM=mi-contacto@mail.direcciones507.com y MC_REUSE_DIRECCIONES_EMAIL=true. Solo se admite esa dirección del dominio existente; ventas u otros remitentes siguen bloqueados. Identidad visible Mi Contacto. MC_EMAIL_ISOLATED=true.
- MC_R2_BUCKET=direcciones507-media, MC_R2_REUSE_DIRECCIONES_BUCKET=true, MC_R2_ISOLATED=true. No hay listados de bucket ni operaciones sobre claves addresses/, countries/ o rutas arbitrarias; get/put/delete exigen mi-contacto/UUID/UUID.webp antes de llamar al proveedor.
- MC_R2_MIGRATE_LOCAL=true conserva las fotos existentes al cambiar a R2: recuperación desde el volumen previo y copia al destino, sin borrar el original. El reemplazo usa el destino nuevo; retirada definitiva limpia ambos mediante la cola existente. Fallos de copia no eliminan originales.
- MC_STORAGE sigue local hasta obtener y probar credenciales R2. Google y envíos reales siguen apagados hasta completar configuración segura. No se activan proveedores por poner únicamente estas banderas.

## Únicas acciones privadas pendientes

1. En la aplicación Google existente, añadir sin borrar las URLs actuales: https://mi-contacto-acceptance-acceptance.up.railway.app/auth/google/callback . Mantener los usuarios de prueba permitidos y revisar que sus condiciones admiten el servicio. No se cambió su pantalla de consentimiento ni la de Direcciones507.
2. Trasladar privadamente los valores ya existentes a Railway Mi Contacto, sin Git ni chat: AD507_GOOGLE_CLIENT_ID → MC_GOOGLE_CLIENT_ID; AD507_GOOGLE_CLIENT_SECRET → MC_GOOGLE_CLIENT_SECRET; R2_ACCOUNT_ID → MC_R2_ACCOUNT_ID; R2_ACCESS_KEY_ID → MC_R2_ACCESS_KEY_ID; R2_SECRET_ACCESS_KEY → MC_R2_SECRET_ACCESS_KEY; RESEND_API_KEY → MC_RESEND_API_KEY. Usar permisos limitados al bucket/dominio existente cuando los tokens lo permitan. No copiar DATABASE_URL, AD507_SESSION_SECRET ni datos/tablas.
3. Indicar destinatario autorizado de las pruebas en MC_AUTH_EMAIL_RECIPIENTS y MC_EMAIL_TEST_RECIPIENTS; después habilitar transporte y ejecutar las pruebas reales.

El conector Railway confirmó valuesRedacted=true: devuelve nombres, no valores. Por ello el agente no puede trasladar los secretos entre los dos proyectos con las capacidades disponibles. No se han pedido cuentas nuevas ni se han leído/expuesto secretos. No se ha cambiado la configuración de Direcciones507. Si se habilita un mecanismo seguro de transferencia, esta segunda acción puede automatizarse sin solicitar los valores por conversación.

## Comprobaciones y estado de las pruebas reales

176 pruebas locales aprobadas, cero fallidas/omitidas. Incluyen rechazo de remitente/bucket ajeno, autorización explícita del existente, bloqueo de todas las operaciones fuera del espacio Mi Contacto, copia sin perder originales y fallo del proveedor conservando datos. Los clientes de proveedor usados por estas pruebas son sintéticos.

Las pruebas reales de Google, R2 y entrega de correo no pueden ejecutarse sin los valores privados y el callback registrado. No se certifican como realizadas. El inventario de Resend confirma el dominio ya verificado; no fue necesario crear otro dominio ni modificar DNS.

Ruta preparada para terminar: conectar valores privados → probar OAuth/identidad única y logout → probePhotos sobre dos imágenes técnicas del espacio Mi Contacto → probar migración de fotos previas y marca/permisos → enviar correo a destinatario autorizado y verificar recepción. Mantener Yappy y dominio definitivo pendientes.

Sin ampliación de recursos; ventana original de 48 horas conservada. Factura/crédito no visibles, no se promete costo cero de consumo. Reutilizar cuenta/bucket/comercio no implica mezclar datos ni sesiones.

## Verificación del despliegue

Código 6f74acf9600ee5df780bcb92a8445941e6142384 desplegado con SUCCESS, despliegue 1a464ddb-9b07-48b6-8ac1-398e175ad26d. Readiness HTTP 200, acceso privado ADMIN, CSRF, origen externo y logout reales aprobados sin cambiar datos. OAuth y correo siguen deshabilitados y almacenamiento local conservado mientras faltan los valores privados. Direcciones507 conserva deployment 2a45bbef-4546-4ea5-911d-8009b72963ce SUCCESS, main y sin cambios pendientes. Evidencias en evidence/provider-reuse-20261105.

CI exacto SUCCESS: https://github.com/direcciones507/mi-contacto/actions/runs/42132276508 . Regresión, PostgreSQL nativo con concurrencia/reinicio/restauración y seis recorridos de navegador aprobados. Los proveedores externos siguen sintéticos en el CI.
