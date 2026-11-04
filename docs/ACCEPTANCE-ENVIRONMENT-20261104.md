# Entorno real de aceptación — preparación, 4 noviembre 2026

## Infraestructura comprobada y propuesta concreta

Las pruebas aisladas ya pueden ejecutarse en **GitHub Actions Ubuntu 24.04, Node 24, PostgreSQL 16 nativo y Chromium**. Workflow propio, permisos `contents: read`, timeout 20 minutos, sin secretos de otros proyectos ni despliegues. Se limita a la rama `work/infrastructure-acceptance-20261104`; no afecta main. Publica resultados/capturas como artefactos durante siete días. También se prepara `docker/Dockerfile.acceptance` para reproducir la suite con PostgreSQL 15 nativo en un contenedor no root; ese contenedor no se ha construido en la sesión.

Para acceso del propietario, la propuesta es un **proyecto nuevo y exclusivo `mi-contacto-acceptance` en Railway**, un servicio Node y un PostgreSQL exclusivo, con hostname temporal `mi-contacto-…up.railway.app`. No requiere cambiar DNS de `micontacto.online`. Crear esos recursos y desplegar requiere autorización expresa del propietario; no se ha realizado. La creación utilizaría recursos facturados del plan existente; no se contrató plan ni recurso alguno.

Inventario Railway: ocho proyectos accesibles; ninguno con servicio/base de Mi Contacto. Dos proyectos vacíos no son recursos de cómputo ya aprovisionados ni implican autorización para reutilizarlos. No se leyeron secretos ni se cambiaron configuraciones de otros proyectos. Resend: solo hay remitentes verificados de Direcciones507 y Empleos.pa; no se reutilizan.

## Código y ejecución preparados

- `Dockerfile`: Node 24, dependencias de producción, usuario node, escucha `0.0.0.0`, sin migraciones automáticas.
- `railway.toml`: build Docker, `/health/ready`, reinicio limitado; archivo preparado, sin vinculación ni despliegue.
- `/health/live`: disponibilidad del proceso. `/health/ready`: consulta DB, errores genéricos sin datos privados. No certifica disponibilidad de Google/R2/correo.
- `.env.example` y `node scripts/acceptance-preflight.mjs`: variables y chequeo sin revelar valores; no sustituye conexión real. El archivo `.env` y volcados quedan fuera de git/build.
- `MC_ACCEPTANCE_MODE=true`: permite origen HTTPS de `pruebas.micontacto.online` o servicio `mi-contacto-…up.railway.app`. Se mantienen CSRF/origen exacto, cookies seguras y OAuth con callback del origen configurado. Otros proyectos/dominios siguen rechazados. URL/QR usan el origen del entorno y conservan ruta al mudar país. Producción mantiene dominio canónico sin el opt-in.
- Prueba R2: `node scripts/probe-r2.mjs --isolated-test` sube, recupera, reemplaza y borra exclusivamente un objeto aleatorio de prueba; intenta limpieza ante fallo. No lista ni purga objetos existentes. El éxito de esta sonda no certifica por sí solo que el bucket no esté publicado: verificar configuración privada en Cloudflare.
- Comprobantes: transporte Resend real preparado, HTTP con timeout, idempotencia, errores permanentes/transitorios y lista explícita de hasta diez destinatarios. Solo admite remitente `@mail.micontacto.online` o `@micontacto.online` y mensaje de prueba. `MC_EMAIL_TEST_ENABLED=false` por defecto; no se envió correo. El estado SENT representa aceptación por el proveedor, no entrega en bandeja. Rebotes/entrega real siguen sujetos a validación antes de habilitar uso comercial.

## Accesos exactos necesarios

| Integración | Acceso/configuración exclusivos pendientes |
|---|---|
| Railway aceptación | Autorización para crear proyecto/servicio/PostgreSQL y desplegar la rama aislada. Sin DNS ni producción comercial. |
| PostgreSQL de aceptación persistente | `MC_DATABASE_URL`, `MC_DATABASE_ISOLATED=true`, TLS válido y `MC_DATABASE_CA` si corresponde. No usar la base de otra plataforma. |
| Google | Cliente web, `MC_GOOGLE_CLIENT_ID`, `MC_GOOGLE_CLIENT_SECRET`, consentimiento y usuarios de prueba; origen autorizado y callback exacto `MC_ORIGIN/auth/google/callback`. |
| Cloudflare R2 | Cuenta, bucket privado `mi-contacto-…`, acceso de lectura/escritura limitado al bucket, `MC_R2_ACCOUNT_ID`, `MC_R2_ACCESS_KEY_ID`, `MC_R2_SECRET_ACCESS_KEY`, `MC_R2_BUCKET`, confirmación de aislamiento. |
| Yappy UAT | Comercio y secreto UAT de Mi Contacto, dominio temporal registrado y callback `MC_ORIGIN/api/payments/yappy/ipn`; número UAT autorizado. No se usan pagos ni claves de producción. |
| Correo de prueba | Dominio remitente exclusivo verificado y clave Resend restringida, `MC_EMAIL_FROM`, `MC_RESEND_API_KEY`, lista explícita `MC_EMAIL_TEST_RECIPIENTS`; DNS de correo requiere autorización aparte. |
| Sesión | `MC_SESSION_SECRET` generado en gestor de secretos y conservado en reinicios. Nunca compartir valores por documentos del repositorio. |

## Secuencia tras autorización y credenciales

1. Crear recursos exclusivos; mantener origen temporal, pagos reales imposibles y correo UAT desactivado.
2. Inyectar configuración desde el gestor seguro y ejecutar preflight. Configurar TLS verificable; no desactivar verificación por errores de certificados.
3. Aplicar `node scripts/migrate.mjs --isolated-test` una sola vez contra la base nueva. Verificar registro de hashes y versiones 001–012. Importar catálogo conservando licencia y condición de revisión humana.
4. Desplegar el contenedor del servicio; verificar HTTPS, health, arranque con versión correcta y ausencia de secretos en logs. No otorgar ADMIN desde el navegador. Tras login Google real, promover una cuenta existente con el procedimiento aislado documentado.
5. Verificar Google real y logout/revocación; ejecutar sonda R2 y recorrido de fotos a través de la app. Reiniciar servicio y comprobar persistencia de cuenta, perfil, fotos, enlace y QR en la base de aceptación.
6. Configurar Yappy UAT y remitente/destinatario acordado. Habilitar únicamente flags de prueba y comprobar confirmación firmada, saldo elegible/en pausa, reintentos y entrega del comprobante. La interfaz y firma sintéticas no equivalen al componente ni al comercio reales.
7. Entregar URL temporal al propietario y seguir `OWNER-ACCEPTANCE-20261104.md` desde Android físico, tableta y computadora. No hay todavía URL pública disponible.

La aprobación de recursos de aceptación no autoriza cobros reales, DNS del sitio público ni lanzamiento comercial.
