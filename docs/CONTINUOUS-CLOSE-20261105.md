# Mi Contacto — cierre de construcción y verificación, 5 noviembre 2026

## Estado exacto

Se consultó GitHub y se recuperó la rama remota más reciente `work/private-access-close-20261105`, commit `3b4a8a5`, descendiente de `c8e8398`. Se trabajó en `work/continuous-close-20261105`; implementación `3a1b7a5`. No se alteraron cambios sin guardar de otros directorios ni main.

La corrección privada de multipestaña ya estaba implementada y desplegada. Se conserva y se comprueba, sin volver a construirla. Fotografías, territorio, QR, Maps, consentimientos y moderación también existían; se ejecuta su regresión, sin atribuirlos a esta implementación.

## Construcción nueva

- Registro por correo y contraseña; no se crea una cuenta habilitada hasta confirmar el correo y demostrar conocimiento de la contraseña elegida. No hay sesión automática al abrir un enlace.
- Contraseñas derivadas con scrypt y sal independiente; comprobaciones de tamaño y comparación constante. La base no almacena contraseñas ni tokens de correo en claro.
- Verificación y recuperación con token aleatorio, hash persistido, vencimiento de 30 minutos y consumo transaccional de un uso. El enlace usa fragmento; el navegador lo retira inmediatamente, evitando enviarlo al servidor HTTP.
- Recuperación genérica para cuentas conocidas/desconocidas y fallos del transporte; registro repetido no cambia la contraseña. Límites persistentes por dirección/acción y techo global, sin confiar en IP reenviada. Filas de límites caducadas se limpian.
- Recuperación y cambio revocan todas las sesiones y tokens pendientes. Login y modificación de contraseña serializan el uso de la identidad para evitar emitir una sesión con una contraseña anterior durante un restablecimiento.
- Vinculación de correo a la cuenta Google actual: mismo usuario, sesión, CSRF y confirmación por correo con contraseña. Vinculación de Google a la cuenta de correo: contraseña actual, CSRF, sesión vinculada al state, PKCE/nonce y comprobación criptográfica existente. No vincula por coincidencia de correo ni fusiona cuentas distintas.
- Pantalla exclusiva de Mi Contacto `/acceso`, enlace desde el panel y opciones condicionales según configuración. Registro, login, recuperación, cambio y vinculación.
- Transporte transaccional configurable reutilizando el proveedor existente; apagado por defecto, aislamiento obligatorio y lista de destinatarios obligatoria en aceptación. Ningún correo real enviado.
- Migración aditiva `015_email_auth.sql`; se preservan identificadores Google y las tablas de perfiles/fotos. Puerta de arranque exige migraciones/checksums; respaldo previo de aceptación actualizado para proteger 015.

El recorrido de navegador detectó y permitió corregir un defecto real: abrir el enlace recibido en la misma pestaña de `/acceso` era una navegación solo de fragmento y no ejecutaba nuevamente el módulo. Ahora procesa `hashchange`; los tres tamaños verifican confirmación y eliminación del fragmento.

## Pruebas ejecutadas

`node --test --test-concurrency=2 tests/*.test.mjs`: **168 aprobadas, 0 fallidas, 0 omitidas**. Incluye regresión de sesiones, OAuth firmado con proveedor sintético, identidad única, restricciones de galería, privacidad, marca en píxeles, denuncias/ADMIN, territorio, enlaces/QR/Maps, persistencia y migraciones sobre PostgreSQL WASM local. Los subconjuntos no se suman de nuevo.

`node scripts/private-access-browser.mjs`: tres recorridos Chromium 390/820/1440, emulación Android/iPad/escritorio. Entrada por formulario con credencial sintética, pestañas, cookies, rechazo CSRF, consentimiento, creación, subida/vista previa/reemplazo/retirada, cuatro fotos adicionales bloqueadas sin Destacado, marca en imagen, denuncia pública, ocultación ADMIN, apelación y auditoría. Sin errores JS ni desbordamiento.

