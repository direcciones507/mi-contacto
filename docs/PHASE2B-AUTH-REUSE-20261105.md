# Fase 2B — reutilización de autenticación, 5 noviembre 2026

Rama: `work/phase2b-auth-reuse-20261105`. Base: `ecd14fd`.
Código comprobado: `3083fb14fbadbd36cfddebb9b59c35b616ef225b`.
Origen comparado en lectura: `direcciones507/direcciones507@3576029d97e1d1699b6213451e7eee9a556e1590`.

## Reutilización y compatibilidad

Se compararon general-auth.ts, account-email.ts, google-auth.ts, user-panel.ts y las pruebas del mailer original con el destino.

| Origen | Resultado en Mi Contacto |
|---|---|
| createAccountMailer de core/runtime/account-email.ts | Portado a account-email.js; el adaptador existente lo utiliza como única ruta de envío para autenticación. Petición inyectable, Resend JSON, timeout de 10 segundos, rechazo de redirecciones y fallo cerrado. Se conserva idempotencia. |
| Lector de cookies de general-auth.ts | Portado a auth-cookies.js y conectado a auth-runtime.js. Rechaza duplicados y codificación inválida; utiliza exclusivamente nombres mc_session/mc_oauth. |
| Google con selección de cuenta, state en PostgreSQL y PKCE S256 | Se conserva la arquitectura equivalente existente y la validación adicional de JWT firmado, nonce, audiencia, emisor y expiración. No se sustituye por el adaptador antiguo basado solo en userinfo. |
| Registro, scrypt, tokens de 30 minutos y consumo único | Se mantiene email-auth.js, compatible conceptualmente y adaptado al esquema micontacto, sin trasladar datos del origen. |
| Recuperación y sesiones | Se conserva la transacción existente de restablecimiento/revocación y protección contra carrera con login. |
| Cambio de contraseña, vinculación explícita, abuso y CSRF | Se conservan las funcionalidades completas existentes en destino; no se fusionan identidades por coincidencia de correo. |
| Panel y experiencia de acceso | Se conserva la interfaz exclusiva Mi Contacto y sus flujos de correo; no se importa navegación de direcciones, pedidos ni países. |

No se copió literalmente el servidor completo: eso sustituiría las tablas, roles y sesiones por ad507, acoplaría correo a la configuración Google y alteraría la política de vinculación. Se reutilizaron los componentes compatibles y se conservó la implementación destino que ya funciona, conforme a la instrucción del propietario.

El nuevo mailer usa solo MC_RESEND_API_KEY y MC_EMAIL_FROM; ignora las variables sin prefijo del origen. El adaptador mantiene aislamiento, dominios propios permitidos y destinatarios autorizados en aceptación. Remitente, asunto y texto siguen identificándose como Mi Contacto. No se importaron webhooks ni secretos de otros proyectos.

## Pruebas comprobadas

[GitHub Actions 42070770154](https://github.com/direcciones507/mi-contacto/actions/runs/42070770154): SUCCESS sobre el código exacto 3083fb1.

- 191 pruebas de regresión PostgreSQL WASM aprobadas; cero fallidas y omitidas.
- 38 pruebas específicas con PostgreSQL nativo aprobadas; cero fallidas y omitidas. Incluyen migración, concurrencia, unicidad, conservación de cuenta/perfil/sesión, carrera login/restablecimiento, reinicio y pg_dump/pg_restore.
- Tres recorridos Chromium con PostgreSQL nativo: 390, 820 y 1440. Registro, verificación, acceso, recuperación, cambio, revocación y conservación de los cinco espacios de fotografías; sin desbordamiento ni errores JavaScript.
- Cuatro pruebas nuevas: aislamiento de variables, contrato Resend/fallo cerrado/idempotencia, identidad Mi Contacto en correos y cookies independientes/duplicadas/malformadas.

Los proveedores Google y correo son sintéticos en estas pruebas. PostgreSQL nativo y el navegador son reales en un runner aislado; ninguna prueba accedió a Railway ni acredita entrega de correo o acceso Google reales. No se presentan estos recorridos como pruebas en dispositivos físicos.

Evidencias guardadas en docs/evidence/phase2b-auth-reuse-20261105/: resumen y extracto verificable de logs, sin credenciales. El entorno local estuvo indisponible inicialmente; la validación se completó mediante GitHub Actions.

## Requisitos del propietario para integración real

1. Cliente OAuth Web exclusivo: MC_GOOGLE_CLIENT_ID, MC_GOOGLE_CLIENT_SECRET y callback exacto https://mi-contacto-acceptance-acceptance.up.railway.app/auth/google/callback. Si el cliente está en pruebas, autorizar la cuenta de prueba. No compartir secretos del origen.
2. Dominio propio mail.micontacto.online o micontacto.online verificado en el proveedor y DNS; clave exclusiva MC_RESEND_API_KEY, remitente MC_EMAIL_FROM del dominio verificado, MC_EMAIL_ISOLATED=true y MC_AUTH_EMAIL_ENABLED=true. En aceptación, MC_AUTH_EMAIL_RECIPIENTS con el destinatario autorizado. La consulta previa solo encontró dominios de otros proyectos; no se utilizaron.
3. Autorización posterior para configurar/desplegar el servicio existente y aplicar la migración 016 con respaldo previo. No se ejecutó ninguna de esas operaciones en esta entrega.
4. Verificar acceso Google y recepción real de verificación/restablecimiento, vinculación y conservación del perfil con la sesión del propietario y dispositivos físicos.

No enviar credenciales por chat ni guardarlas en Git. La reutilización está implementada y verificada con proveedores simulados; la integración real continúa pendiente.

## Conservación

Railway y PostgreSQL remotos no modificados; sin despliegues, servicios, recursos, pagos ni migraciones remotas. No se modificaron Direcciones507/LATAM, Empleos.pa ni otros proyectos.

Sin cambios en fotografías y eliminación física, perfiles, QR, directorio, moderación o planes. Fase 3 R2 real pendiente. Fase 4 Yappy Panamá y generador ADMIN pendiente: cada código USD 1.90, activa un día, caduca sin usar a los 365 días y es de un solo uso. Fase 5 pruebas finales y lanzamiento Panamá pendiente.
