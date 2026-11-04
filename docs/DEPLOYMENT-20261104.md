> Actualización de fase final: ver [REAL-INTEGRATIONS-20261104.md](REAL-INTEGRATIONS-20261104.md) y [ACCEPTANCE-REAL-20261104.md](ACCEPTANCE-REAL-20261104.md). El arranque exige migraciones 001–012 y sus hashes, y revisión legal aprobada explícitamente para producción. El staging autorizado puede mostrar los textos en borrador durante pruebas; no los declara aprobados. Para un dominio de pruebas controlado se requiere `MC_DEPLOYMENT_STAGE=staging`; los dominios aceptados son `mi-contacto-*.up.railway.app`, `staging.micontacto.online` o `pruebas.micontacto.online`, siempre con HTTPS. El callback y QR apuntan al origen configurado de ese entorno.

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
| MC_DEPLOYMENT_STAGE | `staging` solo para el entorno de pruebas autorizado; producción conserva el dominio propio |
| MC_LEGAL_APPROVED | `true` únicamente tras aprobación humana de los textos y política propuesta |
| MC_LEGAL_CONTROLLER / MC_PRIVACY_CONTACT | Identidad y canal del responsable, obligatorios al arrancar |
| MC_RETENTION_NOTICE / MC_PROCESSING_NOTICE | Retención real aprobada y proveedores/países de tratamiento |
| MC_SESSION_SECRET | Secreto persistente de al menos 32 bytes; conservar entre reinicios |
| MC_GOOGLE_CLIENT_ID / MC_GOOGLE_CLIENT_SECRET | OAuth Google exclusivo; callback `${MC_ORIGIN}/auth/google/callback` |
| MC_STORAGE | `r2` o `local`; el servidor persistente rechaza almacenamiento en memoria |
| MC_R2_ACCOUNT_ID / MC_R2_ACCESS_KEY_ID / MC_R2_SECRET_ACCESS_KEY | Credenciales restringidas al bucket de Mi Contacto |
| MC_R2_BUCKET / MC_R2_ISOLATED | Bucket `mi-contacto-…` exclusivo; confirmación `true` |
| MC_PHOTO_ROOT | Alternativa local: directorio absoluto privado, modo 0700, volumen persistente |
| PORT / MC_BIND_HOST | Puerto y dirección de escucha; por defecto 3000; HTTPS escucha en 0.0.0.0 y HTTP local en 127.0.0.1 |

1. Crear únicamente recursos aislados previamente autorizados. Google requiere cliente web y consentimiento configurado. R2 debe ser privado; las imágenes pasan por rutas del servidor con comprobación de permisos, sin URLs públicas del bucket. No hace falta CORS de subida directa porque las fotos se envían al servidor.
2. Base nueva vacía: `npm run db:migrate:test`. Aplica 001–012 con registro de hashes, bloqueo de migración y transacción por versión. No hay migraciones automáticas al arrancar.
3. Base existente sin registro de migraciones: el ejecutor se detiene con `EXISTING_DATABASE_REQUIRES_REVIEWED_BASELINE`. Revisar historial/esquema y preparar baseline explícito antes de seguir; no marcar versiones como aplicadas a ciegas. 010 rechaza cuentas con varios perfiles sin borrar ni escoger uno automáticamente.
4. Cargar catálogo en la base aislada mediante `loadCatalog(pool)` de `scripts/load-catalog.mjs`; revisar cobertura y equivalencias por país antes de habilitar lanzamiento. GeoNames no equivale a validación territorial oficial.
5. `npm start`. Iniciar sesión real con Google; no existe contraseña ADMIN ni usuario de demostración público. En entorno aislado, una cuenta autenticada existente se promueve con `node scripts/admin-account.mjs UUID --isolated-test`.
6. Probar acceso Google, revocación y reinicio con el mismo secreto, PostgreSQL y almacenamiento. Ejecutar la guía del propietario. No hay checkout, cobros ni suscripciones activados.

## Respaldo y recuperación

Usar `pg_dump --format=custom --no-owner --no-acl` con conexión exclusiva inyectada de forma segura; no pasar secretos visibles en comandos. Respaldar también el volumen privado de fotos, o inventario/objetos R2, y custodiar configuración/secretos por separado. Cifrar y restringir permisos de los respaldos.

Restaurar con `pg_restore --exit-on-error --no-owner --no-acl` en **otra base vacía aislada** y restaurar fotos en otro destino privado. Verificar recuentos, relaciones, sesión, fichas, QR, fotos privadas y cola de eliminación antes de cualquier cambio de tráfico. No sobrescribir base ni fotos existentes. Las migraciones 010–012 requieren recuperación desde respaldo para retroceso; los rollback históricos 007–009 no deben aplicarse sobre el esquema nuevo.

Los archivos reemplazados/retirados se encolan dentro de la misma transacción que retira su referencia. El servidor reintenta la cola cada minuto; un fallo de COMMIT nunca provoca borrado inmediato de una foto potencialmente vigente. La eliminación definitiva necesita solicitud del titular y autorización ADMIN/CSRF; elimina perfil y relaciones, conserva solo hash del enlace para impedir reutilización y auditoría administrativa sin datos de la persona. La cuenta Google permanece para el acceso de su titular. La política de retención de backups y su tratamiento al restaurar requiere aprobación legal y operativa; no restaurar perfiles borrados al recuperar una copia antigua.

## Bloqueos de lanzamiento

Google real y R2 real sin credenciales dedicadas disponibles en esta sesión. PostgreSQL nativo/reinicio/concurrencia/pg_dump-restauración no ejecutados: binarios ausentes y gestor de paquetes bloqueado por permisos. Validación Android físico/Safari, revisión territorial nacional, identidad/canal de verificación fotográfica y textos legales finales pendientes. Las pruebas WASM, SDK simulado y Chromium no sustituyen esas validaciones. Railway, main y producción permanecen sin cambios.