`node scripts/email-auth-browser.mjs`: tres recorridos Chromium 390/820/1440. Registro → confirmación en misma pestaña → login → recuperación → revocación → nuevo login → cambio → revocación. Sin errores JS ni desbordamiento. Correo capturado solo en memoria de prueba.

`npm audit --omit=dev --json`: **0 vulnerabilidades conocidas**. `git diff --check`: correcto.

Un primer recorrido detectó el fallo de fragmento y se corrigió antes del resultado final. Un primer test de migraciones esperaba 14; se actualizó a 15 y la regresión final aprobó. El primer lanzamiento del Chromium completo fue bloqueado por sockets; el ejecutable headless estándar instalado funcionó, y los seis recorridos anteriores se ejecutaron realmente. No son pruebas en dispositivos físicos.

Evidencias actuales: [carpeta](evidence/continuous-close-20261105/), con log completo, auditoría, resultados JSON y capturas. La validación visual de la nueva pantalla móvil también se inspeccionó.

## Railway existente, comprobación en lectura

Proyecto `7d9a7fb0-df2f-487c-8885-d093e1a9c9de`, entorno `acceptance` (`4a65150e-8ee4-4d22-917e-3ae3de82a380`). Aplicación y PostgreSQL online, una réplica activa cada uno, sin fallos recientes ni cambios pendientes. Se conservan volúmenes y límites 0.25 vCPU/500 MB de aplicación.

Aplicación desplegada: **`3b4a8a5`**, deployment `44ab02b9-d2b9-4d68-842b-f17dbe3541a8`, **SUCCESS**. Logs de arranque: 14 migraciones, TLS verificado, persistencia tras reinicio y respaldo/restauración anterior comprobados. Esto certifica la versión actualmente desplegada; no demuestra que 015 esté aplicada.

HTTP actual: `/health/ready`, `/api/auth-options`, `/mi-perfil`, `/acceso-pruebas`, `/api/legal`, `/api/countries` y `/api/directory?country=PA` devuelven 200; `/api/session` sin sesión devuelve 401. Acceso privado habilitado y cookie Secure; Google deshabilitado. Los nombres de variables confirman ausencia de Google/R2/correo exclusivos; no se leen valores secretos.

Enlace existente: https://mi-contacto-acceptance-acceptance.up.railway.app/mi-perfil . Acceso original: https://mi-contacto-acceptance-acceptance.up.railway.app/acceso-pruebas . No se generaron accesos alternativos ni se intentó adivinar/restablecer el código.

**El nuevo acceso por correo de esta rama no está desplegado.** No se modificó Railway ni PostgreSQL ni se activaron builds/envíos/cobros. La migración 015 sigue sin aplicarse a la base remota.

## Pendientes y dependencias reales

1. Validar 015 y carreras de autenticación en un entorno PostgreSQL nativo descartable. El arnés del proyecto exige un ejecutor no root existente; este ejecutor es root y no se eludió esa restricción. WASM no certifica concurrencia nativa.
2. Actualizar la aceptación existente con esta rama y migración tras esa validación y dentro del presupuesto autorizado; no se ha hecho ni se presenta como terminado. Producción permanece sin autorización de despliegue.
3. Propietario: abrir su acceso original para el recorrido autenticado en Railway. No se verificaron allí subida, marca ni moderación con una sesión del propietario; las pruebas actuales de esos flujos son locales.
4. Propietario/configuración exclusiva: habilitar Google OAuth, remitente de correo verificado/proveedor y R2 si se desea sustituir el volumen privado. Configuración preparada en `.env.example`; no se crean recursos ni se exponen credenciales. Google real, correo real y R2 real siguen pendientes.
5. Propietario: aceptación en dispositivos físicos, revisión territorial y aprobación jurídica de los borradores. No hay cierre comercial/producción mientras falten estas puertas.

No se creó infraestructura, no se borraron/reemplazaron bases, no se modificaron perfiles ni fotografías remotos, no se ampliaron recursos, no se dispararon Actions y no se modificaron otros proyectos. Se conserva el plazo y apagado previamente configurado; no se extendió cómputo.
