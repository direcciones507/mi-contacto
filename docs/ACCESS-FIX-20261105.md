# Corrección de acceso de aceptación

Commit funcional: `161d1787e5f25a6fb4b50d34c8f717ca5fd42515`.
Rama: `work/infrastructure-acceptance-20261104`.

Se reprodujo el POST real contra Railway en Chromium con pantallas de computadora, teléfono y tableta: Origin null, Sec-Fetch-Site same-origin, respuesta 403. La política global no-referrer anulaba Origin durante el envío HTML; las pruebas HTTP anteriores proporcionaban Origin manualmente y no detectaron este comportamiento del navegador.

La página /acceso-pruebas ahora entrega Referrer-Policy same-origin. Se conserva no-referrer fuera de esa ruta, el rechazo estricto de Origin null/ausente/externo, Sec-Fetch-Site cross-site, desafío CSRF firmado, cookies HttpOnly/Secure/SameSite=Strict y límite de intentos. El origen público se normaliza con applicationOrigin; nunca se confía en Host o X-Forwarded-* del proxy para autorizar. Un POST exitoso con el Origin HTTPS exacto confirma su coincidencia con MC_ORIGIN aunque Railway OAuth no permita leer el valor de la variable.

135 pruebas Node aprobadas, cero fallidas/omitidas. Evidencias before/after en evidence/access-fix-20261105, sin códigos, cookies ni tokens. Prueba real sobre Railway, navegador Chromium y emulación de pantalla/dispositivo; no dispositivos físicos ni Safari. El proxy de salida del entorno de pruebas requiere excepción de su CA en el navegador automatizado; la aplicación no modifica TLS ni cookies.

La verificación abre el editor mediante Crear mi perfil sin guardar fichas ni alterar perfiles del propietario. No cambia pagos, otros proyectos, recursos ni fecha de cierre de las 48 horas.
