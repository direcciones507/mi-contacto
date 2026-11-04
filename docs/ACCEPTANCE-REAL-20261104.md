# Ejecución real y aceptación del propietario

## Acceso y límites previos

No ejecutar contra producción ni contra servicios de Direcciones507/LATAM/Empleos.pa/LeveIA. Usar bases dedicadas y vacías, un bucket privado exclusivo y un cliente Google propio. Cualquier creación, despliegue o reinicio en Railway requiere autorización del propietario y presupuesto si genera gastos. Los fixtures no deben convertirse en datos de producción.

## 1. PostgreSQL nativo y restauración

Inyectar por un gestor de variables seguro:

- `MC_TEST_DATABASE_URL`: base vacía `mi_contacto_test_source`.
- `MC_TEST_RESTORE_DATABASE_URL`: otra base vacía `mi_contacto_test_restore`.
- `MC_TEST_DATABASE_ISOLATED=true`.
- `MC_TEST_DATABASE_TLS=true` para hosts remotos; `MC_TEST_DATABASE_CA` si requiere CA propia.
- `MC_PG_BIN`: directorio absoluto con pg_dump/pg_restore compatibles, si no están en PATH.
- `MC_PG_LIBRARY_PATH`: directorio absoluto de bibliotecas privadas si se usan binarios extraídos.

En esta sesión los clientes preparados están en `/workspace/scratch/4e8d93c603ae/pg-native-clients/extracted/usr/lib/postgresql/18/bin` y las bibliotecas en `/workspace/scratch/4e8d93c603ae/pg-native-clients/extracted/usr/lib/x86_64-linux-gnu`. Es una ubicación temporal; procedencia y SHA256 están guardados en las evidencias. En otra sesión preparar clientes compatibles desde la distribución oficial.

Ejecutar `npm run verify:real -- --run-isolated`. El código se detiene antes de escribir si alguna base contiene tablas. Aplica migraciones 001–012, prueba diez altas simultáneas de una cuenta con un único perfil resultante, integridad referencial, rollback y reapertura de conexiones. Genera un respaldo sintético temporal, restaura en la segunda base y compara tablas/filas; elimina únicamente los archivos temporales que creó. Conserva las bases de pruebas y sus fixtures. El código no reinicia el servidor remoto.

Para la prueba completa de reinicio: con autorización explícita en el entorno exclusivo, reiniciar la aplicación y luego el servidor PostgreSQL; comprobar cuenta/perfil/consentimientos/URL/QR/fotos/saldo. Registrar quién lo ejecutó, entorno, commit y resultado. Reabrir un pool no equivale a reiniciar PostgreSQL. En un host no-root con binarios nativos completos puede usarse `node scripts/native-validation.mjs --run --pg-bin /ruta/absoluta/bin --evidence /ruta/absoluta/nueva`, que crea su propio clúster descartable.

## 2. R2 real

Inyectar `MC_R2_ACCOUNT_ID`, `MC_R2_ACCESS_KEY_ID`, `MC_R2_SECRET_ACCESS_KEY`, `MC_R2_BUCKET` y `MC_R2_ISOLATED=true`. Bucket privado exclusivo cuyo nombre empiece por `mi-contacto-`; claves restringidas a ese bucket. Revisar que no tenga acceso público por r2.dev ni dominios personalizados.

El mismo comando de verificación sube una imagen sintética a una clave aleatoria propia, comprueba bytes, reabre el cliente, elimina ese objeto y confirma su ausencia. No toca archivos anteriores. Esa prueba no sustituye la revisión de dominios públicos ni las comprobaciones de autorización desde la aplicación. Repetir principal, galería, reemplazo y eliminación ADMIN desde la interfaz con R2 configurado; comprobar persistencia después de reiniciar la aplicación.

## 3. Despliegue exclusivo de pruebas y Google real

Solo después de autorización para ese despliegue:

1. Desplegar la rama derivada en el servicio exclusivo; configurar `MC_DEPLOYMENT_STAGE=staging` y `MC_ORIGIN` con un origen HTTPS controlado (`mi-contacto-*.up.railway.app`, `staging.micontacto.online` o `pruebas.micontacto.online`) y verificar `/health/ready`.
2. Usar los datos exclusivos y el secreto persistente indicados en `DEPLOYMENT-20261104.md`. El servidor no aplica migraciones al arrancar y comprueba todos sus hashes.
3. Configurar Google OAuth web: origen y callback exacto `${MC_ORIGIN}/auth/google/callback`; cargar `MC_GOOGLE_CLIENT_ID` y `MC_GOOGLE_CLIENT_SECRET` por variables seguras. Configurar consentimiento y usuarios de prueba mientras corresponda. No registrar otro dominio de proyecto.
4. Revisar `LEGAL-DRAFT-20261104.md`. El responsable aprueba los textos y completa `MC_LEGAL_CONTROLLER`, `MC_PRIVACY_CONTACT`, `MC_RETENTION_NOTICE`, `MC_PROCESSING_NOTICE`; solamente entonces habilitar `MC_LEGAL_APPROVED=true`. El staging autorizado puede probarse con textos marcados como borrador; esa excepción no habilita el arranque productivo ni equivale a aprobación legal. Esta variable no acredita por sí misma una revisión profesional.
5. Entrar con una cuenta Google real del propietario, aceptar términos/privacidad/edad, crear un perfil descartable y rechazar una segunda alta en la misma cuenta. Cerrar y volver a entrar: debe recuperar ese perfil.
6. Un operador autorizado promueve una cuenta ya autenticada a ADMIN en la base de pruebas mediante el procedimiento explícito, sin contraseñas por defecto ni login de prueba público.

## 4. Recorrido del propietario

En celular/tableta Android y computadora: Google → aceptación → perfil → foto → país/región/municipio/localidad → pin de Maps → solicitud de publicación → revisión ADMIN → directorio con Destacado elegible → compartir → descargar y abrir QR → editar y cambiar país → confirmar URL/QR estables → ocultar/mostrar → solicitar eliminación en perfil descartable → autorizar ADMIN → verificar retirada de perfil, QR y fotos y vaciado de cola.

La activación de Destacados en fixtures es sintética y no se ofrece como comprobación comercial real. No habilitar pagos ni otorgar activaciones comerciales sin autorización específica. Probar también contactos no consentidos, fotos privadas, CSRF, acceso ADMIN desde otra cuenta, cierres de sesión, rechazos de formato/tamaño y reinicios. Registrar errores reales sin publicar credenciales o datos personales en GitHub.

Criterio final: servicios y respaldo reales comprobados, textos revisados, anomalías territoriales atendidas según alcance aprobado y aceptación del propietario. El estado de `verify:real` no sustituye esa aprobación.
