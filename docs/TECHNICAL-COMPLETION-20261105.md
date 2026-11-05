# Cierre técnico verificable — 5 noviembre 2026, Panamá

Rama `work/technical-completion-20261105`, base `1ca028d` que contiene la versión funcional desplegada `826bdee` y las ramas de autenticación/territorio/moderación/fotografías. No se reemplazó el trabajo local anterior: recuperación en checkout separado.

## Implementación de esta entrega

- `password-work.js`, `email-auth.js`: máximo dos derivaciones scrypt simultáneas y ocho en espera por proceso. Rechazo acotado de sobrecarga sin revelar cuentas, liberación de cupos tras fallos. Protege la instancia existente de 0.5 GB sin ampliar memoria.
- `transactional-email.js`: plantillas en texto y HTML en español para registro/verificación, vinculación y recuperación; escape HTML, validación del propósito, URL de acceso, token y plazo. Documento reutilizado por el comprobante de pago de prueba.
- `auth-email-transport.js`, `receipt-resend.js`: remitente exclusivo micontacto.online/mail.micontacto.online, destinatarios de aceptación explícitos, origen exacto, clave idempotente estable, respuesta del proveedor acotada y confirmación con ID antes de declarar envío aceptado. No se envía nada al iniciar ni se activaron envíos reales.
- `acceptance-config.js`: acceso por correo configurado es alternativa válida a Google, alineado con el arranque real; configuración incompleta o ajena bloqueada sin revelar secretos.
- `legal.js`: versión 2026-11-05.2 reconoce Google o correo verificado y vinculación sin segundo perfil. Nueva aceptación no se impone ni firma por el propietario; los registros anteriores se conservan. Los textos siguen sujetos a aprobación legal del responsable.
- Pruebas nuevas en `tests/transactional-email.test.mjs`, regresión de autenticación/preflight y workflow nativo para la rama aislada.

## Integraciones existentes y límites reales

Railway Mi Contacto exclusivo, mismos servicios PostgreSQL y aplicación, mismos volúmenes y límites. Sin bases nuevas, cambios DNS, pagos reales, ampliaciones ni cambios en Direcciones507/LATAM. Cierre original: 6 noviembre 2026 14:02:48 Panamá, sin extenderlo. No se han contratado recursos adicionales; costo adicional facturado de esta entrega no consultable. El entorno ya autorizado sigue consumiendo recursos; no se promete costo cero ni tope automático.

Verificación real de acceso privado original, sesión ADMIN, rechazo de origen externo y CSRF ausente en tres tamaños/dispositivos emulados: `evidence/technical-completion-20261105/live-authenticated.json`. PostgreSQL remoto reporta 15 migraciones y TLS verificado. No se generó ni rotó el código; no se guardaron tokens, cookies ni datos personales. El recorrido fue de lectura, sin aceptar condiciones por el propietario. No equivale a Google/R2/correo reales ni dispositivos físicos. El proxy del ejecutor requiere excepción de su CA solo en Chromium; servidor y PostgreSQL conservan TLS verificado.

## Accesos exclusivos necesarios para concluir pruebas externas

| Integración | Configuración exclusiva faltante | Prueba posterior |
|---|---|---|
| Google | MC_GOOGLE_CLIENT_ID, MC_GOOGLE_CLIENT_SECRET de aplicación exclusiva; redirect https://mi-contacto-acceptance-acceptance.up.railway.app/auth/google/callback; usuarios de prueba autorizados | login/logout, vinculación y perfil único reales |
| Correo | remitente verificado de mail.micontacto.online o micontacto.online; MC_RESEND_API_KEY exclusiva y MC_EMAIL_FROM; destinatarios permitidos MC_AUTH_EMAIL_RECIPIENTS/MC_EMAIL_TEST_RECIPIENTS; MC_EMAIL_ISOLATED=true | entrega real de confirmación, recuperación/vinculación y comprobante de prueba |
| R2 | bucket privado exclusivo mi-contacto-*, MC_R2_ACCOUNT_ID, MC_R2_ACCESS_KEY_ID, MC_R2_SECRET_ACCESS_KEY, MC_R2_BUCKET, MC_R2_ISOLATED=true | PUT/GET/reemplazo/DELETE reales sobre objeto técnico y entrega con marca/permisos |

El inventario de Resend solo mostró mail.direcciones507.com y mail.empleospa.com verificados. No se reutilizan. Railway no tiene variables Google/R2/correo de Mi Contacto configuradas. Configurar por canal seguro, nunca pegar secretos en documentación ni Git. Se puede continuar local/nativo y preparar el código sin estas credenciales; no se puede certificar servicio externo real sin ellas.

Yappy y dominio definitivo quedan para el propietario. También le corresponden la titularidad de las cuentas externas/DNS de correo, aceptación legal y prueba en sus dispositivos físicos. La conexión final de DNS de la aplicación sigue sin realizarse.

## Resultado final comprobado

Código desplegado `9f2a26ab55185122dec4999a1bd3038c833d3ed9`; Railway `23357c20-33b7-4710-9460-0419f0c24df2` SUCCESS, ambos servicios online, sin fallos recientes ni trabajo pendiente. No hay nuevas migraciones ni cambios de PostgreSQL en esta entrega.

CI exacto SUCCESS: https://github.com/direcciones507/mi-contacto/actions/runs/42130842667 . Regresión integrada, validación PostgreSQL nativa 015 con concurrencia/reinicio/backup-restauración y seis recorridos de navegador contra PostgreSQL nativo aprobados. Proveedores Google/correo siguen sintéticos en CI. 173 pruebas locales aprobadas, cero fallidas/omitidas; auditoría de producción cero vulnerabilidades conocidas.

Railway real posterior al despliegue: acceso privado ADMIN en computadora/teléfono/tableta emulados, rechazo de origen externo y CSRF ausente; cierre de sesión propia comprobado en escritorio (401 posterior). No se modificaron fichas ni datos del propietario ni se aceptó su política en su nombre. Evidencia: live-authenticated.json y live-logout.json.

Plantilla de recuperación renderizada en 390/820/1440 px con acción segura visible. Los otros propósitos comparten el documento HTML validado por pruebas. Estas capturas son de plantillas sintéticas, no pruebas de entrega de correo.

No se certifica 100% de integraciones reales: los tres accesos exclusivos descritos arriba siguen faltando. La construcción y pruebas independientes de estas credenciales avanzaron y están guardadas/desplegadas; no se etiquetan servicios simulados como reales.
