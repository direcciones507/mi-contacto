# Dominio oficial y cierre verificable

Rama work/official-origin-20261106; base 0c1f2e5, conserva proveedor reutilizado 6f74acf. Código e38d1ce299eb45f140ab6f54e7dbb84aa92fe5ed.

## Resultado aplicado

Railway confirmó micontacto.online verificado, CNAME propagado hacia el destino previamente conectado y certificado VALID. Se fijó targetPort 3000 del dominio ya existente; no se cambió DNS ni se crearon dominios/servicios/bases. MC_ORIGIN=https://micontacto.online y MC_PRIVATE_OFFICIAL_ORIGIN=true, únicamente en el entorno Mi Contacto acceptance existente. MC_ACCEPTANCE_MODE, secretos, datos, límites y plazo original se conservan.

El acceso privado en el dominio oficial exige doble opción explícita de aceptación y origen exacto. Se mantiene el código existente, desafío firmado, cookies Secure/HttpOnly/SameSite y validación de Origin/CSRF. No se habilita acceso privado en una ejecución comercial normal por defecto. El arranque de aceptación reconoce el origen autorizado sin reconstruir la base; permanecen el aislamiento y las comprobaciones del propietario y del ledger. No se ejecutan migraciones nuevas.

El servidor usa el origen configurado para cookies, OAuth, correos y URLs/QR. Host ajeno se rechaza; el dominio temporal redirige navegación GET/HEAD con 308 al oficial y rechaza escrituras 403. Los callbacks OAuth del dominio anterior se rechazan para reiniciar en el origen correcto y no trasladar códigos entre cookies de hosts distintos. Salud GET/HEAD sigue accesible para Railway y tareas técnicas. No se confía en X-Forwarded-Host para autorizar cuentas. HTTPS/HSTS se comprobaron en el dominio oficial; las cookies no incluyen Domain compartido.

## Integraciones externas: bloqueos confirmados

La lectura de nombres de variables en Mi Contacto confirmó ausentes MC_GOOGLE_CLIENT_ID, MC_GOOGLE_CLIENT_SECRET, MC_R2_ACCOUNT_ID, MC_R2_ACCESS_KEY_ID, MC_R2_SECRET_ACCESS_KEY y MC_RESEND_API_KEY. valuesRedacted=true impide que el conector recupere los valores de Direcciones507 para trasladarlos. No son nuevas cuentas ni infraestructura; se deben configurar los valores existentes por canal privado.

Google: añadir en el cliente OAuth existente, conservando callbacks anteriores, **https://micontacto.online/auth/google/callback**. Configurar MC_GOOGLE_CLIENT_ID/SECRET en Mi Contacto y autorizar el usuario de pruebas si la aplicación está en modo Testing. La interfaz seguirá usando Mi Contacto; sesiones y usuarios nunca se comparten con Direcciones507.

R2: copiar privadamente R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY como MC_R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY. El bucket y flags de reutilización ya están preparados; antes de cambiar MC_STORAGE de local a r2, ejecutar la prueba de objeto técnico y comprobar la transición de fotos anteriores con MC_R2_MIGRATE_LOCAL=true. No borrar originales. No se afirma haber probado R2 real sin las claves.

Correo: copiar RESEND_API_KEY como MC_RESEND_API_KEY; remitente preparado Mi Contacto <mi-contacto@mail.direcciones507.com>, bajo dominio verificado de la cuenta existente. Se requiere verificar que la clave permite ese dominio y definir destinatarios autorizados de pruebas. Solo entonces habilitar MC_AUTH_EMAIL_ENABLED y/o MC_EMAIL_TEST_ENABLED según el recorrido. La autorización real del envío/recepción de esa dirección aún no fue comprobada con el proveedor. Verificación, recuperación, vinculación y comprobante tienen plantillas y pruebas sintéticas; notificaciones/correos administrativos no tienen certificación de entrega real. No se activaron envíos a terceros.

## Pruebas y alcance

178 pruebas locales aprobadas, cero fallidas/omitidas. Casos nuevos cubren origen oficial, doble opción de acceso privado, host ajeno, redirección segura, rechazo del temporal para escritura y callbacks antiguos, salud técnica, cookies y CSRF.

Las pruebas nativas y recorridos integrales del CI ejecutan PostgreSQL real aislado y proveedores sintéticos; no equivalen a Google/R2/correo externos reales ni a dispositivos físicos. Se guardan por separado evidencias del dominio Railway real.

Yappy Live apagado; Direcciones507/LATAM no se modificó. No hay recursos facturables adicionales ni ampliaciones. No se puede confirmar factura/crédito con el conector. Cierre de cómputo original: 6 noviembre 2026 a las 14:02:48 de Panamá, sin extensión automática; los volúmenes retenidos pueden generar consumo.

No listo para lanzamiento comercial mientras falten integraciones externas reales, aceptación del responsable y pruebas físicas; no basta activar Yappy para certificar todo el sistema.

## Despliegue y CI finales

Railway bb4e8331-41ad-4b3e-aced-7ab9a00bef71 SUCCESS. CI exacto https://github.com/direcciones507/mi-contacto/actions/runs/42141575097 SUCCESS: regresión, PostgreSQL nativo con concurrencia/reinicio/backup-restauración y seis recorridos de navegador. La petición HTTPS real a /acceso-pruebas devolvió 200 con HSTS y verificación TLS normal del cliente. No hay CLI Railway ni token privado disponible, por lo que tampoco existe una vía alternativa autorizada para leer y trasladar secretos.

Recorridos autenticados reales del dominio oficial completados: escritorio, teléfono y tableta emulados, login privado original, ADMIN, logout 204 y sesión posterior 401; rechazo externo y CSRF ausente 403; temporal GET 308 a origen oficial, temporal POST 403 y salud técnica 200; HSTS presente y 15 migraciones/TLS verificado. Cero errores JS y datos sin cambios. Evidencia live-authenticated.json. No son dispositivos físicos ni prueba de proveedores externos.
