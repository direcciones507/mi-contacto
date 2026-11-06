# Mi Contacto: revisión visual, ADMIN y despliegue privado

## Alcance y código

Rama: `work/visual-admin-close-20261106`. Código probado: `20cce3eaade0bbb01a71fc0cbca9bc45e9ee9e87`. Base: `864028c` de la rama móvil, descendiente directo de la rama comercial. Conserva `0182f88`: tarifas aprobadas, códigos de un día a USD 1.90, lotes, venta manual sin pago en línea, canje único, historial y protecciones.

## Cambios implementados

- Menú móvil conservado y probado: enlaces, toque exterior y Escape. Tarjeta de ejemplo: 360 px en celular de 390, 680 px en tableta de 820; sin desbordamiento.
- `/mi-perfil` anónimo lleva directamente a la tarjeta de acceso. Google aparece solo si existe configuración; correo se habilita según transporte realmente disponible. Registro y recuperación en la misma tarjeta; controles privados de pruebas permanecen separados.
- `/admin` exige ADMIN activo; `/acceso-admin` es el acceso independiente, sin enlaces públicos. OAuth guarda la intención ADMIN y comprueba el rol en la base antes de retornar al panel. No cambia contraseña ni hash del propietario.
- Guardar datos/foto abre la ficha completa en una vista privada exclusiva del titular. Confirmar solicita publicación; volver permite corregir. Guardar una foto por separado ya no solicita publicación automáticamente. Conserva marca de agua, reemplazo, eliminación y galería condicionada al Destacado.
- ADMIN busca por nombre, enlace/identificador, país, localidad y estado. Contador de denuncias pendientes y de objetivo de contacto superado.
- Investigación con estado, fecha del contacto, plazo opcional comunicado y notas mínimas; control de versión concurrente. WhatsApp abre únicamente el número válido aportado por el titular; no envía mensajes. No se almacenan videos privados.
- Una denuncia no sanciona. ADMIN decide con motivo y auditoría: descartar, corregir, ocultar, suspender, bloquear, retirar foto o retirar perfil. La retirada de una foto investigada conserva el original como evidencia privada; el reemplazo ordinario mantiene la limpieza existente.
- Cuenta bloqueada/suspendida puede autenticarse con su contraseña verificada para consultar y apelar, sin habilitar edición ni compras. Aceptar apelación devuelve a borrador, no publica automáticamente. Protege ADMIN y evita autosanción.
- Auditoría unifica decisiones de moderación y eventos comerciales sin exponer secretos de códigos.

## Archivos

- Interfaz: `views.js`, `dashboard.js`, `email-auth-view.js`, `email-auth-client.js`, `admin-moderation-client.js`, `styles.css`, `runtime.css` y texto privado en `acceptance-access.js`.
- Servidor: `application.js`, `auth-runtime.js`, `email-auth.js`, `moderation.js`, `photo-runtime.js`.
- Datos y arranque opcional: `db/017_moderation_contact.sql`, `ops/private-start.mjs`, `ops/railway-acceptance.toml`, `.dockerignore`.
- Verificación: `.github/workflows/final-acceptance.yml`; scripts `mobile-access-browser`, `moderation-admin-browser`, `native-private-upgrade`, `native-auth-validation`, `visual-forms-browser`, `email-auth-browser`, `browser-validation`; pruebas `moderation-investigation`, `acceptance-access`, `protection-moderation`, `unification-consent-territory`.
- Entrega: checklist maestro, este informe y resultados JSON de evidencia. El código de migración 016 y el runtime comercial se conservan sin cambios.

## Reutilización de Direcciones507

Revisión de solo lectura de `core/runtime/address-edit-ui.ts` e `image-processing.ts`: selección JPEG/PNG/WebP, encuadre, normalización y eliminación de metadatos. Mi Contacto conserva sus componentes compatibles, su límite más estricto de 5 MB y su almacenamiento aislado; no se modifica Direcciones507.

## Alternativa segura al bloqueo de CLI

No se repite el login ni la conexión rechazada. El Dockerfile existente ya dispone de Node 24, cliente PostgreSQL 18 y ejecución con usuario `node`; se reutiliza. No hace falta otro servicio ni otra base.

Configuración opcional `ops/railway-acceptance.toml`: construir el Dockerfile existente y arrancar `ops/private-start.mjs` mediante el entrypoint existente, con el volumen actual montado. No usar pre-deploy para guardar el respaldo: el volumen persistente se necesita durante el arranque.

La puerta requiere aprobación explícita `MC_PRIVATE_UPGRADE_APPROVED=016-017`, aceptación privada, origen oficial, Yappy desactivado y ventana de pruebas vigente. No modifica ni extiende la ventana. Pasos:

1. Validar ledger y checksums; aceptar exclusivamente pendientes 016/017.
2. Resumir cuentas/perfiles/fotos, paquetes preparados y órdenes por estado, sin datos personales. Una inicialización de proveedor incierta bloquea el proceso para revisión; las órdenes normales pendientes se conservan con su importe original.
3. Comprobar espacio disponible en el volumen actual; si falta, detener sin ampliarlo.
4. `pg_dump` completo en formato custom, archivo privado 0600 y directorio 0700. Verificar catálogo, leer todas las secciones con `pg_restore --file /dev/null` y guardar SHA-256. No ejecutar restauración sobre la base existente.
5. Transacción con bloqueo de migración y de tablas; comparar huellas y conteos de todas las columnas históricas de todas las tablas previas. Aplicar cada migración pendiente una sola vez. Revertir la transacción si cualquier validación falla.
6. Guardar comprobante privado del respaldo verificado en el volumen. Reinicios posteriores verifican SHA y ledger sin repetir DDL. Arrancar el servidor normal solo después de superar la puerta, con el bootstrap antiguo deshabilitado únicamente para ese proceso: no volver a migrar, cargar catálogos ni recrear cuentas durante el arranque. El bootstrap previo esperaba 15 migraciones y no es compatible con 17.

