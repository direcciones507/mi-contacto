# Actualización vigente — infraestructura de aceptación

Continuación: [ACCEPTANCE-ENVIRONMENT-20261104.md](ACCEPTANCE-ENVIRONMENT-20261104.md). PostgreSQL nativo y Chromium contra PostgreSQL ya fueron ejecutados y aprobados en un runner descartable de GitHub Actions; ver [informe](INFRASTRUCTURE-ACCEPTANCE-20261104.md). Esto sustituye los bloqueos locales históricos de esos dos componentes. No equivale a despliegue persistente ni a Google/R2/pagos/correo reales.

El transporte Resend ya está conectado mediante opt-in exclusivo de prueba y lista de destinatarios. No se habilitó ni se envió correo. Configuración y acceso externo siguen pendientes. La pantalla de checkout existe; el componente Yappy externo debe validarse con UAT real.

---

# Preparación de despliegue — 4 noviembre 2026

No se ha desplegado. No ejecutar estos pasos contra producción sin autorización posterior. No conectar servicios ni secretos de otros proyectos.

## Entorno aislado

Node >=24, PostgreSQL nativo independiente, bucket R2 exclusivo privado o volumen privado persistente. Instalar con `npm ci`.

Variables exclusivas (inyectar mediante gestor de secretos; nunca subir archivos con valores):

| Variable | Uso |
|---|---|
| MC_DATABASE_URL | URL PostgreSQL exclusiva |
| MC_DATABASE_ISOLATED | `true`, confirmación de base exclusiva |
| MC_DATABASE_TLS | `true` para hosts remotos; verificación de certificado obligatoria |
| MC_DATABASE_CA | CA opcional para certificado privado |
| MC_ORIGIN | `https://micontacto.online`, o HTTP loopback para pruebas |
| MC_SESSION_SECRET | Secreto persistente de al menos 32 bytes; conservar entre reinicios |
| MC_GOOGLE_CLIENT_ID / MC_GOOGLE_CLIENT_SECRET | OAuth Google exclusivo; callback `${MC_ORIGIN}/auth/google/callback` |
| MC_STORAGE | `r2` o `local`; el servidor persistente rechaza almacenamiento en memoria |
| MC_R2_ACCOUNT_ID / MC_R2_ACCESS_KEY_ID / MC_R2_SECRET_ACCESS_KEY | Credenciales restringidas al bucket de Mi Contacto |
| MC_R2_BUCKET / MC_R2_ISOLATED | Bucket `mi-contacto-…` exclusivo; confirmación `true` |
| MC_PHOTO_ROOT | Alternativa local: directorio absoluto privado, modo 0700, volumen persistente |
| PORT / MC_BIND_HOST | Puerto y dirección de escucha; por defecto 3000 y 127.0.0.1 |

1. Crear únicamente recursos aislados previamente autorizados. Google requiere cliente web y consentimiento configurado. R2 debe ser privado; las imágenes pasan por rutas del servidor con comprobación de permisos, sin URLs públicas del bucket. No hace falta CORS de subida directa porque las fotos se envían al servidor.
2. Base nueva vacía: `npm run db:migrate:test`. Aplica 001–012 con registro de hashes, bloqueo de migración y transacción por versión. No hay migraciones automáticas al arrancar.
3. Base existente sin registro de migraciones: el ejecutor se detiene con `EXISTING_DATABASE_REQUIRES_REVIEWED_BASELINE`. Revisar historial/esquema y preparar baseline explícito antes de seguir; no marcar versiones como aplicadas a ciegas. 010 rechaza cuentas con varios perfiles sin borrar ni escoger uno automáticamente.
4. Cargar catálogo en la base aislada mediante `loadCatalog(pool)` de `scripts/load-catalog.mjs`; revisar cobertura y equivalencias por país antes de habilitar lanzamiento. GeoNames no equivale a validación territorial oficial.
5. `npm start`. Iniciar sesión real con Google; no existe contraseña ADMIN ni usuario de demostración público. En entorno aislado, una cuenta autenticada existente se promueve con `node scripts/admin-account.mjs UUID --isolated-test`.
6. Probar acceso Google, revocación y reinicio con el mismo secreto, PostgreSQL y almacenamiento. Ejecutar la guía del propietario. No hay checkout, cobros ni suscripciones activados.

