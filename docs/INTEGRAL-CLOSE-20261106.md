# Entrega integral preparada de Mi Contacto

Código validado: `0182f880dd4a054843445f09cc3d6bd9df99b120`.

Rama: `work/integral-close-20261106`, derivada de `33cbcdc`, conserva `e411484` y todos los cambios anteriores. La versión observada en Railway sigue siendo `33cbcdc`, despliegue `d40d7596-9198-49a0-a8ad-03bba5e8e540`, SUCCESS. Esta entrega no está desplegada: el encargo exige autorización expresa antes de publicar.

## Funciones y correcciones

- Mi perfil: datos y ubicación → descripción → foto → consentimientos → Guardar y publicar → Destacar. La foto puede seleccionarse antes de guardar. El borrador se crea internamente, se guardan datos y foto y se solicita revisión; no se presenta como publicado antes de la aprobación ADMIN. Un solo perfil por cuenta y URL/QR estables al mudarse.
- Una fotografía gratuita; cuatro adicionales solo con Destacado vigente. Se conservaron vista previa, reemplazo, retirada, marca de agua y moderación. La desaparición de casillas por vencimiento no borra archivos.
- Sesión compacta; cerrar todas las sesiones, cambiar contraseña y vincular identidades quedan en Seguridad y acceso. Tarjeta de Google/correo única, mostrar contraseña, registro y recuperación. Ayuda propia de Mi Contacto.
- Cuenta privada de aceptación: puede vincular Google sin perder perfil ni ADMIN después de verificar correo y contraseña, conservando la sesión de origen y comprobando OAuth. Solo admite sustituir el identificador temporal exacto del titular autorizado mientras esté vigente; nunca reemplaza otra identidad Google ni fusiona cuentas. Operación auditada.
- ADMIN: usuarios, perfiles, compras, generador, inventario, reservas, ventas manuales, anulaciones, códigos utilizados, lotes, copia, exportación de registros visibles e historial paginado. Denuncias, moderación, apelaciones, verificación y eliminación autorizada conservadas.
- Códigos: 1–100 por operación, un día por código, USD 1.90/unidad. No vencen almacenados. Las vigencias consecutivas mantienen 1/5/10/15/20/25/30 días y sus tarifas aprobadas. No se creó otra duración para códigos.
- WhatsApp: ADMIN genera, reserva o selecciona, registra cliente y pago recibido, copia y entrega personalmente. No depende de tarjeta ni Yappy. Generar y vender no activa: solo el canje consume el código. Un saldo todavía activo/pausado impide consumir otro. Un reintento del mismo canje no concede tiempo adicional.
- Compra en línea preparada para Yappy TEST: cantidades 1/2/3 y mayores, importes de servidor, inicialización, confirmación firmada usando el adaptador existente, entrega única tras pago confirmado, rechazo/cancelación sin códigos, inventario del comprador y comprobante con reintento e idempotencia. No habilita Yappy UAT ni Live por sí misma.

## Migración y recuperación

`016_commercial_codes.sql` agrega inventario, pedidos y eventos. Corrige el CHECK de tarifas que todavía rechazaba los importes nuevos; acepta históricos sin modificar sus filas. Las preparaciones nuevas seleccionan el precio vigente; las órdenes ya creadas conservan el importe contratado, incluso en callbacks repetidos. No cambia migraciones 001–015 ni sus hashes. Conserva datos y fotos. Al eliminar un perfil autorizado, se retiran sus referencias personales de códigos y correo de comprobantes sin convertir códigos usados en reutilizables.

Antes de aplicar: ejecutar `scripts/commercial-preflight.mjs`, revisar paquetes PREPARED antiguos y obtener respaldo externo al repositorio mediante `scripts/backup-commercial.mjs --authorized-acceptance --output=/ruta/segura/mi-contacto.dump`. El script requiere un cliente pg_dump/pg_restore compatible con la versión del servidor, variables exclusivas existentes, TLS verificado, archivo privado y valida el archivo con pg_restore --list y SHA256. No imprime credenciales. Aplicar después `node scripts/migrate.mjs --isolated-test` únicamente en la base exclusiva autorizada y desplegar el mismo commit probado. El arranque rechaza un esquema sin migración o con hashes distintos.

No se hizo respaldo/restauración del Railway activo ni se aplicó 016 allí. La restauración real con pg_dump/pg_restore se prueba en PostgreSQL nativo desechable, incluyendo inventario cifrado, perfiles previos e identidades. No hacer downgrade ciego a un runtime de 15 migraciones: el control de esquema lo rechazará. Ante un fallo, preservar DB/volumen y corregir hacia adelante; una restauración sobre datos activos exige decisión expresa y una ventana controlada.

## Pruebas y evidencia

185 pruebas locales aprobadas. Nueve recorridos Chromium: tres tamaños para fotografías/moderación/códigos, tres para correo y tres para el ciclo completo de pago de prueba, directorio, mudanza, Maps, compartir, QR, privacidad y eliminación ADMIN. CI SUCCESS del commit 0182f88: 185/185 en regresión, 51/51 comprobaciones nativas y los nueve recorridos de navegador. Incluye concurrencia, migración, reinicio, restauración y compatibilidad de órdenes anteriores al cambio de tarifa. Resultados y capturas en el artefacto `mi-contacto-integral-acceptance`; ver la ejecución correspondiente al commit final de esta rama. Los pagos y correos de estos recorridos usan proveedores sintéticos; no son pruebas de proveedores reales ni dispositivos físicos.