El inicio controlado puede interrumpir brevemente el acceso al sustituir el proceso Node; si falla la puerta, la nueva aplicación no inicia. No se promete reversión automática a un runtime incompatible tras cambiar el esquema. No se ejecutan restauraciones destructivas.

016 conserva tarifas/pedidos históricos. 017 agrega seguimiento de investigaciones, estado de cuenta BLOCKED e intención de retorno ADMIN en OAuth. No borra cuentas, perfiles, fotos, códigos ni compras. La prueba nativa usa una base desechable para restaurar el respaldo y comprobar la preservación; no autoriza crear otra base en Railway.

## Pruebas y límites

[GitHub Actions 42169206047](https://github.com/direcciones507/mi-contacto/actions/runs/42169206047): SUCCESS para el commit `20cce3e`.

- Regresión: 192 aprobadas, 0 fallidas, 0 omitidas.
- PostgreSQL 16 nativo desechable: 60 aprobadas, 0 fallidas, 0 omitidas. Respaldo completo, restauración real en base desechable, conservación de orden pendiente con importe histórico 169 centavos y detención por fallo de respaldo.
- 15 recorridos de navegador sobre PostgreSQL nativo: cinco suites por tres anchos (390, 820 y 1440), todas aprobadas. Fotos/consentimientos/códigos/moderación, correo con transporte sintético, menú/acceso, investigación/bloqueo/apelación y flujo integral. Sin errores JavaScript ni desbordamientos en los recorridos que los comprueban.
- Dockerfile existente construido correctamente: Node 24, `pg_dump 18.6`, carga de Sharp y del módulo de actualización. No se despliega la imagen desde CI.
- Evidencias: artefacto `mi-contacto-integral-acceptance`, ID `13480299017`, SHA-256 `bd703aa3e736d8c47369a41f1fe3df3c641500ef133aa888364d09cee3972f55`, disponible hasta 13 noviembre 2026. Resumen durable: `docs/evidence/visual-admin-20261106/verified-results.json`.
- Fallos encontrados y corregidos: etiqueta del selector de investigación, zona horaria del dato sintético, expectativa de texto privado, saldo obligatorio del pedido histórico sintético y compatibilidad del bootstrap antiguo con 17 migraciones. La ejecución final no tiene fallos. Las ejecuciones anteriores fallidas/canceladas permanecen como historial, no cuentan como aprobación.
 Scripts: regresión completa; validación PostgreSQL nativa; restauración real de respaldo en cluster desechable; recorridos visuales/fotos/códigos, correo con transporte sintético, menú/acceso, investigación/apelación y recorrido integral a 390/820/1440 px. Los pagos usan pruebas firmadas sintéticas, no cobros reales. Son navegadores emulados, no dispositivos físicos.

## Entorno real y bloqueos

Railway existente, sin cambios ni recursos nuevos: proyecto `7d9a7fb0-df2f-487c-8885-d093e1a9c9de`, acceptance `4a65150e-8ee4-4d22-917e-3ae3de82a380`, Node `11c5eb89-00ce-4928-bd4e-e2ce0c50d22a`.

Despliegue observado: `d40d7596-9198-49a0-a8ad-03bba5e8e540`, SUCCESS, rama `work/official-origin-20261106`, commit `33cbcdc`. Sin cambios pendientes. El navegador real confirma que «Crear mi perfil gratis» abre `/mi-perfil` y ofrece el enlace al acceso; todavía muestra el enlace ADMIN antiguo. Esta revisión corrige ese comportamiento, pero NO está desplegada.

Migración 016 y respaldo de la base Railway: no ejecutados. La nueva revisión requiere autorización expresa del commit consolidado y de 017 además de 016; la autorización anterior para `0182f88` no se reutiliza.

Variables observadas por nombre, sin leer valores: Google está definido. Faltan `MC_RESEND_API_KEY`, habilitación/destinatarios de correo de prueba y credenciales R2 `MC_R2_ACCOUNT_ID`, `MC_R2_ACCESS_KEY_ID`, `MC_R2_SECRET_ACCESS_KEY`. Conserva proveedor/bucket/remitente existentes preparados, fotos locales y datos. No se certifica inicio Google real, entrega Resend ni operaciones R2 reales sin completarlos y probarlos.

No se crean servicios ni se amplían recursos. El consumo de los recursos existentes sigue siendo facturable; no se confirma una factura ni un costo cero. La ventana aprobada termina el 6 de noviembre de 2026 a las 19:02:48 UTC; no se asume extensión.

## Siguiente paso

Obtener autorización del commit final probado para el despliegue privado con respaldo/preflight y 016/017, manteniendo credenciales, datos y cobros desactivados. Después: verificar Mi perfil, fotos, códigos/WhatsApp, canje y ADMIN en `https://micontacto.online`, y completar Google/Resend/R2 con los accesos existentes. Apertura pública, pagos y aprobación legal quedan fuera de esta autorización.