## Respaldo y recuperación

Usar `pg_dump --format=custom --no-owner --no-acl` con conexión exclusiva inyectada de forma segura; no pasar secretos visibles en comandos. Respaldar también el volumen privado de fotos, o inventario/objetos R2, y custodiar configuración/secretos por separado. Cifrar y restringir permisos de los respaldos.

Restaurar con `pg_restore --exit-on-error --no-owner --no-acl` en **otra base vacía aislada** y restaurar fotos en otro destino privado. Verificar recuentos, relaciones, sesión, fichas, QR, fotos privadas y cola de eliminación antes de cualquier cambio de tráfico. No sobrescribir base ni fotos existentes. Las migraciones 010–011 requieren recuperación desde respaldo para retroceso; los rollback históricos 007–009 no deben aplicarse sobre el esquema nuevo.

Los archivos reemplazados/retirados se encolan dentro de la misma transacción que retira su referencia. El servidor reintenta la cola cada minuto; un fallo de COMMIT nunca provoca borrado inmediato de una foto potencialmente vigente. La eliminación definitiva necesita solicitud del titular y autorización ADMIN/CSRF; elimina perfil y relaciones, conserva solo hash del enlace para impedir reutilización y auditoría administrativa sin datos de la persona. La cuenta Google permanece para el acceso de su titular. La política de retención de backups y su tratamiento al restaurar requiere aprobación legal y operativa; no restaurar perfiles borrados al recuperar una copia antigua.

## Bloqueos de lanzamiento

Google real y R2 real sin credenciales dedicadas disponibles en esta sesión. PostgreSQL nativo/reinicio/concurrencia/pg_dump-restauración no ejecutados: binarios ausentes y gestor de paquetes bloqueado por permisos. Validación Android físico/Safari, revisión territorial nacional, identidad/canal de verificación fotográfica y textos legales finales pendientes. Las pruebas WASM, SDK simulado y Chromium no sustituyen esas validaciones. Railway, main y producción permanecen sin cambios.


## Continuación del sprint final — sandbox

La migración 012 crea órdenes/comprobantes **solo de pruebas**. El arranque exige 012 registrada. El modo normal continúa sin checkout habilitado. Para preparar un entorno Yappy UAT independiente, configurar explícitamente `MC_YAPPY_SANDBOX_ENABLED=true`, `MC_YAPPY_ISOLATED=true`, `MC_YAPPY_MERCHANT_ID` y `MC_YAPPY_SECRET` exclusivos. El dominio/callback se derivan de `MC_ORIGIN`; deben estar registrados en UAT. No hay host de pagos de producción en el adaptador. El panel muestra «Probar pago Destacado» únicamente al habilitar UAT. La pantalla privada `/pago-prueba/:profileId` permite elegir paquete/correo, crear orden, iniciar el componente UAT y consultar estado. Acceso/HTML/rutas comprobados por API; el recorrido visual y el componente externo requieren validación en navegador habilitado.

API autenticada/CSRF: preparar paquete con `POST /api/profiles/:id/feature` (`days`); crear orden con `POST /api/profiles/:id/checkout` (`termId`, `key` estable, `email`); iniciar **una sola vez** con `POST /api/payments/:id/initialize` (`alias` UAT); consultar `GET /api/payments/:id`. La única confirmación es `GET /api/payments/yappy/ipn` con firma del proveedor. Nunca introducir secretos en el navegador ni simular un pago cambiando el estado desde el cliente. Una inicialización incierta requiere conciliación del operador; no borrar su marcador ni crear otra orden para intentar el cargo de nuevo.

Comprobantes: `receiptWorker(pool, transport)` consume cola durable; envío desactivado sin transporte explícito. La integración de correo real, dominio autenticado y manejo de rebotes siguen pendientes. Se conserva lease de cinco minutos antes de llamar al transporte, clave estable por orden y revisión manual antes de agotar la ventana de idempotencia. No hay envío real programado en el servidor. Los mensajes actuales llevan COMPROBANTE DE PRUEBA y no son facturas fiscales.

La eliminación definitiva también retira las órdenes de prueba y sus destinatarios. No se ha definido ni activado política de retención de documentos fiscales reales.