La primera ejecución detectó una carrera de la prueba de logout: consultaba antes del HTTP 204. Se corrigió esperando esa respuesta, sin retirar la exigencia de sesión 401. La revisión posterior `f2fd7ba` aprobó todos los bloques; los resultados finales de esta entrega se registran en `evidence/integral-close-20261106/release.json`.

## Estado externo y acciones exclusivas del propietario

| Componente | Estado real / acción necesaria |
| --- | --- |
| Railway/PostgreSQL | Existentes y conservados. Autorizar publicación de esta rama y migración 016, después de preflight y respaldo. Sin recursos nuevos. |
| Google | Variables OAuth ya presentes. Callback `https://micontacto.online/auth/google/callback`; llegada a Google verificada previamente. El titular debe completar el acceso real, comprobar retorno/perfil y cierre. Para conservar una cuenta privada previa, primero verificar/vincular su correo dentro de esa sesión y después vincular Google; no crear un perfil adicional. |
| Correo | Falta `MC_RESEND_API_KEY` en Mi Contacto. Copiar privadamente la credencial autorizada del proveedor existente a este servicio, sin publicarla en chat/GitHub. Habilitar `MC_AUTH_EMAIL_ENABLED=true` y destinatarios de ensayo `MC_AUTH_EMAIL_RECIPIENTS`. Comprobantes: `MC_EMAIL_TEST_ENABLED=true` y `MC_EMAIL_TEST_RECIPIENTS`. Remitente existente `mi-contacto@mail.direcciones507.com`, con aislamiento y reutilización explícitos. No se enviaron correos reales. |
| R2 | Faltan `MC_R2_ACCOUNT_ID`, `MC_R2_ACCESS_KEY_ID`, `MC_R2_SECRET_ACCESS_KEY`. Usar proveedor/bucket autorizados existentes, prefijo `mi-contacto/`; luego activar `MC_STORAGE=r2`, conservar `MC_PHOTO_ROOT` y `MC_R2_MIGRATE_LOCAL=true`. El almacenamiento local existente se mantiene; no se certificó R2 real. |
| Yappy | Todo permanece TEST y deshabilitado en el servicio. Faltan credenciales/permiso UAT para pruebas reales. Live y cobros reales no autorizados. |
| Legales/acceso privado | No se aprobaron textos en nombre del propietario. Revisar titular, contacto, retención y tratamiento antes de `MC_LEGAL_APPROVED`; mantener aceptación privada durante las pruebas. |

No se requieren cuentas nuevas. Las herramientas disponibles devuelven los secretos de Railway enmascarados; no se pueden transferir sus valores por ese medio. No se tocaron Direcciones507/LATAM, Empleos.pa, main, DNS, bases ajenas ni recursos facturables adicionales. No se afirma costo cero de los servicios que ya están activos.

## Prueba de aceptación después del despliegue autorizado

1. Entrar a la cuenta original, completar datos y foto en un solo Guardar y publicar; comprobar revisión ADMIN y URL/QR.
2. ADMIN → Generador de códigos: generar tres, reservar uno, registrar venta y pago manual, copiarlo. Verificar que no se activa ningún perfil al generarlo/venderlo.
3. En el perfil elegible sin saldo vigente, usar Ya tengo un código. Confirmar un día, rechazar su uso en otra cuenta y comprobar historial. Comprobar que código guardado no vence.
4. Probar fotos adicionales con saldo; agotarlo solo con datos de ensayo, comprobar ocultación sin borrado. No alterar vigencias reales para probar.
5. Ejecutar Google, verificación de correo, recuperación y R2 solo una vez configurados; comprobar sus evidencias reales. No sustituirlas por los resultados sintéticos.

No está certificada para lanzamiento comercial: faltan autorización de despliegue, integraciones externas reales, aprobación legal y aceptación del propietario. El código ejecutable y los controles que no dependen de esas autorizaciones quedan preparados y probados.

## Evidencia final y archivos

[GitHub Actions SUCCESS](https://github.com/direcciones507/mi-contacto/actions/runs/42161414730) · [Capturas y resultados nativos](https://github.com/direcciones507/mi-contacto/actions/runs/42161414730/artifacts/13476817733). Artefacto disponible siete días; el resumen JSON queda versionado en este repositorio.

Listado de archivos de la implementación:

- `.github/workflows/final-acceptance.yml`
- `application.js`
- `auth-runtime.js`
- `code-payment-client.js`
- `codes-client.js`
- `codes-runtime.js`
- `dashboard.js`
- `db/016_commercial_codes.sql`
- `docs/INTEGRAL-CLOSE-20261106.md`
- `docs/MASTER-CHECKLIST.md`
- `email-auth-client.js`
- `email-auth-view.js`
- `erasure.js`
- `feature-runtime.js`
- `payment-runtime.js`
- `runtime.css`
- `scripts/backup-commercial.mjs`
- `scripts/browser-validation.mjs`
- `scripts/commercial-preflight.mjs`
- `scripts/email-auth-browser.mjs`
- `scripts/native-auth-validation.mjs`
- `scripts/start-server.mjs`
- `scripts/visual-forms-browser.mjs`
- `tests/commercial-codes.test.mjs`
- `tests/email-auth.test.mjs`
- `tests/payment-runtime.test.mjs`
- `tests/runtime.test.mjs`
- `tests/unification-consent-territory.test.mjs`
- `views.js`

Se agregan también los resúmenes JSON en `docs/evidence/integral-close-20261106/`.
